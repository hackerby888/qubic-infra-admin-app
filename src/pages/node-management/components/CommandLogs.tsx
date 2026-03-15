import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LocalTerminal from "@/components/common/LocalTerminal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import useGeneralPost, { useGeneralGet } from "@/networking/api";
import type { CommandLog } from "@/types/type";
import { millisToSeconds, tripText } from "@/utils/common";
import { memo, useState } from "react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";

let commandLogStatusColorMap = {
    pending: "opacity-50",
    completed: "",
    failed: "text-red-500",
};

const keywordsToRemove = ["set -e", "exec 2>&1", "QDONE", "GETHERE  "];

function tripRemoveKeywords(text: string | undefined) {
    if (!text) return "";
    return text
        .split("\n")
        .filter(
            (line) =>
                !keywordsToRemove.some((keyword) => line.includes(keyword))
        )
        .join("\n");
}

export default memo(function CommandLogs() {
    const queryClient = useQueryClient();

    let [currentSelectedCommandLogUuid, setCurrentSelectedCommandLogUuid] =
        useState<string>("");

    let {
        data: commandLogs,
        isLoading: isLoadingCommandsLogs,
        error: fetchingCommandsLogsError,
    } = useGeneralGet<{ commandLogs: CommandLog[] }>({
        queryKey: ["command-logs", "all"],
        path: "/command-logs",
    });

    let { mutate: deleteCommandLog } = useGeneralPost({
        queryKey: ["delete-command-log"],
        path: "/delete-command-log",
    });
    let { mutate: deleteAllCommandLogs } = useGeneralPost({
        queryKey: ["delete-all-command-logs"],
        path: "/delete-all-command-logs",
    });

    let {
        data: currentCommandUuidLogs,
        isLoading: isLoadingCurrentCommandLogs,
        isFetching: isFetchingCurrentCommandLogs,
    } = useGeneralGet<{
        stdout: string;
        stderr: string;
    }>({
        queryKey: ["stdout-command-log", currentSelectedCommandLogUuid],
        path: "/stdout-command-log",
        reqQuery: {
            uuid: currentSelectedCommandLogUuid,
        },
    });

    const handleDeleteAllCommandLogs = () => {
        deleteAllCommandLogs({} as unknown as void, {
            onSuccess: () => {
                toast.success("All command logs deleted successfully");
                locallyRemoveAllCommandLogs();
            },
            onError: (error) => {
                toast.error(
                    "Failed to delete all command logs: " + error.message
                );
            },
        });
    };

    const locallyRemoveAllCommandLogs = () => {
        queryClient.setQueryData<{ commandLogs: CommandLog[] }>(
            ["command-logs", "all"],
            {
                commandLogs: [],
            }
        );
    };

    const locallyRemoveCommandLog = (uuid: string) => {
        queryClient.setQueryData<{ commandLogs: CommandLog[] }>(
            ["command-logs", "all"],
            {
                commandLogs:
                    commandLogs?.commandLogs.filter(
                        (log: CommandLog) => log.uuid !== uuid
                    ) || [],
            }
        );
    };

    const handleDeleteCommandLog = (uuid: string) => {
        deleteCommandLog({ uuid } as unknown as void, {
            onSuccess: () => {
                toast.success("Command log deleted successfully");
                locallyRemoveCommandLog(uuid);
            },
            onError: (error) => {
                toast.error("Failed to delete command log: " + error.message);
            },
        });
    };

    return (
        <div className="mb-4 rounded shadow-sm p-4 space-x-2 max-h-1/3 overflow-y-auto">
            {commandLogs?.commandLogs.map((log) => {
                let errorServers = log?.errorServers || [];
                return (
                    <Dialog key={log.uuid}>
                        <DialogTrigger
                            onClick={() => {
                                setCurrentSelectedCommandLogUuid(log.uuid);
                            }}
                        >
                            <div className="flex">
                                <Badge
                                    className={`cursor-pointer ${
                                        commandLogStatusColorMap[log.status]
                                    }`}
                                    variant={"secondary"}
                                >
                                    {tripText(log.command, 20)}
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteCommandLog(log.uuid);
                                        }}
                                    >
                                        <X className="" size={15} />
                                    </span>
                                </Badge>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="min-w-3/6">
                            <DialogHeader>
                                <DialogTitle>Command Logs</DialogTitle>
                                <DialogDescription>
                                    View the logs of your node here.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-1">
                                <div className="bg-gray-100 w-full rounded-sm px-2 py-2 text-sm text-gray-700 text-wrap break-all">
                                    {log.command}{" "}
                                    <span className="text-xs text-gray-500">
                                        {new Date(
                                            log.timestamp
                                        ).toLocaleString()}{" "}
                                        -{" "}
                                        <b
                                            className={`${
                                                log.status === "failed" &&
                                                "text-red-500"
                                            }`}
                                        >
                                            {log.status} (
                                            {millisToSeconds(log.duration)}{" "}
                                            seconds)
                                        </b>
                                    </span>
                                </div>
                                <div className="bg-gray-100 w-full rounded-sm px-2 py-2 text-sm text-gray-700">
                                    ({log.servers.length} servers){" "}
                                    <span className="text-xs text-gray-500">
                                        {log.servers
                                            .filter(
                                                (server) =>
                                                    !errorServers.includes(
                                                        server
                                                    )
                                            )
                                            .join(", ")}
                                    </span>
                                    <span className="ml-1 text-xs text-red-500">
                                        {log.servers
                                            .filter((server) =>
                                                errorServers.includes(server)
                                            )
                                            .join(", ")}
                                    </span>
                                </div>
                            </div>
                            <Tabs defaultValue="stdout">
                                <TabsList>
                                    <TabsTrigger
                                        className="cursor-pointer"
                                        value="stdout"
                                    >
                                        stdout
                                    </TabsTrigger>
                                    <TabsTrigger
                                        className="cursor-pointer"
                                        value="stderr"
                                    >
                                        stderr
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="stdout">
                                    <LocalTerminal
                                        text={
                                            isFetchingCurrentCommandLogs ||
                                            isLoadingCurrentCommandLogs
                                                ? "Loading..."
                                                : tripRemoveKeywords(
                                                      currentCommandUuidLogs?.stdout
                                                  ) || ""
                                        }
                                    />
                                </TabsContent>
                                <TabsContent value="stderr">
                                    <LocalTerminal
                                        text={
                                            isFetchingCurrentCommandLogs ||
                                            isLoadingCurrentCommandLogs
                                                ? "Loading..."
                                                : currentCommandUuidLogs?.stderr ||
                                                  ""
                                        }
                                    />
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                );
            })}
            {isLoadingCommandsLogs && (
                <div>
                    <Skeleton className="h-4 w-40 mr-2 inline-block" />
                    <Skeleton className="h-4 w-20 mr-2 inline-block" />
                    <Skeleton className="h-4 w-20 mr-2 inline-block" />
                    <Skeleton className="h-4 w-30 mr-2 inline-block" />
                </div>
            )}
            {fetchingCommandsLogsError && (
                <Alert variant={"destructive"}>
                    <AlertTitle>
                        Error, something went wrong while fetching command logs.
                    </AlertTitle>
                    <AlertDescription>
                        {fetchingCommandsLogsError.message}
                    </AlertDescription>
                </Alert>
            )}
            <div className="mt-2">
                <AlertDialog>
                    <AlertDialogTrigger>
                        <Badge
                            className="cursor-pointer hover:bg-red-500 hover:text-white"
                            variant="default"
                        >
                            <X size={15} className="mr-1" />
                            Delete All Command Logs
                        </Badge>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete all your command logs.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteAllCommandLogs}
                                className="bg-red-500 hover:bg-red-600 cursor-pointer"
                            >
                                Delete All
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
});
