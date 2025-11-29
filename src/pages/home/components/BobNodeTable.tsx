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
import type { BobNodeTickInfo, User } from "@/types/type";
import { format } from "timeago.js";
import { badgeOperatorColor } from "../common/util";
import { isNodeActive } from "@/utils/common";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import VisibilityChanger from "../common/VisibilityChanger";
export default function BobNodeTable({
    isLoading,
    sortedBobNodeStatuses,
    operatorInfo,
}: {
    isLoading: boolean;
    sortedBobNodeStatuses: BobNodeTickInfo[];
    operatorInfo?: User;
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {/* <TableHead>
                        <Checkbox />
                    </TableHead> */}
                    <TableHead>Node</TableHead>
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
                                !nodeAlive && "bg-red-100 hover:bg-red-200"
                            }`}
                            key={stat.server}
                        >
                            {/* <TableCell>
                                <Checkbox />
                            </TableCell> */}
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
