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
import type { LiteNodeTickInfo } from "@/types/type";
import { format } from "timeago.js";
import { badgeOperatorColor, calculateTimeDiffInSeconds } from "../common/util";
import { Checkbox } from "@/components/ui/checkbox";
import { isNodeActive } from "@/utils/common";

export default function LiteNodeTable({
    isLoading,
    sortedLiteNodeStatuses,
}: {
    isLoading: boolean;
    sortedLiteNodeStatuses: LiteNodeTickInfo[];
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>
                        <Checkbox />
                    </TableHead>
                    <TableHead>Node</TableHead>
                    <TableHead>Tick</TableHead>
                    <TableHead>Align</TableHead>
                    <TableHead>Missalign</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Last Update</TableHead>
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
                {sortedLiteNodeStatuses?.map((stat, idx) => {
                    let nodeAlive = isNodeActive(stat.lastUpdated);
                    return (
                        <TableRow
                            className={`${
                                !nodeAlive && "bg-red-100 hover:bg-red-200"
                            }`}
                            key={stat.server}
                        >
                            <TableCell>
                                <Checkbox />
                            </TableCell>
                            <TableCell>{stat.server} </TableCell>
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
