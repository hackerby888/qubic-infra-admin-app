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
import type { LiteNodeTickInfo, Server, User } from "@/types/type";
import { format } from "timeago.js";
import { badgeOperatorColor, calculateTimeDiffInSeconds } from "../common/util";
import { isNodeActive, mainAuxStatusToString } from "@/utils/common";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import VisibilityChanger from "../common/VisibilityChanger";
import { ArrowDownZA, Info } from "lucide-react";
import { useGeneralGet } from "@/networking/api";

export default function LiteNodeTable({
    isLoading,
    sortedLiteNodeStatuses,
    operatorInfo,
    onChangeSorting,
}: {
    isLoading: boolean;
    sortedLiteNodeStatuses: LiteNodeTickInfo[];
    operatorInfo?: User;
    onChangeSorting?: (column: string) => void;
}) {
    let { data: serversData } = useGeneralGet<{
        servers: Server[];
    }>({
        queryKey: ["my-servers"],
        path: "/my-servers",
        enabled: !!operatorInfo,
    });

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
                        <TableHead>
                            <div
                                onClick={() =>
                                    onChangeSorting && onChangeSorting("alias")
                                }
                                className="cursor-pointer w-full flex items-center space-x-2"
                            >
                                <span className="w-full">Alias</span>{" "}
                                {onChangeSorting && <ArrowDownZA size={17} />}
                            </div>
                        </TableHead>
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
                    <TableHead>
                        {" "}
                        <div
                            onClick={() =>
                                onChangeSorting && onChangeSorting("tick")
                            }
                            className="cursor-pointer w-full flex items-center space-x-2"
                        >
                            <span className="w-full">Tick</span>{" "}
                            {onChangeSorting && <ArrowDownZA size={17} />}
                        </div>
                    </TableHead>
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
                        <>
                            <TableRow
                                className={`${
                                    !nodeAlive &&
                                    !stat.isSavingSnapshot &&
                                    "bg-red-100 hover:bg-red-200"
                                }`}
                                key={stat.server}
                            >
                                {operatorInfo && (
                                    <TableCell>
                                        {aliasMap[stat.server] || "N/A"}
                                    </TableCell>
                                )}
                                <TableCell>
                                    {stat.server}{" "}
                                    {operatorInfo && (
                                        <Badge className="ml-1 bg-blue-600">
                                            {mainAuxStatusToString(
                                                stat.mainAuxStatus
                                            )}
                                        </Badge>
                                    )}
                                    <Badge
                                        className="ml-1"
                                        variant={
                                            nodeAlive ? "outline" : "secondary"
                                        }
                                    >
                                        {stat.ipInfo?.country}
                                    </Badge>
                                    {Boolean(stat.isSavingSnapshot) && (
                                        <Badge
                                            variant={"outline"}
                                            className="ml-1 bg-yellow-500 text-white"
                                        >
                                            {"Saving Snapshot"}
                                        </Badge>
                                    )}
                                    {!nodeAlive && (
                                        <Badge
                                            className="ml-1"
                                            variant="secondary"
                                        >
                                            Last tick changed:{" "}
                                            {format(stat.lastTickChanged)}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <FlashText
                                        noFlash={!nodeAlive}
                                        value={stat.tick.toLocaleString()}
                                    />
                                </TableCell>
                                <TableCell>{stat.alignedVotes}</TableCell>
                                <TableCell>{stat.misalignedVotes}</TableCell>
                                <TableCell>
                                    {calculateTimeDiffInSeconds(
                                        stat.lastUpdated
                                    )}
                                    s
                                </TableCell>
                                <TableCell>
                                    {format(stat.lastUpdated)}
                                </TableCell>
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
                        </>
                    );
                })}
            </TableBody>
        </Table>
    );
}
