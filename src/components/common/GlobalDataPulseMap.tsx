import { memo, useEffect, useRef } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";

function GlobalDataPulseMap({
    nodes: nodes,
}: {
    nodes: {
        server: string;
        lat: number;
        lon: number;
        isActive: boolean;
        isBM: boolean;
        isCheckinNode: boolean;
        type: string | undefined;
        lastCheckinAt: number | undefined;
    }[];
}) {
    console.log("Rendering GlobalDataPulseMap with nodes:", nodes);
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        // @ts-ignore
        const width = container.clientWidth;
        // @ts-ignore
        const height = container.clientHeight;

        const svg = d3
            .select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("background", "#05070a");

        const g = svg.append("g");

        const projection = d3
            .geoNaturalEarth1()
            .scale(width / 5.5)
            .translate([width / 2, height / 1.7]);

        const path = d3.geoPath(projection);

        svg.call(
            d3
                .zoom<SVGSVGElement, unknown>()
                .scaleExtent([1, 12])
                .on("zoom", (e) => g.attr("transform", e.transform.toString()))
        );

        const init = async () => {
            const world = (await d3.json(
                "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
            )) as any;

            const countries = topojson.feature(
                world,
                world.objects.countries
            ) as any;

            g.append("path")
                .datum(d3.geoGraticule())
                .attr("fill", "none")
                .attr("stroke", "rgba(255,255,255,0.02)")
                .attr("d", path);

            g.selectAll(".country")
                .data(countries.features)
                .enter()
                .append("path")
                .attr("d", path as any)
                .attr("fill", "#12171e")
                .attr("stroke", "#2a3139")
                .attr("stroke-width", 0.5);

            let xyMap: { [server: string]: [number, number] } = {};
            let colorMap: { [server: string]: string } = {};
            let countryCounts: { [country: string]: number } = {};
            nodes.forEach((n) => {
                const country = countries.features.find((feature: any) =>
                    d3.geoContains(feature, [n.lon, n.lat])
                );
                if (country) {
                    const countryName = country.properties.name;
                    countryCounts[countryName] =
                        (countryCounts[countryName] || 0) + 1;
                }
            });
            console.log("Node counts by country:", countryCounts);

            nodes.forEach((n) => {
                console.log("Plotting node on map:", n);
                // @ts-ignore
                let [x, y] = projection([n.lon, n.lat]);

                const country = countries.features.find((feature: any) =>
                    d3.geoContains(feature, [n.lon, n.lat])
                );

                if (!country) {
                    // skip nodes in ocean (or handle differently)
                    return;
                }

                // if there is many nodes in the country, we draw randomly around the country center
                if (countryCounts[country.properties.name] >= 2) {
                    const maxRadius = 10; // px
                    const attempts = 10;
                    let baseXY = [x, y];

                    for (let i = 0; i < attempts; i++) {
                        const angle = Math.random() * 2 * Math.PI;
                        const radius = 2 + Math.random() * maxRadius;

                        const jx = baseXY[0] + radius * Math.cos(angle);
                        const jy = baseXY[1] + radius * Math.sin(angle);

                        // invert back to lon/lat to validate
                        // @ts-ignore
                        const lonLat = projection.invert([jx, jy]) as [
                            number,
                            number,
                        ];

                        if (lonLat && d3.geoContains(country, lonLat)) {
                            x = jx;
                            y = jy;
                            break;
                        }
                    }
                }
                xyMap[n.server] = [x, y];

                // check if the point is belong to a country
                let targetColor;
                if (n.isCheckinNode) {
                    targetColor = n.isActive ? "#c92bfb" : "#fb2b2b";
                } else {
                    targetColor = n.isBM
                        ? "#00ff65"
                        : n.isActive
                          ? "#00f2ff"
                          : "#fb2b2b";
                }
                colorMap[n.server] = targetColor;

                g.append("circle")
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", 2)
                    .attr("fill", targetColor);

                const pulse = g
                    .append("circle")
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", 2)
                    .attr("fill", targetColor)
                    .attr("opacity", 0.6);

                const animate = () => {
                    pulse
                        .attr("r", 2)
                        .attr("opacity", 0.6)
                        .transition()
                        .duration(2000 + Math.random() * 1000)
                        .ease(d3.easeLinear)
                        .attr("r", 8)
                        .attr("opacity", 0)
                        .on("end", animate);
                };
                animate();
            });

            const createTransmission = () => {
                if (nodes.length < 2) return;
                let activeNodes = nodes.filter((n) => n.isActive);
                const a =
                    activeNodes[Math.floor(Math.random() * activeNodes.length)];
                let b =
                    activeNodes[Math.floor(Math.random() * activeNodes.length)];
                while (a === b)
                    b =
                        activeNodes[
                            Math.floor(Math.random() * activeNodes.length)
                        ];

                const [sx, sy] = xyMap[a.server];
                const [tx, ty] = xyMap[b.server];

                const mx = (sx + tx) / 2;
                const my = (sy + ty) / 2 - Math.hypot(tx - sx, ty - sy) / 4;

                const d = `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`;

                const p = g
                    .append("path")
                    .attr("d", d)
                    .attr("fill", "none")
                    .attr("stroke", colorMap[a.server])
                    .attr("stroke-width", 1.1)
                    .attr("stroke-linecap", "round");

                // @ts-ignore
                const len = p.node().getTotalLength();
                p.attr("stroke-dasharray", len)
                    .attr("stroke-dashoffset", len)
                    .transition()
                    .duration(800 + Math.random() * 800)
                    .ease(d3.easeQuadInOut)
                    .attr("stroke-dashoffset", 0)
                    .transition()
                    .duration(300)
                    .attr("opacity", 0)
                    .remove();
            };

            const loop = () => {
                const burst = Math.floor(Math.random() * 5) + 3;
                for (let i = 0; i < burst; i++) {
                    setTimeout(createTransmission, Math.random() * 200);
                }
                setTimeout(loop, 200 + Math.random() * 300);
            };

            loop();
        };

        init();

        return () => {
            d3.select(container).selectAll("*").remove();
        };
    }, [nodes]);

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

export default memo(GlobalDataPulseMap);
