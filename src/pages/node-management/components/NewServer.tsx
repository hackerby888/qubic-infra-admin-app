import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Check, HardDrive, KeySquare, Plus, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useGeneralPost from "@/networking/api";
import { Link } from "react-router";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";

function isValidIPv4(ip: string) {
    return /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(
        ip
    );
}

export default function NewServer() {
    let [isOpen, setIsOpen] = useState(false);
    let [serverIps, setServerIps] = useState("");
    let [username, setUsername] = useState("");
    let [password, setPassword] = useState("");
    let [authType, setAuthType] = useState<"password" | "sshKey" | "tracking">(
        "password"
    );
    let [services, setServices] = useState<{
        liteNode: boolean;
        bobNode: boolean;
    }>({
        liteNode: false,
        bobNode: false,
    });

    let { mutate: addServersToBackend, isPending: isAddingServers } =
        useGeneralPost({
            queryKey: ["add-servers"],
            path: "/new-servers",
        });

    const handleAddServer = () => {
        if (!serverIps) {
            toast.error("Please fill in all the fields.");
            return;
        }

        if (authType === "password") {
            if (!username || !password) {
                toast.error("Username and Password cannot be empty.");
                return;
            }
        } else if (authType === "sshKey") {
            if (!username) {
                toast.error("Username cannot be empty.");
                return;
            }
        }

        let ips = serverIps
            .split(",")
            .map((ip) => ip.trim())
            .filter((ip) => ip !== "");

        for (let ip of ips) {
            if (!isValidIPv4(ip)) {
                toast.error(`Invalid IP address: ${ip}`);
                return;
            }
        }

        if (!services.liteNode && !services.bobNode) {
            toast.error("Please select at least one service.");
            return;
        }

        let serversData = ips.map((ip) => {
            let expectedPassword = authType === "password" ? password : "";
            return {
                ip: ip.trim(),
                username: username.trim(),
                password: expectedPassword.trim(),
                services: {
                    liteNode: services.liteNode,
                    bobNode: services.bobNode,
                },
            };
        });

        addServersToBackend(
            {
                servers: serversData,
                authType: authType,
            } as unknown as void,
            {
                onSuccess: () => {
                    toast.success("Servers added successfully.");
                    // Reset form
                    setServerIps("");
                    setUsername("");
                    setPassword("");
                    setServices({
                        liteNode: false,
                        bobNode: false,
                    });
                    setIsOpen(false);
                },
                onError: (error) => {
                    toast.error(
                        "Failed to add servers. Error: " + error.message
                    );
                },
            }
        );
    };

    const handleServiceChange = (service: "liteNode" | "bobNode") => {
        setServices((prev) => ({
            ...prev,
            [service]: !prev[service],
        }));
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
        setter(e.target.value);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(value) => setIsOpen(value)}>
            <DialogTrigger asChild>
                <Button variant={"outline"} className="cursor-pointer">
                    <Plus /> New Server
                </Button>
            </DialogTrigger>
            <DialogContent className="min-w-3/6">
                <DialogHeader>
                    <DialogTitle>Add New Server</DialogTitle>
                    <DialogDescription>
                        Add a new server to manage your nodes.
                    </DialogDescription>
                </DialogHeader>
                <div className="my-2">
                    <div className="box">
                        <FieldGroup>
                            <Field>
                                <FieldLabel>Server Credentials</FieldLabel>
                                <FieldDescription>
                                    Provide your server SSH credentials to
                                    connect to your server.
                                </FieldDescription>
                                <div className="flex space-x-3">
                                    {" "}
                                    <InputGroup>
                                        <InputGroupInput
                                            onChange={(e) =>
                                                handleInputChange(
                                                    e,
                                                    setServerIps
                                                )
                                            }
                                            value={serverIps}
                                            placeholder="server ips (eg. 127.0.0.1,192.168.1.1)"
                                        />
                                        <InputGroupAddon>
                                            <HardDrive />
                                        </InputGroupAddon>
                                    </InputGroup>
                                    <InputGroup
                                        className={`w-1/2 ${
                                            authType === "tracking" &&
                                            "opacity-0"
                                        }`}
                                    >
                                        <InputGroupInput
                                            disabled={authType === "tracking"}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    e,
                                                    setUsername
                                                )
                                            }
                                            value={username}
                                            className={`w-full`}
                                            placeholder="username"
                                        />
                                        <InputGroupAddon>
                                            <User />
                                        </InputGroupAddon>
                                    </InputGroup>
                                    <InputGroup
                                        className={`w-1/2 ${
                                            (authType === "tracking" ||
                                                authType === "sshKey") &&
                                            "opacity-0"
                                        }`}
                                    >
                                        <InputGroupInput
                                            type="password"
                                            disabled={
                                                authType === "sshKey" ||
                                                authType === "tracking"
                                            }
                                            onChange={(e) =>
                                                handleInputChange(
                                                    e,
                                                    setPassword
                                                )
                                            }
                                            value={password}
                                            className="w-full"
                                            placeholder="password"
                                        />
                                        <InputGroupAddon>
                                            <KeySquare />
                                        </InputGroupAddon>
                                    </InputGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label className="w-fit hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
                                        <Checkbox
                                            checked={authType === "password"}
                                            onCheckedChange={() => {
                                                setAuthType("password");
                                            }}
                                            className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                                        />
                                        <div className="grid gap-1.5 font-normal">
                                            <p className="text-sm leading-none font-medium">
                                                Use Password Authentication
                                            </p>
                                            <p className="text-muted-foreground text-sm"></p>
                                        </div>
                                    </Label>
                                    <Label className="w-fit hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
                                        <Checkbox
                                            checked={authType === "sshKey"}
                                            onCheckedChange={() => {
                                                setAuthType("sshKey");
                                                setPassword("");
                                            }}
                                            className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                                        />
                                        <div className="grid gap-1.5 font-normal">
                                            <p className="text-sm leading-none font-medium">
                                                Use SSH Key Authentication
                                            </p>
                                            <p className="text-muted-foreground text-sm">
                                                We will use the SSH keys you
                                                have previously set up{" "}
                                                <Link
                                                    className="text-blue-600"
                                                    to={"/node-management/auth"}
                                                >
                                                    here
                                                </Link>{" "}
                                                to authenticate with these
                                                servers.
                                            </p>
                                        </div>
                                    </Label>
                                    <Label className="w-fit hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
                                        <Checkbox
                                            checked={authType === "tracking"}
                                            onCheckedChange={() => {
                                                setAuthType("tracking");
                                                setUsername("");
                                                setPassword("");
                                            }}
                                            className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                                        />
                                        <div className="grid gap-1.5 font-normal">
                                            <p className="text-sm leading-none font-medium">
                                                No Authentication (Tracking
                                                Only)
                                            </p>
                                            <p className="text-muted-foreground text-sm">
                                                We will only track node status
                                                on this server (no setup/deploy
                                                will be done).
                                            </p>
                                        </div>
                                    </Label>
                                </div>
                            </Field>
                            <Field>
                                <FieldLabel>Server Services</FieldLabel>
                                <FieldDescription>
                                    Which services to run on this server.
                                </FieldDescription>
                                <div className="flex space-x-3">
                                    <div className="flex items-center text-sm">
                                        <Checkbox
                                            onCheckedChange={() =>
                                                handleServiceChange("liteNode")
                                            }
                                            checked={services.liteNode}
                                            id="lite-node"
                                            className="mr-2"
                                        />
                                        <Label htmlFor="lite-node">
                                            Lite Node
                                        </Label>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <Checkbox
                                            onCheckedChange={() =>
                                                handleServiceChange("bobNode")
                                            }
                                            checked={services.bobNode}
                                            id="bob-node"
                                            className="mr-2"
                                        />
                                        <Label htmlFor="bob-node">
                                            Bob Node
                                        </Label>
                                    </div>
                                </div>
                            </Field>
                        </FieldGroup>
                        <Button
                            disabled={isAddingServers}
                            onClick={handleAddServer}
                            className="mt-4 cursor-pointer float-right"
                        >
                            <Check className="mr-2" />
                            {isAddingServers ? "Adding..." : "Add Server(s)"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
