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
import type { LiteNodeTickInfo, User } from "@/types/type";
import { format } from "timeago.js";
import { badgeOperatorColor, calculateTimeDiffInSeconds } from "../common/util";
import { isNodeActive } from "@/utils/common";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import VisibilityChanger from "../common/VisibilityChanger";
import { Info } from "lucide-react";

export default function LiteNodeTable({
    isLoading,
    sortedLiteNodeStatuses,
    operatorInfo,
}: {
    isLoading: boolean;
    sortedLiteNodeStatuses: LiteNodeTickInfo[];
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
                    <TableHead>Align</TableHead>
                    <TableHead>Missalign</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead className="">
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
                {sortedLiteNodeStatuses?.map((stat) => {
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
                            </TableCell>
                            <TableCell>
                                <FlashText
                                    noFlash={!nodeAlive}
                                    value={stat.tick.toString()}
                                />
                            </TableCell>
                            <TableCell>{stat.alignedVotes}</TableCell>
                            <TableCell>{stat.misalignedVotes}</TableCell>
                            <TableCell>
                                {calculateTimeDiffInSeconds(stat.lastUpdated)}s
                            </TableCell>
                            <TableCell>{format(stat.lastUpdated)}</TableCell>
                            <TableCell>
                                <VisibilityChanger
                                    service="liteNode"
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
