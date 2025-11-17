import { useGeneralGet } from "@/networking/api";
import type { LiteNodeTickInfo, BobNodeTickInfo } from "@/types/type";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiteNodeTable from "./components/LiteNodeTable";
import BobNodeTable from "./components/BobNodeTable";
import NodeStatus from "./components/NodeStatus";
import { isNodeActive } from "@/utils/common";

export default function Home() {
    let { data, error, isLoading } = useGeneralGet<{
        statuses: {
            liteNodes: LiteNodeTickInfo[];
            bobNodes: BobNodeTickInfo[];
        };
    }>({
        queryKey: ["servers-status"],
        path: "/servers-status",
        refetchInterval: 1000,
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
        .sort((a, b) => b.currentProcessingEpoch - a.currentProcessingEpoch);

    type NodeType = keyof typeof totalNodes;
    let titleNameFromNodeType = {
        liteNodes: "Lite Nodes",
        bobNodes: "Bob Nodes",
    };

    return (
        <div className="p-4">
            <h3 className="text-2xl font-bold mb-4">Overview</h3>
            <div className="flex space-x-4">
                {" "}
                {Object.entries(totalNodes).map(([nodeType, total]) => {
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
                            isLoading={isLoading}
                            sortedLiteNodeStatuses={
                                sortedLiteNodeStatuses || []
                            }
                        />
                    </TabsContent>
                    <TabsContent value="bob-node">
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
