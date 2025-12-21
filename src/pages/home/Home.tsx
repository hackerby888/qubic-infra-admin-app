import type {
    LiteNodeTickInfo,
    BobNodeTickInfo,
    ServiceType,
} from "@/types/type";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiteNodeTable from "./components/LiteNodeTable";
import BobNodeTable from "./components/BobNodeTable";
import NodeStatus from "./components/NodeStatus";
import { isNodeActive } from "@/utils/common";
import { useEffect, useMemo, useState } from "react";
import socket from "@/networking/socket";
import { Earth } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import GlobalDataPulseMap from "@/components/common/GlobalMap";
import useGeneralPost from "@/networking/api";

export default function Home() {
    let [isLoading, setIsLoading] = useState<boolean>(false);
    let [currentService, setCurrentService] = useState<ServiceType>("liteNode");
    let [statuses, setStatuses] = useState<{
        liteNodes: LiteNodeTickInfo[];
        bobNodes: BobNodeTickInfo[];
    }>({ liteNodes: [], bobNodes: [] });

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

    let totalNodes = {
        liteNodes: statuses.liteNodes.length || 0,
        bobNodes: statuses.bobNodes.length || 0,
    };

    let upNodes = {
        liteNodes:
            statuses.liteNodes.filter((s) => isNodeActive(s.lastTickChanged))
                .length || 0,
        bobNodes:
            statuses.bobNodes.filter((s) => isNodeActive(s.lastTickChanged))
                .length || 0,
    };

    let downNodes = {
        liteNodes: totalNodes.liteNodes - upNodes.liteNodes,
        bobNodes: totalNodes.bobNodes - upNodes.bobNodes,
    };

    // Clone and sort statuses by tick
    let sortedLiteNodeStatuses = statuses.liteNodes
        .slice()
        .sort((a, b) => b.tick - a.tick);
    let sortedBobNodeStatuses = statuses.bobNodes
        .slice()
        .sort((a, b) => b.currentProcessingEpoch - a.currentProcessingEpoch);

    type NodeType = keyof typeof totalNodes;
    let titleNameFromNodeType = {
        liteNodes: "Lite Nodes",
        bobNodes: "Bob Nodes",
    };

    const handleUpdateMapServers = () => {
        updateServersForMap({} as any, {
            onSuccess: (data) => {
                console.log("Successfully updated map servers", data.servers);
            },
            onError: (error) => {
                console.error("Error updating map servers", error);
            },
        });
    };

    useEffect(() => {
        setIsLoading(true);
        socket.emit("subscribeToRealtimeStats", {
            service: currentService,
            operator: "",
        });

        socket.on(
            "realtimeStatsUpdate",
            (data: {
                liteNodes: LiteNodeTickInfo[];
                bobNodes: BobNodeTickInfo[];
            }) => {
                setIsLoading(false);
                setStatuses(data);
                console.log("Received realtime stats update", data);
            }
        );
        return () => {
            socket.emit("unsubscribeFromRealtimeStats");
        };
    }, []);

    let renderServersMap = useMemo(() => {
        return (
            mapData?.servers.map((s) => {
                let isActive = false;
                if (currentService === "liteNode") {
                    let nodeStatus = statuses.liteNodes.find(
                        (node) => node.server === s.server
                    );
                    isActive = nodeStatus
                        ? isNodeActive(nodeStatus.lastTickChanged)
                        : false;
                } else if (currentService === "bobNode") {
                    let nodeStatus = statuses.bobNodes.find(
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
                return statuses.liteNodes.some(
                    (node) => node.server === s.server
                );
            } else if (currentService === "bobNode") {
                return statuses.bobNodes.some(
                    (node) => node.server === s.server
                );
            }
        });
    }, [currentService, mapData]);

    return (
        <>
            <div className="p-4">
                <h3 className="text-2xl font-bold mb-4">Overview</h3>
                <div className="flex space-x-4 flex-col md:flex-row">
                    {" "}
                    {Object.entries(totalNodes).map(([nodeType]) => {
                        let validNodeType = nodeType as NodeType;
                        return (
                            <NodeStatus
                                title={titleNameFromNodeType[validNodeType]}
                                totalNodes={totalNodes[validNodeType]}
                                upNodes={upNodes[validNodeType]}
                                downNodes={downNodes[validNodeType]}
                                key={nodeType}
                            />
                        );
                    })}
                </div>
                <div className="status-table mt-5">
                    <Tabs
                        onValueChange={(value) =>
                            setCurrentService(value as ServiceType)
                        }
                        defaultValue="liteNode"
                        className="w-full"
                    >
                        <TabsList>
                            <TabsTrigger
                                className="cursor-pointer"
                                value="liteNode"
                            >
                                Lite Node
                            </TabsTrigger>
                            <TabsTrigger
                                className="cursor-pointer"
                                value="bobNode"
                            >
                                Bob Node
                            </TabsTrigger>
                        </TabsList>
                        <Dialog>
                            <DialogTrigger className="w-full">
                                <div className="flex w-full pl-2 py-2">
                                    <span
                                        onClick={handleUpdateMapServers}
                                        className="text-sm font-bold text-gray-600 cursor-pointer flex items-center hover:underline"
                                    >
                                        View Global Map{" "}
                                        <Earth className="ml-1" size={20} />
                                    </span>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="min-w-10/12 min-h-10/12 bg-black [&>button]:hidden">
                                <GlobalDataPulseMap nodes={renderServersMap} />
                            </DialogContent>
                        </Dialog>
                        <TabsContent value="liteNode">
                            <LiteNodeTable
                                isLoading={isLoading}
                                sortedLiteNodeStatuses={
                                    sortedLiteNodeStatuses || []
                                }
                            />
                        </TabsContent>
                        <TabsContent value="bobNode">
                            <BobNodeTable
                                isLoading={isLoading}
                                sortedBobNodeStatuses={
                                    sortedBobNodeStatuses || []
                                }
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
}
