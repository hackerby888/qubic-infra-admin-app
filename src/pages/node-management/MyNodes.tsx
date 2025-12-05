import { useGeneralGet } from "@/networking/api";
import type { ServersStatus } from "@/types/type";
import { isNodeActive } from "@/utils/common";
import NodeStatus from "../home/components/NodeStatus";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MyStorage } from "@/utils/storage";
import { AlertCircleIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiteNodeTable from "../home/components/LiteNodeTable";
import BobNodeTable from "../home/components/BobNodeTable";

export default function MyNodes() {
    let operatorToken = MyStorage.getLoginCredential();
    let operatorInfo = MyStorage.decodeTokenPayload(operatorToken || "");
    let { data, error, isLoading } = useGeneralGet<ServersStatus>({
        queryKey: [
            "servers-status",
            operatorInfo?.username || "no-valid-operator",
        ],
        path: "/servers-status",
        refetchInterval: 1000,
        reqQuery: {
            operator: operatorInfo?.username || "",
        },
    });

    let totalNodes = {
        liteNodes: data?.statuses.liteNodes.length || 0,
        bobNodes: data?.statuses.bobNodes.length || 0,
    };

    let upNodes = {
        liteNodes:
            data?.statuses.liteNodes.filter((s) =>
                isNodeActive(s.lastTickChanged)
            ).length || 0,
        bobNodes:
            data?.statuses.bobNodes.filter((s) =>
                isNodeActive(s.lastTickChanged)
            ).length || 0,
    };

    let downNodes = {
        liteNodes: totalNodes.liteNodes - upNodes.liteNodes,
        bobNodes: totalNodes.bobNodes - upNodes.bobNodes,
    };

    // Clone and sort statuses by tick
    let sortedLiteNodeStatuses = data?.statuses.liteNodes
        .slice()
        .sort((a, b) => b.tick - a.tick);
    let sortedBobNodeStatuses = data?.statuses.bobNodes
        .slice()
        .sort((a, b) => b.currentFetchingTick - a.currentFetchingTick);

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
                        {!error ? (
                            <Tabs defaultValue="lite-node" className="w-full">
                                <TabsList>
                                    <TabsTrigger
                                        className="cursor-pointer"
                                        value="lite-node"
                                    >
                                        Lite Node
                                    </TabsTrigger>
                                    <TabsTrigger
                                        className="cursor-pointer"
                                        value="bob-node"
                                    >
                                        Bob Node
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="lite-node">
                                    <LiteNodeTable
                                        operatorInfo={operatorInfo!}
                                        isLoading={isLoading}
                                        sortedLiteNodeStatuses={
                                            sortedLiteNodeStatuses || []
                                        }
                                    />
                                </TabsContent>
                                <TabsContent value="bob-node">
                                    <BobNodeTable
                                        isLoading={isLoading}
                                        sortedBobNodeStatuses={
                                            sortedBobNodeStatuses || []
                                        }
                                        operatorInfo={operatorInfo!}
                                    />
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <Alert variant="destructive">
                                <AlertCircleIcon />
                                <AlertTitle className="font-bold">
                                    Error
                                </AlertTitle>
                                <AlertDescription>
                                    {`Failed to load your nodes: ${
                                        (error as any)?.message ||
                                        "Unknown error"
                                    }`}
                                </AlertDescription>
                            </Alert>
                        )}
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
