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
import { MyStorage } from "@/utils/storage";
import { Button } from "../ui/button";
import { useState } from "react";
import { Input } from "../ui/input";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import useGeneralPost from "@/networking/api";
import { hashSHA256 } from "@/utils/crypto";
import { toast } from "sonner";
import {
    useLoginReloadStore,
    type LoginReloadState,
} from "@/stores/login-reload-store";

export default function LoginButton() {
    let operatorToken = MyStorage.getLoginCredential();
    let operatorInfo = MyStorage.decodeTokenPayload(operatorToken || "");
    let isLoggedIn = operatorToken && operatorInfo;
    let [username, setUsername] = useState("");
    let [password, setPassword] = useState("");
    let [open, setOpen] = useState(false);
    const [, setTick] = useState(0);

    const forceRerender = () => setTick((tick) => tick + 1);

    const loginReload = useLoginReloadStore() as LoginReloadState;
    let { mutate: doLogin, isPending } = useGeneralPost({
        queryKey: ["login"],
        path: "/login",
    });

    const handleLogin = async () => {
        let passwordHash = await hashSHA256(password);
        let body = {
            username,
            passwordHash,
        };
        doLogin(body as unknown as void, {
            onSuccess: (data: any) => {
                MyStorage.setLoginCredential(data.token);
                // Close dialog or give feedback
                toast.success("Login successful!");
                setOpen(false);
                loginReload.triggerReload();
            },
            onError: (error: any) => {
                toast.error("Login failed: " + error.message);
            },
        });
    };

    const handleLogout = () => {
        MyStorage.clearLoginCredential();
        forceRerender();
        loginReload.triggerReload();
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger>
                    <span className="font-semibold cursor-pointer">
                        {isLoggedIn ? operatorInfo?.username : "Login"}
                    </span>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Login</DialogTitle>
                        <DialogDescription>
                            {isLoggedIn
                                ? "You are logged in as " +
                                  operatorInfo?.username
                                : "Please enter your credentials to log in."}
                        </DialogDescription>
                    </DialogHeader>
                    {isLoggedIn ? (
                        <div></div>
                    ) : (
                        <div className="grid gap-4 py-4">
                            <Alert>
                                <AlertTitle>
                                    Visit Qubic Discord server for account
                                    creation
                                </AlertTitle>
                                <AlertDescription>
                                    https://discord.gg/5ANywnBXfd
                                </AlertDescription>
                            </Alert>
                            <Alert>
                                <AlertTitle>
                                    How to become a operator?
                                </AlertTitle>
                                <AlertDescription>
                                    Please contact the system administrator
                                    (@feiyuiv or @dkat.) to create an operator
                                    account for you.
                                </AlertDescription>
                            </Alert>
                            <div className="grid gap-2">
                                <label
                                    htmlFor="username"
                                    className="text-sm font-medium leading-none"
                                >
                                    Username
                                </label>
                                <Input
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    value={username}
                                    id="username"
                                    type="text"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium leading-none"
                                >
                                    Password
                                </label>
                                <Input
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    value={password}
                                    id="password"
                                    type="password"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        {isLoggedIn ? (
                            <Button
                                onClick={() => handleLogout()}
                                className="cursor-pointer"
                                variant="destructive"
                            >
                                Loggout
                            </Button>
                        ) : (
                            <Button
                                disabled={isPending}
                                onClick={() => handleLogin()}
                                className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                            >
                                {isPending ? "Logging in..." : "Login"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
