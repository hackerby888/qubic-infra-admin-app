import { Power, PowerOff, RotateCcw } from "lucide-react";
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
export default function PowerManagement() {
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
                <Power
                    className="cursor-pointer hover:text-blue-500"
                    size={20}
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="flex flex-col">
                {Object.entries(availableCommands).map(([key, commandData]) => (
                    <div className="border-b     border-b-gray-100 py-2 flex items-center text-sm font-semibold cursor-pointer p-1 hover:bg-gray-100">
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
                                                    ? "bg-gray-200"
                                                    : "bg-gray-100"
                                            }`}
                                        >
                                            {service.name}
                                        </div>
                                    ))}
                                </div>
                                <DialogFooter>
                                    <DialogClose className="cursor-pointer bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">
                                        Cancel
                                    </DialogClose>
                                    {!isSendingCommand ? (
                                        <button
                                            onClick={() =>
                                                handleSubmitCommand()
                                            }
                                            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                        >
                                            Confirm
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="cursor-not-allowed bg-gray-400 text-white px-4 py-2 rounded-md"
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
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
