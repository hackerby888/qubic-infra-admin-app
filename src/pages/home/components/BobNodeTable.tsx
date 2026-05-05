import FlashText from "@/components/common/flash-text";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { BobNodeTickInfo, Server, User } from "@/types/type";
import { format } from "timeago.js";
import { badgeOperatorColor } from "../common/util";
import { isNodeActive } from "@/utils/common";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowDownZA, Info } from "lucide-react";
import VisibilityChanger from "../common/VisibilityChanger";
import { useGeneralGet } from "@/networking/api";
import {
    useSelectedServersStore,
    type SelectedServersState,
} from "@/stores/selected-servers-store";
import { Checkbox } from "@/components/ui/checkbox";
export default function BobNodeTable({
    isLoading,
    sortedBobNodeStatuses,
    operatorInfo,
    onChangeSorting,
}: {
    isLoading: boolean;
    sortedBobNodeStatuses: BobNodeTickInfo[];
    operatorInfo?: User;
    onChangeSorting?: (column: string) => void;
}) {
    const selectedStore = useSelectedServersStore() as SelectedServersState;
    let { data: serversData } = useGeneralGet<{
        servers: Server[];
    }>({
        queryKey: ["my-servers"],
        path: "/my-servers",
        enabled: !!operatorInfo,
    });

    const handleCheckboxChange = (server: string) => {
        selectedStore.setSelectedServer(server);
    };

    const aliasMap: Record<string, string> = {};
    if (serversData && serversData.servers) {
        serversData.servers.forEach((server) => {
            if (server.alias) {
                aliasMap[server.server] = server.alias;
            }
        });
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {operatorInfo && (
                        <>
                            <TableHead></TableHead>
                            <TableHead>
                                <div
                                    onClick={() =>
                                        onChangeSorting &&
                                        onChangeSorting("alias")
                                    }
                                    className="cursor-pointer w-full flex items-center space-x-2"
                                >
                                    <span className="w-full">Alias</span>{" "}
                                    {onChangeSorting && (
                                        <ArrowDownZA size={17} />
                                    )}
                                </div>
                            </TableHead>
                        </>
                    )}
                    <TableHead>
                        {" "}
                        <div
                            onClick={() =>
                                onChangeSorting && onChangeSorting("server")
                            }
                            className="cursor-pointer w-full flex items-center space-x-2"
                        >
                            <span className="w-full">Node</span>{" "}
                            {onChangeSorting && <ArrowDownZA size={17} />}
                        </div>
                    </TableHead>
                    <TableHead>Tick</TableHead>
                    <TableHead>Log Tick</TableHead>
                    <TableHead>Verify Tick</TableHead>
                    <TableHead>Indexing Tick</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead>
                        {" "}
                        <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1">
                                Visibility <Info size={12} />
                            </TooltipTrigger>
                            <TooltipContent>
                                Private = only operator can see the node; Public
                                = everyone can see the node
                            </TooltipContent>
                        </Tooltip>
                    </TableHead>
                    <TableHead>Operator</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center">
                            Loading...
                        </TableCell>
                    </TableRow>
                )}
                {sortedBobNodeStatuses?.map((stat) => {
                    let nodeAlive = isNodeActive(stat.lastTickChanged);
                    return (
                        <TableRow
                            className={`${
                                !nodeAlive && "bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-950/80"
                            }`}
                            key={stat.server}
                        >
                            {operatorInfo && (
                                <>
                                    <TableCell>
                                        <Checkbox
                                            onCheckedChange={() =>
                                                handleCheckboxChange(
                                                    stat.server
                                                )
                                            }
                                            checked={selectedStore.selectedServers.includes(
                                                stat.server
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {aliasMap[stat.server] || "N/A"}
                                    </TableCell>
                                </>
                            )}
                            <TableCell>
                                {stat.server}{" "}
                                <Badge
                                    className="ml-1"
                                    variant={
                                        nodeAlive ? "outline" : "secondary"
                                    }
                                >
                                    {stat.ipInfo?.country}
                                </Badge>
                                <Badge
                                    className="ml-1"
                                    variant={
                                        nodeAlive ? "outline" : "secondary"
                                    }
                                >
                                    {`ver: ${stat.bobVersion}`}
                                </Badge>
                                {!nodeAlive && (
                                    <Badge className="ml-1" variant="secondary">
                                        Last tick changed:{" "}
                                        {format(stat.lastTickChanged)}
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                <FlashText
                                    noFlash={!nodeAlive}
                                    value={stat.currentFetchingTick.toLocaleString()}
                                />
                            </TableCell>
                            <TableCell>
                                {stat.currentFetchingLogTick.toLocaleString()}
                            </TableCell>
                            <TableCell>
                                {stat.currentVerifyLoggingTick.toLocaleString()}
                            </TableCell>
                            <TableCell>
                                {stat.currentIndexingTick.toLocaleString()}
                            </TableCell>
                            <TableCell>{format(stat.lastUpdated)}</TableCell>
                            <TableCell>
                                <VisibilityChanger
                                    service="bobNode"
                                    stat={stat}
                                    operatorInfo={operatorInfo}
                                />
                            </TableCell>
                            <TableCell>
                                <Badge
                                    className={`${badgeOperatorColor(
                                        stat.operator
                                    )}`}
                                    variant="secondary"
                                >
                                    {stat.operator}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
