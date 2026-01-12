import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import NewServer from "./components/NewServer";
import useGeneralPost, { useGeneralGet } from "@/networking/api";
import type { CommandLog, NodeStatus, Server } from "@/types/type";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ArrowDownZA,
    MoreHorizontalIcon,
    Pencil,
    RefreshCcw,
    Trash,
    X,
} from "lucide-react";
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
import ViewLogs from "./components/ViewLogs";
import { useQueryClient } from "@tanstack/react-query";
import {
    useSelectedServersStore,
    type SelectedServersState,
} from "@/stores/selected-servers-store";
import {
    DialogTrigger,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import LocalTerminal from "@/components/common/LocalTerminal";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { millisToSeconds } from "@/utils/common";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { MyStorage } from "@/utils/storage";
function tripText(text: string, maxLength: number) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength) + "...";
}

export default function ManageServers() {
    const queryClient = useQueryClient();

    const selectedStore = useSelectedServersStore() as SelectedServersState;

    let [currentSelectedCommandLogUuid, setCurrentSelectedCommandLogUuid] =
        useState<string>("");
    let [isAliasDialogOpen, setIsAliasDialogOpen] = useState(false);
    let [aliasMutationObject, setAliasMutationObject] = useState<{
        server: string;
        alias: string;
    }>({
        server: "",
        alias: "",
    });
    let [currentSortedColumn, setCurrentSortedColumn] = useState<{
        column: string;
        direction: "asc" | "desc";
    }>({
        column: "alias",
        direction: "asc",
    });

    let { mutate: deleteCommandLog } = useGeneralPost({
        queryKey: ["delete-command-log"],
        path: "/delete-command-log",
    });
    let { mutate: deleteAllCommandLogs } = useGeneralPost({
        queryKey: ["delete-all-command-logs"],
        path: "/delete-all-command-logs",
    });
    let { mutate: setServerAlias, isPending: isSetServerAliasPending } =
        useGeneralPost({
            queryKey: ["set-server-alias"],
            path: "/set-server-alias",
        });

    let {
        data,
        isPending,
        error,
        refetch: refetchServers,
        isRefetching: isRefreshingServers,
    } = useGeneralGet<{
        servers: Server[];
    }>({
        queryKey: ["my-servers"],
        path: "/my-servers",
    });
    let {
        data: commandLogs,
        isLoading: isLoadingCommandsLogs,
        error: fetchingCommandsLogsError,
    } = useGeneralGet<{ commandLogs: CommandLog[] }>({
        queryKey: ["command-logs", "all"],
        path: "/command-logs",
    });

    let { mutate: deleteServer } = useGeneralPost({
        queryKey: ["delete-server"],
        path: "/delete-server",
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

    let bgColorMap: Record<NodeStatus, string> = {
        active: "bg-blue-500",
        error: "bg-red-500",
        setting_up: "bg-yellow-500",
        stopped: "bg-gray-500",
        restarting: "bg-purple-500",
    };

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
        if (data) {
            queryClient.setQueryData<{ commandLogs: CommandLog[] }>(
                ["command-logs", "all"],
                {
                    commandLogs: [],
                }
            );
        }
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

    const locallyRemoveCommandLog = (uuid: string) => {
        if (data) {
            queryClient.setQueryData<{ commandLogs: CommandLog[] }>(
                ["command-logs", "all"],
                {
                    commandLogs:
                        commandLogs?.commandLogs.filter(
                            (log: CommandLog) => log.uuid !== uuid
                        ) || [],
                }
            );
        }
    };

    const handleDeleteServers = (servers: string[]) => {
        deleteServer({ servers: servers } as unknown as void, {
            onSuccess: () => {
                toast.success("Server deleted successfully");
                for (let server of servers) {
                    locallyRemoveServer(server);
                }
            },
            onError: (error) => {
                toast.error("Failed to delete server: " + error.message);
            },
        });
    };

    const locallyRemoveServer = (server: string) => {
        if (data) {
            queryClient.setQueryData<{ servers: Server[] }>(
                ["my-servers"],
                (old) => {
                    return {
                        servers:
                            old?.servers.filter((s) => s.server !== server) ||
                            [],
                    };
                }
            );
        }
    };

    const handleCheckboxChange = (server: string) => {
        selectedStore.setSelectedServer(server);
    };

    const handleGlobalCheckboxChange = (checked: boolean) => {
        if (checked) {
            let allServers = data?.servers.map((s) => s.server) || [];
            selectedStore.setSelectedServers(allServers);
        } else {
            selectedStore.clearSelectedServers();
        }
    };

    const handleRefreshServers = () => {
        if (!isRefreshingServers)
            refetchServers()
                .then(() => {
                    toast.success("Servers refreshed successfully.");
                })
                .catch((error) => {
                    toast.error("Failed to refresh servers: " + error.message);
                });
    };

    const handleChangeAlias = (alias: string) => {
        setAliasMutationObject({ ...aliasMutationObject, alias: alias });
    };

    const handleOpenDialogAlias = (server: string, currentAlias?: string) => {
        setAliasMutationObject({
            server: server,
            alias: currentAlias || "",
        });
        setIsAliasDialogOpen(true);
    };

    const handleSaveAlias = () => {
        setServerAlias(
            {
                server: aliasMutationObject.server,
                alias: aliasMutationObject.alias,
            } as unknown as void,
            {
                onSuccess: () => {
                    toast.success("Alias updated successfully");
                    queryClient.setQueryData<{ servers: Server[] }>(
                        ["my-servers"],
                        {
                            servers:
                                data?.servers.map((serverInfo) => {
                                    if (
                                        serverInfo.server ===
                                        aliasMutationObject.server
                                    ) {
                                        return {
                                            ...serverInfo,
                                            alias: aliasMutationObject.alias,
                                        };
                                    }
                                    return serverInfo;
                                }) || [],
                        }
                    );
                    setIsAliasDialogOpen(false);
                },
                onError: (error) => {
                    toast.error("Failed to update alias: " + error.message);
                },
            }
        );
    };

    let commandLogStatusColorMap = {
        pending: "opacity-50",
        completed: "",
        failed: "text-red-500",
    };

    console.log("Servers data:", error);

    const handleChangeSorting = (column: string) => {
        let direction: "asc" | "desc" =
            currentSortedColumn.direction === "asc" ? "desc" : "asc";
        setCurrentSortedColumn({ column, direction });
        let sortedServers = [...(data?.servers || [])].sort((a, b) => {
            let aValue = (a as any)[column] || "";
            let bValue = (b as any)[column] || "";
            if (aValue < bValue) return direction === "asc" ? -1 : 1;
            if (aValue > bValue) return direction === "asc" ? 1 : -1;
            return 0;
        });
        queryClient.setQueryData<{ servers: Server[] }>(["my-servers"], {
            servers: sortedServers,
        });
    };

    useEffect(() => {
        const handleKey = (e: any) => {
            if (e.key === "Delete" || e.keyCode === 46) {
                if (
                    window.confirm(
                        "Are you sure you want to delete the selected servers?"
                    ) &&
                    selectedStore.selectedServers.length > 0
                ) {
                    console.log(selectedStore.selectedServers);
                    handleDeleteServers(selectedStore.selectedServers);
                }
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [selectedStore.selectedServers]);

    let myOperator = MyStorage.getUserInfo()?.username || "unknown";

    return (
        <>
            <Dialog
                open={isAliasDialogOpen}
                onOpenChange={setIsAliasDialogOpen}
            >
                <DialogContent className="min-w-3/6">
                    <DialogHeader>
                        <DialogTitle>Change your alias</DialogTitle>
                        <DialogDescription>
                            Change the alias of your server (
                            {aliasMutationObject.server}) here.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="">
                        <Input
                            value={aliasMutationObject.alias}
                            onChange={(e) => handleChangeAlias(e.target.value)}
                            placeholder="Enter new alias"
                        />
                    </div>
                    <div className="flex justify-end">
                        {!isSetServerAliasPending ? (
                            <Button
                                onClick={handleSaveAlias}
                                className="cursor-pointer"
                            >
                                Save
                            </Button>
                        ) : (
                            <Button className="cursor-not-allowed" disabled>
                                Saving...
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            <div className="p-4">
                <h3 className="text-2xl font-bold mb-4">Manage Servers</h3>{" "}
                <div className="mb-4 rounded shadow-sm p-4 space-x-2 max-h-1/3 overflow-y-auto">
                    {commandLogs?.commandLogs.map((log) => {
                        let errorServers = log?.errorServers || [];
                        return (
                            <Dialog key={log.uuid}>
                                <DialogTrigger
                                    onClick={() => {
                                        setCurrentSelectedCommandLogUuid(
                                            log.uuid
                                        );
                                    }}
                                >
                                    <div className="flex">
                                        <Badge
                                            className={`cursor-pointer ${
                                                commandLogStatusColorMap[
                                                    log.status
                                                ]
                                            }`}
                                            variant={"secondary"}
                                        >
                                            {tripText(log.command, 20)}
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCommandLog(
                                                        log.uuid
                                                    );
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
                                        <div className="bg-gray-100 w-full rounded-sm px-2 py-2 text-sm text-gray-700">
                                            {log.command}{" "}
                                            <span className="text-xs text-gray-500">
                                                {new Date(
                                                    log.timestamp
                                                ).toLocaleString()}{" "}
                                                -{" "}
                                                <b
                                                    className={`${
                                                        log.status ===
                                                            "failed" &&
                                                        "text-red-500"
                                                    }`}
                                                >
                                                    {log.status} (
                                                    {millisToSeconds(
                                                        log.duration
                                                    )}{" "}
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
                                                        errorServers.includes(
                                                            server
                                                        )
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
                                                        : currentCommandUuidLogs?.stdout ||
                                                          ""
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
                                Error, something went wrong while fetching
                                command logs.
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
                                        permanently delete all your command
                                        logs.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>
                                        Cancel
                                    </AlertDialogCancel>
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
                <div>
                    <div className="py-2 space-x-1">
                        <NewServer />
                        <Button
                            onClick={handleRefreshServers}
                            variant={"ghost"}
                            className="cursor-pointer"
                        >
                            <RefreshCcw size={20} />
                        </Button>
                    </div>
                    {!error ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <Checkbox
                                            onCheckedChange={
                                                handleGlobalCheckboxChange
                                            }
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <div
                                            onClick={() =>
                                                handleChangeSorting("alias")
                                            }
                                            className="cursor-pointer w-full flex items-center space-x-2"
                                        >
                                            <span className="w-full">
                                                Alias
                                            </span>{" "}
                                            <ArrowDownZA size={17} />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        {" "}
                                        <div
                                            onClick={() =>
                                                handleChangeSorting("server")
                                            }
                                            className="cursor-pointer w-full flex items-center space-x-2"
                                        >
                                            <span className="w-full">
                                                Server
                                            </span>{" "}
                                            <ArrowDownZA size={17} />
                                        </div>
                                    </TableHead>
                                    <TableHead>OS</TableHead>
                                    <TableHead>CPU</TableHead>
                                    <TableHead>RAM</TableHead>
                                    <TableHead>Services</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isPending ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-4">
                                            Loading servers...
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                                {data?.servers.map((serverInfo) => {
                                    // Determine if the server is tracking only (no OS and active status, because we skip the setup)
                                    let isTrackingOnly =
                                        !serverInfo.os &&
                                        serverInfo.status === "active";
                                    return (
                                        <TableRow key={serverInfo.server}>
                                            <TableCell>
                                                <Checkbox
                                                    onCheckedChange={() =>
                                                        handleCheckboxChange(
                                                            serverInfo.server
                                                        )
                                                    }
                                                    checked={selectedStore.selectedServers.includes(
                                                        serverInfo.server
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div
                                                    onClick={() =>
                                                        handleOpenDialogAlias(
                                                            serverInfo.server,
                                                            serverInfo.alias
                                                        )
                                                    }
                                                    className="cursor-pointer w-full flex items-center space-x-2"
                                                >
                                                    <div className="flex items-center space-x-2 w-full">
                                                        {serverInfo.alias ||
                                                            "Unknown"}
                                                    </div>
                                                    {serverInfo.operator !==
                                                        myOperator && (
                                                        <Badge>
                                                            {
                                                                serverInfo.operator
                                                            }
                                                        </Badge>
                                                    )}
                                                    <Pencil size={13} />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {serverInfo.server}{" "}
                                                <Badge
                                                    className="ml-1"
                                                    variant="outline"
                                                >
                                                    {serverInfo.ipInfo?.country}
                                                </Badge>
                                                {isTrackingOnly && (
                                                    <Badge className="ml-1 bg-indigo-500">
                                                        Tracking Only
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {serverInfo.os || "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                {serverInfo.cpu || "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                {serverInfo.ram || "N/A"}
                                            </TableCell>
                                            <TableCell className="space-x-1">
                                                {serverInfo.services.map(
                                                    (service) => {
                                                        let haveDeployStatus =
                                                            serverInfo.deployStatus &&
                                                            service in
                                                                serverInfo.deployStatus;
                                                        let status =
                                                            haveDeployStatus
                                                                ? serverInfo.deployStatus![
                                                                      service as keyof typeof serverInfo.deployStatus
                                                                  ]
                                                                : "nothing";
                                                        return (
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <Badge
                                                                        key={
                                                                            service
                                                                        }
                                                                        variant={
                                                                            "outline"
                                                                        }
                                                                        className={`${
                                                                            haveDeployStatus &&
                                                                            bgColorMap[
                                                                                status as keyof typeof bgColorMap
                                                                            ]
                                                                        } ${
                                                                            !haveDeployStatus
                                                                                ? "opacity-50"
                                                                                : "text-white"
                                                                        }`}
                                                                    >
                                                                        {
                                                                            service
                                                                        }
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {haveDeployStatus
                                                                        ? `Status: ${status}`
                                                                        : `No status available`}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        );
                                                    }
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Badge
                                                            className={
                                                                bgColorMap[
                                                                    serverInfo
                                                                        .status
                                                                ]
                                                            }
                                                            variant={"default"}
                                                        >
                                                            {serverInfo.status}
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {`Overall node status: ${serverInfo.status}`}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu modal={false}>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            className="cursor-pointer"
                                                            variant="outline"
                                                            aria-label="Open menu"
                                                            size="icon-sm"
                                                        >
                                                            <MoreHorizontalIcon />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        className="w-40"
                                                        align="end"
                                                    >
                                                        <div className="text-[13px]">
                                                            <ViewLogs
                                                                server={
                                                                    serverInfo.server
                                                                }
                                                            />
                                                            <AlertDialog>
                                                                <AlertDialogTrigger
                                                                    asChild
                                                                >
                                                                    <div className="text-red-500 pl-2 flex items-center py-1 cursor-pointer hover:bg-gray-100">
                                                                        <Trash
                                                                            size={
                                                                                20
                                                                            }
                                                                        />
                                                                        <span className="ml-1">
                                                                            Delete
                                                                        </span>
                                                                    </div>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>
                                                                            Are
                                                                            you
                                                                            absolutely
                                                                            sure?
                                                                        </AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This
                                                                            action
                                                                            cannot
                                                                            be
                                                                            undone.
                                                                            This
                                                                            will
                                                                            permanently
                                                                            delete
                                                                            your
                                                                            server.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>
                                                                            Cancel
                                                                        </AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() =>
                                                                                handleDeleteServers(
                                                                                    [
                                                                                        serverInfo.server,
                                                                                    ]
                                                                                )
                                                                            }
                                                                            className="bg-red-500 hover:bg-red-600 cursor-pointer"
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-red-500">
                            Error loading servers: {error.message}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
