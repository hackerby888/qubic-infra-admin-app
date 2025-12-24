import GlobalDataPulseMap from "@/components/common/GlobalDataPulseMap";
import { Button } from "@/components/ui/button";
import useGeneralPost, { useGeneralGet } from "@/networking/api";
import type {
    BobNodeTickInfo,
    LiteNodeTickInfo,
    ServiceType,
} from "@/types/type";
import { isNodeActive } from "@/utils/common";
import { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";

export default function Map() {
    let [currentService, setCurrentService] = useState<ServiceType>("liteNode");
    let [countryCounts, setCountryCounts] = useState<{
        [country: string]: number;
    }>({});

    let { data: statuses } = useGeneralGet<{
        liteNodes: LiteNodeTickInfo[];
        bobNodes: BobNodeTickInfo[];
    }>({
        queryKey: ["servers-status"],
        path: "/servers-status",
    });

    let { mutate: updateServersForMap, data: mapData } = useGeneralPost<{
        servers: {
            server: string;
            lat: number;
            lon: number;
            isBM: boolean;
        }[];
    }>({
        queryKey: ["servers-for-map"],
        path: "/server-info-for-map",
    });

    let renderServersMap = useMemo(() => {
        return (
            mapData?.servers.map((s) => {
                let isActive = false;
                if (currentService === "liteNode") {
                    let nodeStatus = statuses?.liteNodes.find(
                        (node) => node.server === s.server
                    );
                    isActive = nodeStatus
                        ? isNodeActive(nodeStatus.lastTickChanged)
                        : false;
                } else if (currentService === "bobNode") {
                    let nodeStatus = statuses?.bobNodes.find(
                        (node) => node.server === s.server
                    );
                    isActive = nodeStatus
                        ? isNodeActive(nodeStatus.lastTickChanged)
                        : false;
                }
                return {
                    ...s,
                    isActive: s.isBM ? true : isActive,
                };
            }) || []
        ).filter((s) => {
            // filter based on service
            if (currentService === "liteNode") {
                if (s.isBM) {
                    return true;
                }
                return statuses?.liteNodes.some(
                    (node) => node.server === s.server
                );
            } else if (currentService === "bobNode") {
                return statuses?.bobNodes.some(
                    (node) => node.server === s.server
                );
            }
        });
    }, [currentService, mapData, statuses]);

    useEffect(() => {
        const init = async () => {
            const world = (await d3.json(
                "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
            )) as any;

            const countries = topojson.feature(
                world,
                world.objects.countries
            ) as any;

            let countryCounts: { [country: string]: number } = {};

            renderServersMap.forEach((n) => {
                const country = countries.features.find((feature: any) =>
                    d3.geoContains(feature, [n.lon, n.lat])
                );
                if (country) {
                    const countryName = country.properties.name;
                    countryCounts[countryName] =
                        (countryCounts[countryName] || 0) + 1;
                }
            });

            setCountryCounts(countryCounts);
        };
        init();
    }, [renderServersMap]);

    useEffect(() => {
        updateServersForMap();
    }, []);

    return (
        <div className="w-full h-full relative overflow-hidden">
            <div className="absolute top-4 left-4 text-white font-bold z-10 flex justify-center w-full space-x-4">
                <Button
                    onClick={() => setCurrentService("liteNode")}
                    className={`cursor-pointer hover:bg-cyan-500 ${
                        currentService === "liteNode" ? "bg-cyan-600" : ""
                    }`}
                >
                    BM Nodes
                </Button>
                <Button
                    onClick={() => setCurrentService("bobNode")}
                    className={`cursor-pointer hover:bg-cyan-500 ${
                        currentService === "bobNode" ? "bg-cyan-600" : ""
                    }`}
                >
                    Bob Nodes
                </Button>
            </div>
            <div className="absolute p-2 right-2 top-2 bg-white-600 text-white">
                <ul className="">
                    {Object.entries(countryCounts).map(([country, count]) => (
                        <li key={country} className="text-xs text-white">
                            {country}: {count}
                        </li>
                    ))}
                </ul>
            </div>
            <GlobalDataPulseMap nodes={renderServersMap} />
        </div>
    );
}
