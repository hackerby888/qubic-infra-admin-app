export interface LiteNodeTickInfo {
    server: string;
    alias?: string;
    ipInfo: IpInfo;
    operator: string;
    tick: number;
    epoch: number;
    alignedVotes: number;
    misalignedVotes: number;
    initialTick: number;
    lastUpdated: number;
    mainAuxStatus: number;
    lastTickChanged: number;
    isPrivate: boolean;
    groupId: string;
    isSavingSnapshot: boolean;
}

export interface BobNodeTickInfo {
    server: string;
    alias?: string;
    ipInfo: IpInfo;
    operator: string;
    currentProcessingEpoch: number;
    currentFetchingTick: number;
    currentFetchingLogTick: number;
    currentVerifyLoggingTick: number;
    currentIndexingTick: number;
    initialTick: number;
    lastUpdated: number;
    lastTickChanged: number;
    isPrivate: boolean;
}

export interface GithubTag {
    name: string;
    zipball_url: string;
    tarball_url: string;
    commit: {
        sha: string;
        url: string;
    };
    node_id: string;
}

export interface User {
    username: string;
    passwordHash: string;
    role: "admin" | "operator";
    insertedAt: number;
    currentsshPrivateKey?: string;
}

export type ServiceType = "liteNode" | "bobNode" | "null";
export type NodeStatus =
    | "setting_up"
    | "active"
    | "error"
    | "stopped"
    | "restarting";

export interface IpInfo {
    country: string;
    region: string;
    city: string;
    isp: string;
}

export interface Server {
    server: string;
    ipInfo?: IpInfo;
    alias?: string;
    operator: string;
    username: string;
    password: string;
    services: ServiceType[];
    cpu?: string;
    os?: string;
    ram?: string;
    status: NodeStatus;
    setupLogs?: {
        stdout: string;
        stderr: string;
    };
    deployStatus?: {
        liteNode?: NodeStatus;
        bobNode?: NodeStatus;
    };
    deployLogs?: {
        liteNode?: {
            stdout: string;
            stderr: string;
        };
        bobNode?: {
            stdout: string;
            stderr: string;
        };
    };
    sshPrivateKey: string;
}

export interface CommandLog {
    operator: string;
    server?: string;
    command: string;
    stdout: string;
    stderr: string;
    timestamp: number;
    status: "pending" | "completed" | "failed";
    uuid: string;
    duration: number;
}

export interface ShortcutCommand {
    operator: string;
    name: string;
    command: string;
}

export interface ServersStatus {
    statuses: {
        liteNodes: LiteNodeTickInfo[];
        bobNodes: BobNodeTickInfo[];
    };
}

export interface CronJob {
    operator: string;
    cronId: string;
    name: string;
    schedule: string;
    command: string;
    type: "system" | "custom";
    lastRun: number | null;
    status: "success" | "failed" | "running" | "idle";
    isEnabled: boolean;
}
