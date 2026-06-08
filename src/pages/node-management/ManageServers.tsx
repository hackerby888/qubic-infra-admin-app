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
import type {
    LiteNodeCustomParameter,
    NodeStatus,
    Server,
    ServiceType,
} from "@/types/type";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ArrowDownZA,
    Bot,
    KeyRound,
    ListChecks,
    ListX,
    MoreHorizontalIcon,
    Pencil,
    RefreshCcw,
    Server as ServerIcon,
    SlidersHorizontal,
    TerminalIcon,
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
import SshConsoleDialog from "./components/SshConsoleDialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MyStorage } from "@/utils/storage";
import ServerNoteTyper from "./components/ServerNoteTyper";
import CommandLogs from "./components/CommandLogs";

let bgColorMap: Record<NodeStatus, string> = {
    active: "bg-primary",
    error: "bg-[var(--red)]",
    setting_up: "bg-[var(--amber)]",
    stopped: "bg-muted-foreground",
    restarting: "bg-[var(--magenta)]",
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

        type DialogType =
            | "alias"
            | "ownership"
            | "customParameter"
            | "promote";

        let [dialogsOpen, setDialogsOpen] = useState<{
            [key in DialogType]: boolean;
        }>({
            alias: false,
            ownership: false,
            customParameter: false,
            promote: false,
        });

        let [sshConsoleOpen, setSshConsoleOpen] = useState(false);

        let [promoteAuthType, setPromoteAuthType] = useState<
            "password" | "sshKey"
        >("password");
        let [promoteUsername, setPromoteUsername] = useState<string>("");
        let [promotePassword, setPromotePassword] = useState<string>("");

        let [currentServerOwner, setCurrentServerOwner] = useState<string>(
            serverInfo.operator
        );
        let [currentAlias, setCurrentAlias] = useState<string>(
            serverInfo.alias || ""
        );
        let [currentCustomParameter, setCurrentCustomParameter] =
            useState<string>("");

        let { data: _, refetch: refetchCustomParameter } =
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
        let { mutate: promoteServer, isPending: isPromoteServerPending } =
            useGeneralPost({
                queryKey: ["promote-tracking-server"],
                path: "/promote-tracking-server",
            });
        let { mutate: setBulkSkip } = useGeneralPost({
            queryKey: ["set-server-bulk-skip"],
            path: "/set-server-bulk-skip",
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
                setCurrentCustomParameter(result.data?.customParameter || "");
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

        const handlePromoteServer = () => {
            if (!promoteUsername.trim()) {
                toast.error("Username cannot be empty.");
                return;
            }
            if (promoteAuthType === "password" && !promotePassword.trim()) {
                toast.error("Password cannot be empty.");
                return;
            }
            promoteServer(
                {
                    server: serverInfo.server,
                    authType: promoteAuthType,
                    username: promoteUsername.trim(),
                    password:
                        promoteAuthType === "password"
                            ? promotePassword.trim()
                            : "",
                } as unknown as void,
                {
                    onSuccess: () => {
                        toast.success(
                            "Promotion started. Setup is running on the server."
                        );
                        queryClient.setQueryData<{ servers: Server[] }>(
                            ["my-servers"],
                            (oldData) => {
                                if (!oldData) return { servers: [] };
                                return {
                                    ...oldData,
                                    servers: oldData.servers.map((_serverInfo) =>
                                        _serverInfo.server === serverInfo.server
                                            ? {
                                                  ..._serverInfo,
                                                  username:
                                                      promoteUsername.trim(),
                                                  status: "setting_up",
                                              }
                                            : _serverInfo
                                    ),
                                };
                            }
                        );
                        setPromoteUsername("");
                        setPromotePassword("");
                        setDialogsOpen((prev) => ({ ...prev, promote: false }));
                    },
                    onError: (error) => {
                        toast.error("Failed to promote server: " + error.message);
                    },
                }
            );
        };

        const handleToggleBulkSkip = () => {
            let newSkip = !serverInfo.skipBulkSelect;
            setBulkSkip(
                {
                    server: serverInfo.server,
                    skip: newSkip,
                } as unknown as void,
                {
                    onSuccess: () => {
                        toast.success(
                            newSkip
                                ? "Excluded from bulk select"
                                : "Included in bulk select"
                        );
                        queryClient.setQueryData<{ servers: Server[] }>(
                            ["my-servers"],
                            (oldData) => {
                                if (!oldData) return { servers: [] };
                                return {
                                    ...oldData,
                                    servers: oldData.servers.map((_serverInfo) =>
                                        _serverInfo.server === serverInfo.server
                                            ? {
                                                  ..._serverInfo,
                                                  skipBulkSelect: newSkip,
                                              }
                                            : _serverInfo
                                    ),
                                };
                            }
                        );
                    },
                    onError: (error) => {
                        toast.error(
                            "Failed to update bulk-select: " + error.message
                        );
                    },
                }
            );
        };

        // Determine if the server is tracking only (no OS and active status, because we skip the setup)
        let isTrackingOnly = !serverInfo.os && serverInfo.status === "active";
        let myOperator = MyStorage.getUserInfo()?.username || "unknown";

        return (
            <>
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
                        <div className="flex flex-wrap items-center gap-1">
                            <span>{serverInfo.server}</span>
                            <Badge variant="outline">
                                {serverInfo.ipInfo?.country}
                            </Badge>
                            {isTrackingOnly && (
                                <Badge className="bg-[var(--accent-2)] text-background">
                                    Tracking Only
                                </Badge>
                            )}
                            {serverInfo.skipBulkSelect && (
                                <Badge variant="secondary">No bulk</Badge>
                            )}
                        </div>
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
                                                    : "text-background"
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
                                    className={`${bgColorMap[serverInfo.status]} text-background`}
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
                                        <DialogTrigger asChild>
                                            <div className="pl-2 flex items-center py-1 cursor-pointer hover:bg-muted">
                                                <Users size={20} />
                                                <span className="ml-1">
                                                    Transfer Ownership
                                                </span>
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="min-w-3/6">
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Transfer Server Ownership
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Transfer the ownership of
                                                    this server to another
                                                    operator.
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
                                                    dialogsOpen[
                                                        "customParameter"
                                                    ]
                                                }
                                                onOpenChange={(open) => {
                                                    if (open) {
                                                        handleOpenCustomParameter();
                                                    } else {
                                                        setDialogsOpen(
                                                            (prev) => ({
                                                                ...prev,
                                                                customParameter: false,
                                                            })
                                                        );
                                                    }
                                                }}
                                            >
                                                <DialogTrigger asChild>
                                                    <div className="pl-2 flex items-center py-1 cursor-pointer hover:bg-muted">
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
                                                            Custom Launch
                                                            Parameter
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Extra CLI arguments
                                                            appended when
                                                            launching the lite
                                                            node on{" "}
                                                            {serverInfo.server}.
                                                            Leave empty to use
                                                            no extra parameters.
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
                                    {(myOperator === serverInfo.operator ||
                                        myOperator === "admin") &&
                                        isTrackingOnly && (
                                            <Dialog
                                                open={dialogsOpen["promote"]}
                                                onOpenChange={(open) =>
                                                    setDialogsOpen((prev) => ({
                                                        ...prev,
                                                        ["promote"]: open,
                                                    }))
                                                }
                                            >
                                                <DialogTrigger asChild>
                                                    <div className="pl-2 flex items-center py-1 cursor-pointer hover:bg-muted">
                                                        <KeyRound size={20} />
                                                        <span className="ml-1">
                                                            Add Credentials
                                                        </span>
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent className="min-w-3/6">
                                                    <DialogHeader>
                                                        <DialogTitle>
                                                            Promote to Managed
                                                            Node
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Add SSH credentials
                                                            for{" "}
                                                            {serverInfo.server}{" "}
                                                            to run setup and
                                                            convert this
                                                            tracking-only server
                                                            into a managed node.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-3">
                                                        <Input
                                                            value={
                                                                promoteUsername
                                                            }
                                                            onChange={(e) =>
                                                                setPromoteUsername(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="SSH username"
                                                        />
                                                        {promoteAuthType ===
                                                            "password" && (
                                                            <Input
                                                                type="password"
                                                                value={
                                                                    promotePassword
                                                                }
                                                                onChange={(e) =>
                                                                    setPromotePassword(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="SSH password"
                                                            />
                                                        )}
                                                        <div className="flex flex-col gap-2">
                                                            <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-primary/10">
                                                                <Checkbox
                                                                    checked={
                                                                        promoteAuthType ===
                                                                        "password"
                                                                    }
                                                                    onCheckedChange={() =>
                                                                        setPromoteAuthType(
                                                                            "password"
                                                                        )
                                                                    }
                                                                    className="data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                                                />
                                                                <span className="text-sm leading-none font-medium">
                                                                    Use Password
                                                                    Authentication
                                                                </span>
                                                            </Label>
                                                            <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-primary/10">
                                                                <Checkbox
                                                                    checked={
                                                                        promoteAuthType ===
                                                                        "sshKey"
                                                                    }
                                                                    onCheckedChange={() => {
                                                                        setPromoteAuthType(
                                                                            "sshKey"
                                                                        );
                                                                        setPromotePassword(
                                                                            ""
                                                                        );
                                                                    }}
                                                                    className="data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                                                />
                                                                <span className="text-sm leading-none font-medium">
                                                                    Use SSH Key
                                                                    Authentication
                                                                </span>
                                                            </Label>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end">
                                                        {!isPromoteServerPending ? (
                                                            <Button
                                                                onClick={
                                                                    handlePromoteServer
                                                                }
                                                                className="cursor-pointer"
                                                            >
                                                                Promote
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                disabled
                                                                className="cursor-not-allowed"
                                                            >
                                                                Promoting...
                                                            </Button>
                                                        )}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    {(myOperator === serverInfo.operator ||
                                        myOperator === "admin") &&
                                        !isTrackingOnly && (
                                        <div
                                            onClick={() =>
                                                setSshConsoleOpen(true)
                                            }
                                            className="pl-2 flex items-center py-1 cursor-pointer hover:bg-muted"
                                        >
                                            <TerminalIcon size={20} />
                                            <span className="ml-1">
                                                SSH Console
                                            </span>
                                        </div>
                                    )}
                                    {(myOperator === serverInfo.operator ||
                                        myOperator === "admin") && (
                                        <div
                                            onClick={handleToggleBulkSkip}
                                            className="pl-2 flex items-center py-1 cursor-pointer hover:bg-muted"
                                        >
                                            {serverInfo.skipBulkSelect ? (
                                                <>
                                                    <ListChecks size={20} />
                                                    <span className="ml-1">
                                                        Include in Select-All
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <ListX size={20} />
                                                    <span className="ml-1">
                                                        Exclude from Select-All
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <div className="text-destructive pl-2 flex items-center py-1 cursor-pointer hover:bg-muted">
                                                <Trash size={20} />
                                                <span className="ml-1">
                                                    Delete
                                                </span>
                                            </div>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Are you absolutely sure?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be
                                                    undone. This will
                                                    permanently delete your
                                                    server.
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
                                                    className="bg-destructive hover:bg-destructive/90 cursor-pointer"
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
                <SshConsoleDialog
                    server={serverInfo.server}
                    open={sshConsoleOpen}
                    onOpenChange={setSshConsoleOpen}
                />
            </>
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

    let [bulkLiteParamOpen, setBulkLiteParamOpen] = useState(false);
    let [bulkLiteParam, setBulkLiteParam] = useState<string>("");
    let {
        mutate: setAllLiteNodesCustomParameter,
        isPending: isApplyAllLiteParamPending,
    } = useGeneralPost({
        queryKey: ["set-all-lite-nodes-custom-parameter"],
        path: "/set-all-lite-nodes-custom-parameter",
    });

    const handleApplyAllLiteParam = () => {
        setAllLiteNodesCustomParameter(
            { customParameter: bulkLiteParam } as unknown as void,
            {
                onSuccess: (res: any) => {
                    toast.success(
                        `Applied to lite nodes: ${res.updated} updated, ` +
                            `${res.skipped} unchanged (of ${res.total}).`
                    );
                    setBulkLiteParamOpen(false);
                },
                onError: (error) => {
                    toast.error(
                        "Failed to apply custom parameter: " + error.message
                    );
                },
            }
        );
    };

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
            (server) =>
                server.services.includes(type) &&
                server.username &&
                !server.skipBulkSelect
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
                <h3 className="text-2xl font-bold mb-4 font-display">Manage Servers</h3>{" "}
                <CommandLogs />
                <div>
                    <div className="py-2 flex items-center gap-2">
                        <NewServer />
                        <Button
                            onClick={handleRefreshServers}
                            variant={"ghost"}
                            size={"icon-sm"}
                            className="cursor-pointer"
                        >
                            <RefreshCcw size={16} />
                        </Button>
                        <div className="h-5 w-px bg-border mx-1" />
                        <Button
                            onClick={() => handleSelectAllType("liteNode")}
                            variant={"outline"}
                            size={"sm"}
                            className="cursor-pointer h-8 text-xs gap-1.5"
                        >
                            <ServerIcon size={13} />
                            Select Lite Nodes
                        </Button>
                        <Button
                            onClick={() => handleSelectAllType("bobNode")}
                            variant={"outline"}
                            size={"sm"}
                            className="cursor-pointer h-8 text-xs gap-1.5"
                        >
                            <Bot size={13} />
                            Select Bob Nodes
                        </Button>
                        <div className="h-5 w-px bg-border mx-1" />
                        <Dialog
                            open={bulkLiteParamOpen}
                            onOpenChange={setBulkLiteParamOpen}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    size={"sm"}
                                    className="cursor-pointer h-8 text-xs gap-1.5"
                                >
                                    <SlidersHorizontal size={13} />
                                    Custom Param: All Lite Nodes
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="min-w-3/6">
                                <DialogHeader>
                                    <DialogTitle>
                                        Custom Launch Parameter — All Lite Nodes
                                    </DialogTitle>
                                    <DialogDescription>
                                        Extra CLI arguments appended when
                                        launching every lite node you own. Saved
                                        now; takes effect on each node's next
                                        deploy/restart. Nodes that already have
                                        this exact value are left unchanged.
                                        Leave empty to clear the parameter on all
                                        lite nodes.
                                    </DialogDescription>
                                </DialogHeader>
                                <Textarea
                                    value={bulkLiteParam}
                                    onChange={(e) =>
                                        setBulkLiteParam(e.target.value)
                                    }
                                    placeholder="e.g. --some-flag --value 123"
                                    className="font-mono text-sm"
                                    rows={3}
                                />
                                <div className="flex justify-end">
                                    {!isApplyAllLiteParamPending ? (
                                        <Button
                                            onClick={handleApplyAllLiteParam}
                                            className="cursor-pointer"
                                        >
                                            Apply to All Lite Nodes
                                        </Button>
                                    ) : (
                                        <Button
                                            disabled
                                            className="cursor-not-allowed"
                                        >
                                            Applying...
                                        </Button>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
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
                        <div className="text-destructive">
                            Error loading servers: {error.message}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
