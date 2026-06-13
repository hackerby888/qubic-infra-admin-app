import { Power, PowerOff, RotateCcw, ScrollText } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { useState } from "react";
import {
    useSelectedServersStore,
    type SelectedServersState,
} from "@/stores/selected-servers-store";
import useGeneralPost from "@/networking/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import CommandLogs from "@/pages/node-management/components/CommandLogs";
export default function PowerManagement() {
    let queryClient = useQueryClient();
    const availableCommands = {
        shutdown: {
            label: "Shutdown",
            icon: PowerOff,
        },
        restart: {
            label: "Restart",
            icon: RotateCcw,
        },
    };

    type CommandType = keyof typeof availableCommands;

    const selectedStore = useSelectedServersStore() as SelectedServersState;
    let [isOpenObj, setIsOpenObj] = useState({
        shutdown: false,
        restart: false,
    });
    let [command, setCommand] = useState<"shutdown" | "restart">("shutdown");
    let [logsOpen, setLogsOpen] = useState(false);
    let [services, setServices] = useState<
        { name: string; enabled: boolean }[]
    >([
        { name: "Lite Node", enabled: false },
        { name: "Bob Node", enabled: false },
    ]);

    let { mutate: sendCommand, isPending: isSendingCommand } = useGeneralPost({
        queryKey: ["send-command", command],
        path: "/command",
    });

    const toggleService = (index: number) => {
        const updatedServices = [...services];
        updatedServices[index].enabled = !updatedServices[index].enabled;
        setServices(updatedServices);
    };

    const toggleOpen = (type: "shutdown" | "restart", value: boolean) => {
        setIsOpenObj((prev) => ({
            ...prev,
            [type]: value,
        }));
    };

    const handleSubmitCommand = () => {
        let body = {
            command: command,
            services: services
                .filter((service) => service.enabled)
                .map((service) =>
                    service.name === "Lite Node" ? "liteNode" : "bobNode"
                ),
            servers: selectedStore.selectedServers,
        };

        if (body.services.length === 0) {
            toast.error("Please select at least one service to proceed.");
            return;
        }

        if (body.servers.length === 0) {
            toast.error("No servers selected.");
            return;
        }

        sendCommand(body as any, {
            onSuccess: () => {
                toast.success(
                    `${availableCommands[command].label} command sent successfully`
                );
                setServices([
                    { name: "Lite Node", enabled: false },
                    { name: "Bob Node", enabled: false },
                ]);
                toggleOpen(command, false);
                queryClient.invalidateQueries({
                    queryKey: ["command-logs"],
                });
            },
            onError: () => {
                toast.error(
                    `Failed to send ${availableCommands[command].label} command`
                );
            },
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Power className="cursor-pointer hover:font-bold" size={20} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="flex flex-col">
                {Object.entries(availableCommands).map(([key, commandData]) => (
                    <div className="border-b border-b-border py-2 flex items-center text-sm font-semibold cursor-pointer p-1 hover:bg-muted">
                        <Dialog
                            open={isOpenObj[key as CommandType]}
                            onOpenChange={(value) =>
                                toggleOpen(key as CommandType, value)
                            }
                        >
                            <DialogTrigger
                                onClick={() => setCommand(key as CommandType)}
                                className="w-full flex items-center cursor-pointer"
                            >
                                <commandData.icon className="mr-1" size={15} />
                                {commandData.label}
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Select Services To Be{" "}
                                        {commandData.label}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Please select the services you want to
                                        shutdown before proceeding.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="w-full space-y-2">
                                    {/* <div className="cursor-pointer bg-gray-100 rounded-sm w-full px-2 py-1 opacity-50">
                                    Lite Node
                                </div>
                                <div className="cursor-pointer bg-gray-100 rounded-sm w-full px-2 py-1">
                                    Bob Node
                                </div> */}
                                    {services.map((service, index) => (
                                        <div
                                            onClick={() => toggleService(index)}
                                            className={`cursor-pointer text-sm rounded-sm w-full px-2 py-1 ${
                                                service.enabled
                                                    ? "bg-muted"
                                                    : "bg-muted/50 opacity-50"
                                            }`}
                                        >
                                            {service.name}
                                        </div>
                                    ))}
                                </div>
                                <DialogFooter>
                                    <DialogClose className="cursor-pointer bg-muted hover:bg-muted/70 px-4 py-2 rounded-md">
                                        Cancel
                                    </DialogClose>
                                    {!isSendingCommand ? (
                                        <button
                                            onClick={() =>
                                                handleSubmitCommand()
                                            }
                                            className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                                        >
                                            Confirm
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="cursor-not-allowed bg-muted text-muted-foreground px-4 py-2 rounded-md"
                                        >
                                            Sending...
                                        </button>
                                    )}
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                ))}
                {/* <div className="py-2 flex items-center text-sm font-semibold cursor-pointer p-1 hover:bg-gray-100">
                    <RotateCcw className="mr-1" size={15} />
                    Restart
                </div> */}
                <div className="py-2 flex items-center text-sm font-semibold cursor-pointer p-1 hover:bg-muted">
                    <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
                        <DialogTrigger className="w-full flex items-center cursor-pointer">
                            <ScrollText className="mr-1" size={15} />
                            View Logs
                        </DialogTrigger>
                        <DialogContent className="min-w-3/6 max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    Shutdown / Restart Logs
                                </DialogTitle>
                                <DialogDescription>
                                    Output and status of the power commands
                                    you've sent.
                                </DialogDescription>
                            </DialogHeader>
                            <CommandLogs
                                isStandardCommand={true}
                                showDeleteAll={false}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
