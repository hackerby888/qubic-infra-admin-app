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

export default function Map() {
    let [currentService, setCurrentService] = useState<ServiceType>("liteNode");

    let { data: statuses } = useGeneralGet<{
        liteNodes: LiteNodeTickInfo[];
        bobNodes: BobNodeTickInfo[];
    }>({
        queryKey: ["servers-status"],
        path: "/servers-status",
        refetchInterval: 15000,
    });

    let { mutate: updateServersForMap, data: mapData } = useGeneralPost<{
        servers: {
            server: string;
            lat: number;
            lon: number;
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
                    isActive,
                };
            }) || []
        ).filter((s) => {
            // filter based on service
            if (currentService === "liteNode") {
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
                    Lite Nodes
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
            <GlobalDataPulseMap nodes={renderServersMap} />
        </div>
    );
}
