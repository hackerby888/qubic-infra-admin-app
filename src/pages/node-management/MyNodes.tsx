import { useGeneralGet } from "@/networking/api";
import type {
    BobNodeTickInfo,
    LiteNodeTickInfo,
    Server,
    ServiceType,
} from "@/types/type";
import { isNodeActive } from "@/utils/common";
import NodeStatus from "../home/components/NodeStatus";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MyStorage } from "@/utils/storage";
import { AlertCircleIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiteNodeTable from "../home/components/LiteNodeTable";
import BobNodeTable from "../home/components/BobNodeTable";
import { useEffect, useState } from "react";
import socket from "@/networking/socket";

export default function MyNodes() {
    let operatorToken = MyStorage.getLoginCredential();
    let operatorInfo = MyStorage.decodeTokenPayload(operatorToken || "");
    let [currentService, setCurrentService] = useState<ServiceType>("liteNode");
    let { data: serversData } = useGeneralGet<{
        servers: Server[];
    }>({
        queryKey: ["my-servers"],
        path: "/my-servers",
        enabled: !!operatorInfo,
    });

    let [isLoading, setIsLoading] = useState<boolean>(false);
    let [statuses, setStatuses] = useState<{
        liteNodes: LiteNodeTickInfo[];
        bobNodes: BobNodeTickInfo[];
    }>({ liteNodes: [], bobNodes: [] });
    let [currentSortedColumn, setCurrentSortedColumn] = useState<{
        column: string;
        direction: "asc" | "desc";
    }>({
        column: "tick",
        direction: "asc",
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
    const aliasMap: Record<string, string> = {};
    if (serversData && serversData.servers) {
        serversData.servers.forEach((server) => {
            if (server.alias) {
                aliasMap[server.server] = server.alias;
            }
        });
    }
    let sortedLiteNodeStatuses = statuses.liteNodes.slice().sort((a, b) => {
        let direction: "asc" | "desc" =
            currentSortedColumn.direction === "asc" ? "desc" : "asc";

        let aValue = (a as any)[currentSortedColumn.column] || "";
        let bValue = (b as any)[currentSortedColumn.column] || "";
        if (currentSortedColumn.column === "alias") {
            aValue = aliasMap[a.server] || "";
            bValue = aliasMap[b.server] || "";
        }
        if (aValue < bValue) return direction === "asc" ? -1 : 1;
        if (aValue > bValue) return direction === "asc" ? 1 : -1;
        return 0;
    });
    let sortedBobNodeStatuses = statuses.bobNodes.slice().sort((a, b) => {
        let direction: "asc" | "desc" =
            currentSortedColumn.direction === "asc" ? "desc" : "asc";

        let aValue = (a as any)[currentSortedColumn.column] || "";
        let bValue = (b as any)[currentSortedColumn.column] || "";
        if (currentSortedColumn.column === "alias") {
            aValue = aliasMap[a.server] || "";
            bValue = aliasMap[b.server] || "";
        }
        if (aValue < bValue) return direction === "asc" ? -1 : 1;
        if (aValue > bValue) return direction === "asc" ? 1 : -1;
        return 0;
    });

    const onLiteNodeTableChangeSorting = (column: string) => {
        let newDirection: "asc" | "desc" = "asc";
        if (currentSortedColumn.column === column) {
            newDirection =
                currentSortedColumn.direction === "asc" ? "desc" : "asc";
        }
        setCurrentSortedColumn({ column, direction: newDirection });
    };

    const onBobNodeTableChangeSorting = (column: string) => {
        let newDirection: "asc" | "desc" = "asc";
        if (currentSortedColumn.column === column) {
            newDirection =
                currentSortedColumn.direction === "asc" ? "desc" : "asc";
        }
        setCurrentSortedColumn({ column, direction: newDirection });
    };

    const handleOnServiceChange = (value: ServiceType) => {
        if (value == "liteNode") {
            setCurrentSortedColumn({
                column: "tick",
                direction: "asc",
            });
            setCurrentService(value);
        } else if (value == "bobNode") {
            setCurrentSortedColumn({
                column: "currentFetchingTick",
                direction: "asc",
            });
            setCurrentService(value);
        }
    };

    useEffect(() => {}, []);

    useEffect(() => {
        setIsLoading(true);
        let operatorInfo = MyStorage.getUserInfo();
        socket.emit("subscribeToRealtimeStats", {
            service: currentService,
            operator: operatorInfo?.username || "",
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

    type NodeType = keyof typeof totalNodes;
    let titleNameFromNodeType = {
        liteNodes: "My Lite Nodes",
        bobNodes: "My Bob Nodes",
    };

    let shouldRender = operatorToken && operatorInfo;
    return (
        <div className="p-4">
            <h3 className="text-2xl font-bold mb-4">My Nodes</h3>
            {shouldRender ? (
                <>
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
                                handleOnServiceChange(value as ServiceType)
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
                            <TabsContent value="liteNode">
                                <Tabs
                                    defaultValue="lite-all"
                                    className="w-full"
                                >
                                    <TabsList>
                                        <TabsTrigger
                                            className="cursor-pointer"
                                            value="lite-all"
                                        >
                                            All
                                        </TabsTrigger>
                                        <TabsTrigger
                                            className="cursor-pointer"
                                            value="lite-mining"
                                        >
                                            Mining Nodes
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="lite-all">
                                        <LiteNodeTable
                                            onChangeSorting={
                                                onLiteNodeTableChangeSorting
                                            }
                                            operatorInfo={operatorInfo!}
                                            isLoading={isLoading}
                                            sortedLiteNodeStatuses={
                                                sortedLiteNodeStatuses || []
                                            }
                                        />
                                    </TabsContent>
                                    <TabsContent value="lite-mining">
                                        <LiteNodeTable
                                            onChangeSorting={
                                                onLiteNodeTableChangeSorting
                                            }
                                            operatorInfo={operatorInfo!}
                                            isLoading={isLoading}
                                            sortedLiteNodeStatuses={
                                                sortedLiteNodeStatuses?.filter(
                                                    (s) => s.groupId !== ""
                                                ) || []
                                            }
                                        />
                                    </TabsContent>
                                </Tabs>
                            </TabsContent>
                            <TabsContent value="bobNode">
                                <BobNodeTable
                                    onChangeSorting={
                                        onBobNodeTableChangeSorting
                                    }
                                    isLoading={isLoading}
                                    sortedBobNodeStatuses={
                                        sortedBobNodeStatuses || []
                                    }
                                    operatorInfo={operatorInfo!}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </>
            ) : (
                <div>
                    <Alert variant="destructive">
                        <AlertCircleIcon />
                        <AlertDescription>
                            Please login as a opeartor to see your nodes
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
    );
}
