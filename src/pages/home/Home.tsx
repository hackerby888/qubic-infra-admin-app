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
import { useEffect, useState } from "react";
import socket from "@/networking/socket";

export default function Home() {
    let [isLoading, setIsLoading] = useState<boolean>(false);
    let [currentService, setCurrentService] = useState<ServiceType>("liteNode");
    let [statuses, setStatuses] = useState<{
        liteNodes: LiteNodeTickInfo[];
        bobNodes: BobNodeTickInfo[];
    }>({ liteNodes: [], bobNodes: [] });

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
    }, [currentService]);

    return (
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
                        <TabsTrigger className="cursor-pointer" value="bobNode">
                            Bob Node
                        </TabsTrigger>
                    </TabsList>
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
                            sortedBobNodeStatuses={sortedBobNodeStatuses || []}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
