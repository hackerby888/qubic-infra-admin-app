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
import { Input } from "@/components/ui/input";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useGeneralPost from "@/networking/api";

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
        if (!serverIps || !username || !password) {
            toast.error("Please fill in all the fields.");
            return;
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

        let body = ips.map((ip) => {
            return {
                ip,
                username,
                password,
                services: {
                    liteNode: services.liteNode,
                    bobNode: services.bobNode,
                },
            };
        });

        addServersToBackend(body as unknown as void, {
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
                toast.error("Failed to add servers. Error: " + error.message);
            },
        });
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
                                    <Input
                                        onChange={(e) =>
                                            handleInputChange(e, setServerIps)
                                        }
                                        value={serverIps}
                                        className="w-1/2"
                                        placeholder="server ips (eg. 127.0.0.1,192.168.1.1)"
                                    />
                                    <Input
                                        onChange={(e) =>
                                            handleInputChange(e, setUsername)
                                        }
                                        value={username}
                                        className="w-1/4"
                                        placeholder="username"
                                    />
                                    <Input
                                        onChange={(e) =>
                                            handleInputChange(e, setPassword)
                                        }
                                        value={password}
                                        className="w-1/4"
                                        placeholder="password"
                                    />
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
