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
import type { CommandLog, Server } from "@/types/type";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon, RefreshCcw, Trash, X } from "lucide-react";
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

function tripText(text: string, maxLength: number) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength) + "...";
}

export default function ManageNode() {
    const queryClient = useQueryClient();

    const selectedStore = useSelectedServersStore() as SelectedServersState;

    let { mutate: deleteCommandLog } = useGeneralPost({
        queryKey: ["delete-command-log"],
        path: "/delete-command-log",
    });
    let { mutate: deleteAllCommandLogs } = useGeneralPost({
        queryKey: ["delete-all-command-logs"],
        path: "/delete-all-command-logs",
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
    let { data: commandLogs } = useGeneralGet<{ commandLogs: CommandLog[] }>({
        queryKey: ["command-logs"],
        path: "/command-logs",
    });

    let { mutate: deleteServer } = useGeneralPost({
        queryKey: ["delete-server"],
        path: "/delete-server",
    });

    let bgColorMap: { [key: string]: string } = {
        nothing: "",
        active: "bg-blue-500",
        error: "bg-red-500",
        setting_up: "bg-yellow-500",
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
                ["command-logs"],
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
                ["command-logs"],
                {
                    commandLogs:
                        commandLogs?.commandLogs.filter(
                            (log: CommandLog) => log.uuid !== uuid
                        ) || [],
                }
            );
        }
    };

    const handleDeleteServer = (server: string) => {
        deleteServer({ server } as unknown as void, {
            onSuccess: () => {
                toast.success("Server deleted successfully");
                locallyRemoveServer(server);
            },
            onError: (error) => {
                toast.error("Failed to delete server: " + error.message);
            },
        });
    };

    const locallyRemoveServer = (server: string) => {
        if (data) {
            queryClient.setQueryData<{ servers: Server[] }>(["my-servers"], {
                servers: data.servers.filter((s) => s.server !== server),
            });
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

    let commandLogStatusColorMap = {
        pending: "opacity-50",
        completed: "",
        failed: "text-red-500",
    };

    console.log("Servers data:", error);

    return (
        <div className="p-4">
            <h3 className="text-2xl font-bold mb-4">Manage Nodes</h3>{" "}
            <div className="mb-4 rounded shadow-sm p-4 space-x-2">
                {commandLogs?.commandLogs.map((log, index) => (
                    <Dialog key={log.uuid}>
                        <DialogTrigger>
                            <div className="flex">
                                <Badge
                                    className={`cursor-pointer ${
                                        commandLogStatusColorMap[log.status]
                                    }`}
                                    variant={"outline"}
                                >
                                    {tripText(log.command, 20)}
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteCommandLog(log.uuid);
                                        }}
                                    >
                                        <X size={15} />
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
                            <LocalTerminal text={log.stdout} />
                        </DialogContent>
                    </Dialog>
                ))}
                <div className="mt-2">
                    <AlertDialog>
                        <AlertDialogTrigger>
                            <Badge
                                className="cursor-pointer hover:bg-red-500 hover:text-white"
                                variant="secondary"
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
                                <TableHead>Server</TableHead>
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
                            {data?.servers.map((serverInfo) => (
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
                                    <TableCell>{serverInfo.server}</TableCell>
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
                                        {serverInfo.services.map((service) => {
                                            let haveDeployStatus =
                                                serverInfo.deployStatus &&
                                                service in
                                                    serverInfo.deployStatus;
                                            let status = haveDeployStatus
                                                ? serverInfo.deployStatus![
                                                      service as keyof typeof serverInfo.deployStatus
                                                  ]
                                                : "nothing";
                                            return (
                                                <Badge
                                                    key={service}
                                                    variant={"outline"}
                                                    className={`${
                                                        haveDeployStatus &&
                                                        bgColorMap[status]
                                                    } ${
                                                        !haveDeployStatus
                                                            ? "opacity-50"
                                                            : "text-white"
                                                    }`}
                                                >
                                                    {service}
                                                </Badge>
                                            );
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={
                                                bgColorMap[serverInfo.status]
                                            }
                                            variant={"default"}
                                        >
                                            {serverInfo.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
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
                                                                    size={20}
                                                                />
                                                                <span className="ml-1">
                                                                    Delete
                                                                </span>
                                                            </div>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Are you
                                                                    absolutely
                                                                    sure?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action
                                                                    cannot be
                                                                    undone. This
                                                                    will
                                                                    permanently
                                                                    delete your
                                                                    server.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() =>
                                                                        handleDeleteServer(
                                                                            serverInfo.server
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
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-red-500">
                        Error loading servers: {error.message}
                    </div>
                )}
            </div>
        </div>
    );
}
