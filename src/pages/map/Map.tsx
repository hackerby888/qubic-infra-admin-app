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

    let { data: statuses, isFetched: statusesFetched } = useGeneralGet<{
        liteNodes: LiteNodeTickInfo[];
        bobNodes: BobNodeTickInfo[];
    }>({
        queryKey: ["servers-status"],
        path: "/servers-status",
    });

    let {
        mutate: updateServersForMap,
        data: mapData,
        isSuccess: mapDataFetched,
    } = useGeneralPost<{
        servers: {
            server: string;
            lat: number;
            lon: number;
            isBM: boolean;
            isCheckinNode: boolean;
            type: string | undefined;
            lastCheckinAt: number | undefined;
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
                    if (s.isCheckinNode) {
                        // if lastCheckinAt within 1 hour, consider active
                        isActive = s.lastCheckinAt
                            ? Date.now() - s.lastCheckinAt < 60 * 60 * 1000
                            : false;
                    } else {
                        isActive = nodeStatus
                            ? isNodeActive(nodeStatus.lastTickChanged)
                            : false;
                    }
                } else if (currentService === "bobNode") {
                    let nodeStatus = statuses?.bobNodes.find(
                        (node) => node.server === s.server
                    );
                    if (s.isCheckinNode) {
                        // if lastCheckinAt within 1 hour, consider active
                        isActive = s.lastCheckinAt
                            ? Date.now() - s.lastCheckinAt < 60 * 60 * 1000
                            : false;
                    } else {
                        isActive = nodeStatus
                            ? isNodeActive(nodeStatus.lastTickChanged)
                            : false;
                    }
                }
                return {
                    ...s,
                    isActive: s.isBM ? true : isActive,
                };
            }) || []
        ).filter((s) => {
            // always include checkin nodes
            if (s.isCheckinNode) {
                return currentService.startsWith(s.type as string);
            }
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

    let loading = !mapDataFetched || !statusesFetched;

    return (
        <div className={`w-full h-full relative overflow-hidden`}>
            {loading && (
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 text-foreground bg-card/80 border border-border px-4 py-2 rounded">
                    Loading map data...
                </div>
            )}
            <div className="absolute top-4 left-4 text-foreground font-bold z-10 flex justify-center w-full space-x-4">
                <Button
                    onClick={() => setCurrentService("liteNode")}
                    className={`cursor-pointer hover:bg-primary/80 ${
                        currentService === "liteNode"
                            ? "bg-primary text-primary-foreground"
                            : ""
                    }`}
                >
                    BM Nodes
                </Button>
                <Button
                    onClick={() => setCurrentService("bobNode")}
                    className={`cursor-pointer hover:bg-primary/80 ${
                        currentService === "bobNode"
                            ? "bg-primary text-primary-foreground"
                            : ""
                    }`}
                >
                    Bob Nodes
                </Button>
            </div>
            <div className="absolute p-2 right-2 top-2 bg-card/80 border border-border text-foreground">
                <ul className="">
                    {Object.entries(countryCounts).map(([country, count]) => (
                        <li key={country} className="text-xs text-foreground">
                            {country}: {count}
                        </li>
                    ))}
                </ul>
            </div>
            <GlobalDataPulseMap nodes={renderServersMap} />
        </div>
    );
}
