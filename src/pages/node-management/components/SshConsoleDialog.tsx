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
import { MyStorage } from "@/utils/storage";
import { API_SERVER } from "@/consts/api-server";
import { TerminalIcon } from "lucide-react";

type Status = "connecting" | "connected" | "error" | "closed";

interface SshConsoleDialogProps {
    server: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface TtydCredentials {
    host: string;
    port: number;
    token: string;
}

// ttyd WebSocket protocol — one ASCII byte prefix per frame.
// https://github.com/tsl0922/ttyd/blob/main/src/protocol.c
const ClientMsg = {
    INPUT: "0",
    RESIZE: "1",
    PAUSE: "2",
    RESUME: "3",
    JSON_DATA: "{",
};
const ServerMsg = {
    OUTPUT: 0x30, // '0'
    SET_WINDOW_TITLE: 0x31, // '1'
    SET_PREFERENCES: 0x32, // '2'
};

function buildTtydUrl(creds: TtydCredentials) {
    // ttyd serves TLS only — always use wss so https frontends don't trip
    // mixed-content blocking and http frontends still work fine.
    return `wss://${creds.host}:${creds.port}/${creds.token}/ws`;
}

function buildTtydTrustUrl(creds: TtydCredentials) {
    return `https://${creds.host}:${creds.port}/${creds.token}/`;
}

async function fetchTtydCredentials(host: string): Promise<TtydCredentials> {
    const token = MyStorage.getLoginCredential();
    const res = await fetch(`${API_SERVER}/ttyd-credentials`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ host }),
    });
    if (!res.ok) {
        let msg = `Failed to fetch ttyd credentials (${res.status})`;
        try {
            const body = await res.json();
            if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
    }
    return (await res.json()) as TtydCredentials;
}

function encodeClientMsg(type: string, data: string | Uint8Array): Uint8Array {
    const head = new TextEncoder().encode(type);
    const body =
        typeof data === "string" ? new TextEncoder().encode(data) : data;
    const out = new Uint8Array(head.length + body.length);
    out.set(head, 0);
    out.set(body, head.length);
    return out;
}

export default function SshConsoleDialog({
    server,
    open,
    onOpenChange,
}: SshConsoleDialogProps) {
    let termRef = useRef<HTMLDivElement>(null);
    let termInstance = useRef<Terminal | null>(null);
    let fitAddon = useRef<FitAddon | null>(null);
    let wsRef = useRef<WebSocket | null>(null);
    let [status, setStatus] = useState<Status>("connecting");
    let [errorMsg, setErrorMsg] = useState<string>("");
    let [credentials, setCredentials] = useState<TtydCredentials | null>(null);
    let [retryNonce, setRetryNonce] = useState(0);

    useEffect(() => {
        if (!open) return;

        let cancelled = false;
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
        setStatus("connecting");
        setErrorMsg("");
        setCredentials(null);

        const sendResize = (cols: number, rows: number) => {
            const ws = wsRef.current;
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            ws.send(
                encodeClientMsg(
                    ClientMsg.RESIZE,
                    JSON.stringify({ columns: cols, rows })
                )
            );
        };

        const mountTimer = setTimeout(async () => {
            if (cancelled || !termRef.current) return;
            term.open(termRef.current);
            fit.fit();
            term.write(`\r\nConnecting to ${server}...\r\n`);

            let creds: TtydCredentials;
            try {
                creds = await fetchTtydCredentials(server);
            } catch (err) {
                if (cancelled) return;
                const msg = (err as Error).message;
                setStatus("error");
                setErrorMsg(msg);
                term.write(`\r\n\x1b[31mError: ${msg}\x1b[0m\r\n`);
                return;
            }
            if (cancelled) return;
            setCredentials(creds);

            const ws = new WebSocket(buildTtydUrl(creds), ["tty"]);
            ws.binaryType = "arraybuffer";
            wsRef.current = ws;

            ws.onopen = () => {
                if (cancelled) {
                    ws.close();
                    return;
                }
                // ttyd expects an initial JSON_DATA frame before it will accept input.
                // With HTTP Basic auth the body can be an empty object.
                ws.send(encodeClientMsg(ClientMsg.JSON_DATA, "{}"));
                sendResize(term.cols, term.rows);
                setStatus("connected");
            };

            ws.onmessage = (ev) => {
                if (!(ev.data instanceof ArrayBuffer)) return;
                const view = new Uint8Array(ev.data);
                if (view.length === 0) return;
                const type = view[0];
                const payload = view.subarray(1);
                if (type === ServerMsg.OUTPUT) {
                    term.write(payload);
                }
                // SET_WINDOW_TITLE / SET_PREFERENCES — ignored.
            };

            ws.onerror = () => {
                if (cancelled) return;
                setStatus("error");
                setErrorMsg("WebSocket error");
                term.write(
                    `\r\n\x1b[31mError: failed to connect to ttyd on ${server}:${creds.port}\x1b[0m\r\n`
                );
            };

            ws.onclose = (ev) => {
                if (cancelled) return;
                setStatus((s) => (s === "error" ? s : "closed"));
                if (ev.code !== 1000 && ev.code !== 1005) {
                    term.write(
                        `\r\n\x1b[33mConnection closed (code ${ev.code}).\x1b[0m\r\n`
                    );
                } else {
                    term.write(
                        `\r\n\x1b[33mConnection closed.\x1b[0m\r\n`
                    );
                }
            };

            term.onData((data) => {
                if (ws.readyState !== WebSocket.OPEN) return;
                ws.send(encodeClientMsg(ClientMsg.INPUT, data));
            });
        }, 100);

        const handleResize = () => {
            if (!fitAddon.current || !termInstance.current) return;
            fitAddon.current.fit();
            const t = termInstance.current;
            sendResize(t.cols, t.rows);
        };
        window.addEventListener("resize", handleResize);

        return () => {
            cancelled = true;
            clearTimeout(mountTimer);
            window.removeEventListener("resize", handleResize);
            try {
                wsRef.current?.close();
            } catch {}
            wsRef.current = null;
            term.dispose();
            termInstance.current = null;
            fitAddon.current = null;
        };
    }, [open, server, retryNonce]);

    useEffect(() => {
        if (open && fitAddon.current && termInstance.current) {
            setTimeout(() => {
                fitAddon.current?.fit();
                const t = termInstance.current!;
                const ws = wsRef.current;
                if (!ws || ws.readyState !== WebSocket.OPEN) return;
                ws.send(
                    encodeClientMsg(
                        "1",
                        JSON.stringify({ columns: t.cols, rows: t.rows })
                    )
                );
            }, 150);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-[90vw] max-w-[90vw] h-[85vh] flex flex-col p-4 gap-2">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <TerminalIcon size={18} />
                        Shell — {server}
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
                {status === "error" && credentials && (
                    <div className="shrink-0 text-xs flex items-center gap-3 rounded bg-yellow-500/10 border border-yellow-500/40 px-3 py-2">
                        <span className="text-yellow-200">
                            First time connecting? The node uses a self-signed cert your browser doesn't trust yet.
                        </span>
                        <a
                            href={buildTtydTrustUrl(credentials)}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-yellow-100 hover:text-yellow-50"
                        >
                            Open node in new tab to trust the certificate
                        </a>
                        <button
                            type="button"
                            onClick={() => setRetryNonce((n) => n + 1)}
                            className="ml-auto rounded bg-yellow-500/20 hover:bg-yellow-500/30 px-2 py-1 text-yellow-100"
                        >
                            Retry
                        </button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
