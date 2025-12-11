import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { CornerDownLeft, SquareTerminal, Terminal } from "lucide-react";
import {
    useSelectedServersStore,
    type SelectedServersState,
} from "@/stores/selected-servers-store";
import { useState } from "react";
import useGeneralPost, { useGeneralGet } from "@/networking/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { CommandLog } from "@/types/type";

const LITE_COMMANDS_MAP = {
    "F8/SaveSnapShot (Lite Node)": "f8/savesnapshot:lite",
    "F10/ClearMemory (Lite Node)": "f10/clearmemory:lite",
};

const BOB_COMMANDS_MAP = {
    "PlaceBinary (Bob Node)": "placebinary:bob::<url>",
};

export default function ShellManagement() {
    let queryClient = useQueryClient();

    let [command, setCommand] = useState<string>("");
    let [isOpen, setIsOpen] = useState<boolean>(false);
    const selectedStore = useSelectedServersStore() as SelectedServersState;

    let { mutate: sendCommand, isPending: isSendingCommand } = useGeneralPost({
        queryKey: ["execute-command", command],
        path: "/execute-command",
    });

    let { data: commandLogs } = useGeneralGet<{ commandLogs: CommandLog[] }>({
        queryKey: ["command-logs"],
        path: "/command-logs",
        reqQuery: {
            isStandardCommand: "false",
            limit: "7",
        },
    });

    const handleSubmitCommand = () => {
        if (selectedStore.selectedServers.length === 0) {
            return toast.error(
                "Please select at least one server to run the command."
            );
        }
        if (command.trim() === "") {
            return toast.error("Command cannot be empty.");
        }
        let body = {
            command: command,
            servers: selectedStore.selectedServers,
        };
        sendCommand(body as any, {
            onSuccess: () => {
                toast.success("Command execution initiated.");
                setCommand("");
                setIsOpen(false);
                queryClient.invalidateQueries({ queryKey: ["command-logs"] });
            },
            onError: (error: any) => {
                toast.error(
                    `Error: ${error.message || "Failed to execute command."}`
                );
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger>
                {" "}
                <SquareTerminal className="cursor-pointer" size={20} />
            </DialogTrigger>
            <DialogContent className="min-w-1/2">
                <div className="flex items-center justify-center mt-4">
                    <div className="w-full flex flex-col">
                        {/* <span className="text-sm text-gray-600 border border-b-0 w-fit rounded-t-sm px-4 py-1">
                            $ Bash
                        </span> */}
                        <InputGroup className="rounded-none">
                            <InputGroupInput
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                className="rounded-none"
                                placeholder="Enter your commands"
                            />
                            <InputGroupAddon>
                                <Terminal />
                            </InputGroupAddon>
                        </InputGroup>
                    </div>
                    {!isSendingCommand ? (
                        <Button
                            onClick={handleSubmitCommand}
                            className="ml-3 cursor-pointer text-sm"
                        >
                            RUN
                            <CornerDownLeft />
                        </Button>
                    ) : (
                        <Button className="ml-3 cursor-pointer" disabled>
                            Running...
                        </Button>
                    )}
                </div>
                <div>
                    <span className="font-semibold">Quick Commands</span>
                    <ul className="mt-2 space-y-1 text-sm flex space-x-1">
                        {Object.entries(LITE_COMMANDS_MAP).map(
                            ([label, cmd]) => (
                                <li>
                                    <Button
                                        onClick={() => setCommand(cmd)}
                                        variant={"outline"}
                                        className="cursor-pointer text-[12px]"
                                    >
                                        {label}
                                    </Button>
                                </li>
                            )
                        )}
                    </ul>
                    <ul className="mt-2 space-y-1 text-sm flex space-x-1">
                        {Object.entries(BOB_COMMANDS_MAP).map(
                            ([label, cmd]) => (
                                <li>
                                    <Button
                                        onClick={() => setCommand(cmd)}
                                        variant={"outline"}
                                        className="cursor-pointer text-[12px]"
                                    >
                                        {label}
                                    </Button>
                                </li>
                            )
                        )}
                    </ul>
                </div>
                <div>
                    <span className="font-semibold">Recent Commands</span>
                    <ul className="mt-2 space-y-1 text-sm">
                        {commandLogs?.commandLogs.map((log) => (
                            <li
                                onClick={() => setCommand(log.command)}
                                className="cursor-pointer p-2 bg-gray-100 rounded-sm hover:bg-gray-200"
                                key={log.uuid}
                            >
                                {log.command}{" "}
                                <span className="text-xs text-gray-500">
                                    {new Date(log.timestamp).toLocaleString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </DialogContent>
        </Dialog>
    );
}
