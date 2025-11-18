export interface LiteNodeTickInfo {
    server: string;
    operator: string;
    tick: number;
    epoch: number;
    alignedVotes: number;
    misalignedVotes: number;
    initialTick: number;
    lastUpdated: number;
    lastTickChanged: number;
    isPrivate: boolean;
}

export interface BobNodeTickInfo {
    server: string;
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

export interface ServersStatus {
    statuses: {
        liteNodes: LiteNodeTickInfo[];
        bobNodes: BobNodeTickInfo[];
    };
}
