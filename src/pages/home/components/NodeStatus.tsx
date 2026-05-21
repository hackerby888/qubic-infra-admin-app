import BatteryStatus from "@/components/common/battery-status";

export default function NodeStatus({
    title,
    totalNodes,
    upNodes,
    downNodes,
}: {
    title: string;
    totalNodes: number;
    upNodes: number;
    downNodes: number;
}) {
    return (
        <div className="general-stats flex flex-col space-x-2 w-full md:w-1/2">
            <div className="status-header w-full flex justify-center font-semibold">
                {title}
            </div>
            <div className="flex space-x-2 w-full justify-center flex-col md:flex-row">
                {" "}
                <div className="flex flex-col accent-panel p-5">
                    <span className="text-sm text-muted-foreground">
                        Total Nodes
                    </span>
                    <div className="font-bold">{totalNodes}</div>
                </div>
                <div className="flex flex-row gap-2">
                    <div className="flex flex-col accent-panel p-5">
                        <span className="text-sm text-muted-foreground">
                            Down Nodes
                        </span>
                        <div className="flex justify-center align-middle">
                            <BatteryStatus
                                percentage={Math.round(
                                    (downNodes / totalNodes) * 100
                                )}
                                forceColor="bg-[var(--red)]"
                            ></BatteryStatus>
                            <div className="text-lg font-bold flex h-full pl-2">
                                <span>
                                    {Math.round((downNodes / totalNodes) * 100)}
                                    %
                                </span>
                                <span className="text-muted-foreground font-medium ml-1">
                                    - {downNodes}/{totalNodes}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col accent-panel p-5">
                        <span className="text-sm text-muted-foreground">
                            Up Nodes
                        </span>
                        <div className="flex justify-center align-middle">
                            <BatteryStatus
                                percentage={(upNodes / totalNodes) * 100}
                                forceColor="bg-[var(--green)]"
                            ></BatteryStatus>
                            <div className="text-lg font-bold flex h-full pl-2">
                                <span>
                                    {Math.round((upNodes / totalNodes) * 100)}
                                    %{" "}
                                </span>
                                <span className="text-muted-foreground font-medium ml-1">
                                    - {upNodes}/{totalNodes}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
