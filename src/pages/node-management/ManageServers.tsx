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
import type { LiteNodeCustomParameter, NodeStatus, Server, ServiceType } from "@/types/type";
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
    SlidersHorizontal,
    Trash,
    Users,
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { memo, useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MyStorage } from "@/utils/storage";
import ServerNoteTyper from "./components/ServerNoteTyper";
import CommandLogs from "./components/CommandLogs";

let bgColorMap: Record<NodeStatus, string> = {
    active: "bg-blue-500",
    error: "bg-red-500",
    setting_up: "bg-yellow-500",
    stopped: "bg-gray-500",
    restarting: "bg-purple-500",
};

const ServerTableRow = memo(
    ({
        serverInfo,
        handleDeleteServers,
    }: {
        serverInfo: Server;
        handleDeleteServers: (servers: string[]) => void;
    }) => {
        const queryClient = useQueryClient();
        const selectedStore = useSelectedServersStore() as SelectedServersState;

        type DialogType = "alias" | "ownership" | "customParameter";

        let [dialogsOpen, setDialogsOpen] = useState<{
            [key in DialogType]: boolean;
        }>({
            alias: false,
            ownership: false,
            customParameter: false,
        });

        let [currentServerOwner, setCurrentServerOwner] = useState<string>(
            serverInfo.operator
        );
        let [currentAlias, setCurrentAlias] = useState<string>(
            serverInfo.alias || ""
        );
        let [currentCustomParameter, setCurrentCustomParameter] =
            useState<string>("");

        let { data: customParameterData, refetch: refetchCustomParameter } =
            useGeneralGet<LiteNodeCustomParameter>({
                queryKey: ["lite-node-custom-parameter", serverInfo.server],
                path: "/lite-node-custom-parameter",
                reqQuery: { server: serverInfo.server },
                enabled: false,
            });

        let {
            mutate: setCustomParameter,
            isPending: isSetCustomParameterPending,
        } = useGeneralPost({
            path: "/set-lite-node-custom-parameter",
            queryKey: ["set-lite-node-custom-parameter"],
        });

        let {
            mutate: transferOwnership,
            isPending: isTransferOwnershipPending,
        } = useGeneralPost({
            path: "/transfer-server-ownership",
            queryKey: ["transfer-server-ownership"],
        });
        let { mutate: setServerAlias, isPending: isSetServerAliasPending } =
            useGeneralPost({
                queryKey: ["set-server-alias"],
                path: "/set-server-alias",
            });

        const handleCheckboxChange = (server: string) => {
            selectedStore.setSelectedServer(server);
        };

        const submitOwnershipChange = () => {
            // Submit the ownership change
            transferOwnership(
                {
                    server: serverInfo.server,
                    newOwner: currentServerOwner,
                } as unknown as void,
                {
                    onSuccess: () => {
                        toast.success("Ownership transferred successfully");
                        // close the dialog
                        setDialogsOpen((prev) => ({
                            ...prev,
                            ["ownership"]: false,
                        }));
                    },
                    onError: (error) => {
                        toast.error(
                            "Failed to transfer ownership: " + error.message
                        );
                    },
                }
            );
        };

        const handleSaveAlias = () => {
            setServerAlias(
                {
                    server: serverInfo.server,
                    alias: currentAlias,
                } as unknown as void,
                {
                    onSuccess: () => {
                        toast.success("Alias updated successfully");
                        queryClient.setQueryData<{ servers: Server[] }>(
                            ["my-servers"],
                            (oldData) => {
                                // If there's no data in the cache, return the default structure
                                if (!oldData) return { servers: [] };

                                return {
                                    ...oldData,
                                    servers: oldData.servers.map(
                                        (_serverInfo) =>
                                            _serverInfo.server ===
                                            serverInfo.server
                                                ? {
                                                      ..._serverInfo,
                                                      alias: currentAlias,
                                                  }
                                                : _serverInfo
                                    ),
                                };
                            }
                        );
                        // close the dialog
                        setDialogsOpen((prev) => ({
                            ...prev,
                            ["alias"]: false,
                        }));
                    },
                    onError: (error) => {
                        toast.error("Failed to update alias: " + error.message);
                    },
                }
            );
        };

        const handleOpenCustomParameter = () => {
            refetchCustomParameter().then((result) => {
                setCurrentCustomParameter(
                    result.data?.customParameter || ""
                );
            });
            setDialogsOpen((prev) => ({ ...prev, customParameter: true }));
        };

        const handleSaveCustomParameter = () => {
            setCustomParameter(
                {
                    server: serverInfo.server,
                    customParameter: currentCustomParameter,
                } as unknown as void,
                {
                    onSuccess: () => {
                        toast.success("Custom parameter saved successfully");
                        setDialogsOpen((prev) => ({
                            ...prev,
                            customParameter: false,
                        }));
                    },
                    onError: (error) => {
                        toast.error(
                            "Failed to save custom parameter: " + error.message
                        );
                    },
                }
            );
        };

        // Determine if the server is tracking only (no OS and active status, because we skip the setup)
        let isTrackingOnly = !serverInfo.os && serverInfo.status === "active";
        let myOperator = MyStorage.getUserInfo()?.username || "unknown";

        return (
            <TableRow key={serverInfo.server}>
                <TableCell>
                    <Checkbox
                        onCheckedChange={() =>
                            handleCheckboxChange(serverInfo.server)
                        }
                        checked={selectedStore.selectedServers.includes(
                            serverInfo.server
                        )}
                    />
                </TableCell>
                <TableCell className="flex flex-col">
                    <Dialog
                        open={dialogsOpen["alias"]}
                        onOpenChange={(open) =>
                            setDialogsOpen((prev) => ({
                                ...prev,
                                ["alias"]: open,
                            }))
                        }
                    >
                        <DialogTrigger className="w-full">
                            <div className="cursor-pointer w-full flex items-center space-x-2">
                                <div className="flex items-center space-x-2 w-full">
                                    {serverInfo.alias || "Unknown"}
                                </div>
                                {serverInfo.operator !== myOperator && (
                                    <Badge>{serverInfo.operator}</Badge>
                                )}
                                <Pencil size={13} />
                            </div>
                        </DialogTrigger>
                        <DialogContent className="min-w-3/6">
                            <DialogHeader>
                                <DialogTitle>Change your alias</DialogTitle>
                                <DialogDescription>
                                    Change the alias of your server (
                                    {serverInfo.server}) here.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="">
                                <Input
                                    value={currentAlias}
                                    onChange={(e) =>
                                        setCurrentAlias(e.target.value)
                                    }
                                    placeholder="Enter new alias"
                                />
                            </div>
                            <div className="flex justify-end">
                                {!isSetServerAliasPending ? (
                                    <Button
                                        onClick={handleSaveAlias}
                                        className="mt-2 cursor-pointer"
                                    >
                                        Save Alias
                                    </Button>
                                ) : (
                                    <Button
                                        className="mt-2 cursor-not-allowed"
                                        disabled
                                    >
                                        Saving...
                                    </Button>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                    <ServerNoteTyper
                        server={serverInfo.server}
                        currentNote={serverInfo.note || ""}
                    />
                </TableCell>
                <TableCell>
                    {serverInfo.server}{" "}
                    <Badge className="ml-1" variant="outline">
                        {serverInfo.ipInfo?.country}
                    </Badge>
                    {isTrackingOnly && (
                        <Badge className="ml-1 bg-indigo-500">
                            Tracking Only
                        </Badge>
                    )}
                </TableCell>
                <TableCell>{serverInfo.os || "N/A"}</TableCell>
                <TableCell>{serverInfo.cpu || "N/A"}</TableCell>
                <TableCell>{serverInfo.ram || "N/A"}</TableCell>
                <TableCell className="space-x-1">
                    {serverInfo.services.map((service) => {
                        let haveDeployStatus =
                            serverInfo.deployStatus &&
                            service in serverInfo.deployStatus;
                        let status = haveDeployStatus
                            ? serverInfo.deployStatus![
                                  service as keyof typeof serverInfo.deployStatus
                              ]
                            : "nothing";
                        return (
                            <Tooltip>
                                <TooltipTrigger>
                                    <Badge
                                        key={service}
                                        variant={"outline"}
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
                                        {service}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {haveDeployStatus
                                        ? `Status: ${status}`
                                        : `No status available`}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </TableCell>
                <TableCell>
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge
                                className={bgColorMap[serverInfo.status]}
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
                        <DropdownMenuContent className="w-40" align="end">
                            <div className="text-[13px]">
                                <ViewLogs server={serverInfo.server} />
                                <Dialog
                                    open={dialogsOpen["ownership"]}
                                    onOpenChange={(open) =>
                                        setDialogsOpen((prev) => ({
                                            ...prev,
                                            ["ownership"]: open,
                                        }))
                                    }
                                >
                                    <DialogTrigger>
                                        <div>
                                            <div
                                                onClick={() => {}}
                                                className="pl-2 flex items-center py-1 cursor-pointer hover:bg-gray-100"
                                            >
                                                <Users size={20} />
                                                <span className="ml-1">
                                                    Transfer Ownership
                                                </span>
                                            </div>
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="min-w-3/6">
                                        <DialogHeader>
                                            <DialogTitle>
                                                Transfer Server Ownership
                                            </DialogTitle>
                                            <DialogDescription>
                                                Transfer the ownership of this
                                                server to another operator.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div>
                                            <Input
                                                value={currentServerOwner}
                                                onChange={(e) =>
                                                    setCurrentServerOwner(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            {!isTransferOwnershipPending ? (
                                                <Button
                                                    onClick={
                                                        submitOwnershipChange
                                                    }
                                                    className="mt-2 float-right"
                                                >
                                                    Transfer
                                                </Button>
                                            ) : (
                                                <Button
                                                    className="mt-2 float-right cursor-not-allowed"
                                                    disabled
                                                >
                                                    Transferring...
                                                </Button>
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                {(myOperator === serverInfo.operator ||
                                    myOperator === "admin") &&
                                    serverInfo.services.includes(
                                        "liteNode"
                                    ) && (
                                        <Dialog
                                            open={
                                                dialogsOpen["customParameter"]
                                            }
                                            onOpenChange={(open) => {
                                                if (open) {
                                                    handleOpenCustomParameter();
                                                } else {
                                                    setDialogsOpen((prev) => ({
                                                        ...prev,
                                                        customParameter: false,
                                                    }));
                                                }
                                            }}
                                        >
                                            <DialogTrigger asChild>
                                                <div className="pl-2 flex items-center py-1 cursor-pointer hover:bg-gray-100">
                                                    <SlidersHorizontal
                                                        size={20}
                                                    />
                                                    <span className="ml-1">
                                                        Custom Parameter
                                                    </span>
                                                </div>
                                            </DialogTrigger>
                                            <DialogContent className="min-w-3/6">
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Custom Launch Parameter
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Extra CLI arguments
                                                        appended when launching
                                                        the lite node on{" "}
                                                        {serverInfo.server}.
                                                        Leave empty to use no
                                                        extra parameters.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <Textarea
                                                    value={
                                                        currentCustomParameter
                                                    }
                                                    onChange={(e) =>
                                                        setCurrentCustomParameter(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. --some-flag --value 123"
                                                    className="font-mono text-sm"
                                                    rows={3}
                                                />
                                                <div className="flex justify-end">
                                                    {!isSetCustomParameterPending ? (
                                                        <Button
                                                            onClick={
                                                                handleSaveCustomParameter
                                                            }
                                                            className="cursor-pointer"
                                                        >
                                                            Save
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            disabled
                                                            className="cursor-not-allowed"
                                                        >
                                                            Saving...
                                                        </Button>
                                                    )}
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <div className="text-red-500 pl-2 flex items-center py-1 cursor-pointer hover:bg-gray-100">
                                            <Trash size={20} />
                                            <span className="ml-1">Delete</span>
                                        </div>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                Are you absolutely sure?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone.
                                                This will permanently delete
                                                your server.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() =>
                                                    handleDeleteServers([
                                                        serverInfo.server,
                                                    ])
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
    }
);

export default function ManageServers() {
    const queryClient = useQueryClient();

    const selectedStore = useSelectedServersStore() as SelectedServersState;

    let [currentSortedColumn, setCurrentSortedColumn] = useState<{
        column: string;
        direction: "asc" | "desc";
    }>({
        column: "alias",
        direction: "asc",
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

    let { mutate: deleteServer } = useGeneralPost({
        queryKey: ["delete-server"],
        path: "/delete-server",
    });

    const locallyRemoveServer = (server: string) => {
        queryClient.setQueryData<{ servers: Server[] }>(
            ["my-servers"],
            (old) => {
                return {
                    servers:
                        old?.servers.filter((s) => s.server !== server) || [],
                };
            }
        );
    };

    const handleDeleteServers = useCallback((servers: string[]) => {
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
    }, []);

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

    const handleSelectAllType = (type: ServiceType) => {
        let serversOfType = data?.servers.filter(
            (server) => server.services.includes(type) && server.username
        );
        if (serversOfType) {
            let serverIds = serversOfType.map((s) => s.server);
            selectedStore.setSelectedServers(serverIds);
        }
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

    return (
        <>
            <div className="p-4">
                <h3 className="text-2xl font-bold mb-4">Manage Servers</h3>{" "}
                <CommandLogs />
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
                        <div className="utils-command py-2 space-x-1">
                            <Badge
                                onClick={() => handleSelectAllType("liteNode")}
                                className="cursor-pointer"
                                variant={"secondary"}
                            >
                                Select all lites
                            </Badge>
                            <Badge
                                onClick={() => handleSelectAllType("bobNode")}
                                className="cursor-pointer"
                                variant={"secondary"}
                            >
                                Select all bobs
                            </Badge>
                        </div>
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
                                    <TableHead>
                                        {" "}
                                        <div
                                            onClick={() =>
                                                handleChangeSorting("os")
                                            }
                                            className="cursor-pointer w-full flex items-center space-x-2"
                                        >
                                            <span className="w-full">OS</span>{" "}
                                            <ArrowDownZA size={17} />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div
                                            onClick={() =>
                                                handleChangeSorting("cpu")
                                            }
                                            className="cursor-pointer w-full flex items-center space-x-2"
                                        >
                                            <span className="w-full">CPU</span>{" "}
                                            <ArrowDownZA size={17} />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        {" "}
                                        <div
                                            onClick={() =>
                                                handleChangeSorting("ram")
                                            }
                                            className="cursor-pointer w-full flex items-center space-x-2"
                                        >
                                            <span className="w-full">RAM</span>{" "}
                                            <ArrowDownZA size={17} />
                                        </div>
                                    </TableHead>
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
                                    return (
                                        <ServerTableRow
                                            key={serverInfo.server}
                                            serverInfo={serverInfo}
                                            handleDeleteServers={
                                                handleDeleteServers
                                            }
                                        />
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
