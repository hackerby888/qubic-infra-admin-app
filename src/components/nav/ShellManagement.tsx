import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
    ChevronsUpDown,
    CornerDownLeft,
    SquareTerminal,
    Terminal,
} from "lucide-react";
import {
    useSelectedServersStore,
    type SelectedServersState,
} from "@/stores/selected-servers-store";
import { useState } from "react";
import useGeneralPost, { useGeneralGet } from "@/networking/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { CommandLog, ShortcutCommand } from "@/types/type";
import { Input } from "../ui/input";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "../ui/collapsible";

const LITE_COMMANDS_MAP = {
    "F8/SaveSnapShot (Lite Node)": "f8/savesnapshot:lite",
    "F10/ClearMemory (Lite Node)": "f10/clearmemory:lite",
};

const BOB_COMMANDS_MAP = {
    "PlaceBinary (Bob Node)": "placebinary:bob::<url>",
    "Restart Kvrocks (Bob Node)": "restartkvrocks:bob",
    "Restart Keydb (Bob Node)": "restartkeydb:bob",
};

export default function ShellManagement() {
    let queryClient = useQueryClient();

    let [shortcutName, setShortcutName] = useState<string>("");
    let [shortcutCommand, setShortcutCommand] = useState<string>("");
    let [command, setCommand] = useState<string>("");
    let [isOpen, setIsOpen] = useState<boolean>(false);
    const selectedStore = useSelectedServersStore() as SelectedServersState;

    let { data: commands, isLoading: isShortcutCommandsLoading } =
        useGeneralGet<{ commands: ShortcutCommand[] }>({
            queryKey: ["shortcut-commands"],
            path: "/shortcut-commands",
        });

    let { mutate: addShortcutCommand, isPending: isAddingShortcutCommand } =
        useGeneralPost({
            queryKey: ["add-shortcut-command"],
            path: "/add-shortcut-command",
        });

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

    const handleAddShortcutCommand = () => {
        if (shortcutName.trim() === "" || shortcutCommand.trim() === "") {
            return toast.error("Name and Command cannot be empty.");
        }
        let body = {
            name: shortcutName,
            command: shortcutCommand,
        };
        addShortcutCommand(body as any, {
            onSuccess: () => {
                toast.success("Shortcut command added.");
                setShortcutName("");
                setShortcutCommand("");
                queryClient.invalidateQueries({
                    queryKey: ["shortcut-commands"],
                });
            },
            onError: (error: any) => {
                toast.error(
                    `Error: ${
                        error.message || "Failed to add shortcut command."
                    }`
                );
            },
        });
    };

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
                    <div className="flex flex-col">
                        <span className="font-semibold">
                            My Custom Commands
                        </span>
                        <Collapsible>
                            <CollapsibleTrigger className="my-2">
                                <span className="cursor-pointer text-[14px] rounded-sm shadow-sm p-2">
                                    Add new
                                    <ChevronsUpDown
                                        className="inline-block ml-1 mb-1"
                                        size={14}
                                    />
                                </span>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                {" "}
                                <div className="flex space-x-2 mt-2 items-center">
                                    <Input
                                        value={shortcutName}
                                        onChange={(e) =>
                                            setShortcutName(e.target.value)
                                        }
                                        className="w-4/12"
                                        placeholder="Name"
                                    />
                                    <Input
                                        value={shortcutCommand}
                                        onChange={(e) =>
                                            setShortcutCommand(e.target.value)
                                        }
                                        placeholder="Command"
                                    />
                                    {!isAddingShortcutCommand ? (
                                        <Button
                                            onClick={handleAddShortcutCommand}
                                            className=""
                                        >
                                            Add Command
                                        </Button>
                                    ) : (
                                        <Button className="" disabled>
                                            Adding...
                                        </Button>
                                    )}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm flex space-x-1">
                        {commands?.commands.map((command) => (
                            <li key={command.name}>
                                <Button
                                    onClick={() => setCommand(command.command)}
                                    variant={"outline"}
                                    className="cursor-pointer text-[12px]"
                                >
                                    {command.name}
                                </Button>
                            </li>
                        ))}
                        {commands?.commands.length === 0 && (
                            <li className="text-gray-500 text-sm">
                                No custom commands found
                            </li>
                        )}
                        {isShortcutCommandsLoading && <li>Loading...</li>}
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
