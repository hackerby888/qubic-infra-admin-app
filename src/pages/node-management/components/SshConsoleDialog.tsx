import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import socket from "@/networking/socket";
import { MyStorage } from "@/utils/storage";
import { TerminalIcon } from "lucide-react";

interface SshConsoleDialogProps {
    server: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SshConsoleDialog({
    server,
    open,
    onOpenChange,
}: SshConsoleDialogProps) {
    let termRef = useRef<HTMLDivElement>(null);
    let termInstance = useRef<Terminal | null>(null);
    let fitAddon = useRef<FitAddon | null>(null);
    let [status, setStatus] = useState<"connecting" | "connected" | "error" | "closed">("connecting");
    let [errorMsg, setErrorMsg] = useState<string>("");
    let isSubscribed = useRef(false);

    useEffect(() => {
        if (!open) return;

        const term = new Terminal({
            cursorBlink: true,
            fontSize: 13,
            fontFamily: '"Cascadia Code", "Fira Code", "Menlo", monospace',
            theme: {
                background: "#0d1117",
                foreground: "#c9d1d9",
                cursor: "#58a6ff",
                selectionBackground: "#264f78",
                black: "#484f58",
                red: "#ff7b72",
                green: "#3fb950",
                yellow: "#d29922",
                blue: "#58a6ff",
                magenta: "#bc8cff",
                cyan: "#39c5cf",
                white: "#b1bac4",
                brightBlack: "#6e7681",
                brightRed: "#ffa198",
                brightGreen: "#56d364",
                brightYellow: "#e3b341",
                brightBlue: "#79c0ff",
                brightMagenta: "#d2a8ff",
                brightCyan: "#56d4dd",
                brightWhite: "#f0f6fc",
            },
        });
        const fit = new FitAddon();
        term.loadAddon(fit);
        termInstance.current = term;
        fitAddon.current = fit;

        // Small delay to let Dialog finish rendering before opening the terminal
        const mountTimer = setTimeout(() => {
            if (!termRef.current) return;
            term.open(termRef.current);
            fit.fit();

            const token = MyStorage.getLoginCredential();
            const { cols, rows } = term;

            socket.emit("subscribeToSshConsole", {
                host: server,
                token,
                cols,
                rows,
            });
            isSubscribed.current = true;
            setStatus("connecting");
            term.write("\r\nConnecting to " + server + "...\r\n");
        }, 100);

        const handleOutput = (data: string) => {
            if (status !== "connected") setStatus("connected");
            term.write(data);
        };
        const handleError = (msg: string) => {
            setStatus("error");
            setErrorMsg(msg);
            term.write(`\r\n\x1b[31mError: ${msg}\x1b[0m\r\n`);
        };
        const handleClose = () => {
            setStatus("closed");
            term.write("\r\n\x1b[33mConnection closed.\x1b[0m\r\n");
        };

        socket.on("sshConsoleOutput", handleOutput);
        socket.on("sshConsoleError", handleError);
        socket.on("sshConsoleClose", handleClose);

        term.onData((data) => {
            socket.emit("sshConsoleInput", data);
        });

        const handleResize = () => {
            if (!fitAddon.current || !termInstance.current) return;
            fitAddon.current.fit();
            socket.emit("sshConsoleResize", {
                cols: termInstance.current.cols,
                rows: termInstance.current.rows,
            });
        };
        window.addEventListener("resize", handleResize);

        return () => {
            clearTimeout(mountTimer);
            window.removeEventListener("resize", handleResize);
            socket.off("sshConsoleOutput", handleOutput);
            socket.off("sshConsoleError", handleError);
            socket.off("sshConsoleClose", handleClose);
            if (isSubscribed.current) {
                socket.emit("unsubscribeFromSshConsole");
                isSubscribed.current = false;
            }
            term.dispose();
            termInstance.current = null;
            fitAddon.current = null;
        };
    }, [open, server]);

    // Refit when dialog finishes opening
    useEffect(() => {
        if (open && fitAddon.current && termInstance.current) {
            setTimeout(() => {
                fitAddon.current?.fit();
                socket.emit("sshConsoleResize", {
                    cols: termInstance.current!.cols,
                    rows: termInstance.current!.rows,
                });
            }, 150);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-[90vw] max-w-[90vw] h-[85vh] flex flex-col p-4 gap-2">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <TerminalIcon size={18} />
                        SSH Console — {server}
                        {status === "connecting" && (
                            <span className="text-xs text-yellow-500 font-normal">connecting...</span>
                        )}
                        {status === "connected" && (
                            <span className="text-xs text-green-500 font-normal">connected</span>
                        )}
                        {status === "error" && (
                            <span className="text-xs text-red-500 font-normal">error: {errorMsg}</span>
                        )}
                        {status === "closed" && (
                            <span className="text-xs text-gray-400 font-normal">closed</span>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <div
                    ref={termRef}
                    className="flex-1 rounded overflow-hidden bg-[#0d1117] min-h-0"
                    style={{ padding: "4px" }}
                />
            </DialogContent>
        </Dialog>
    );
}
