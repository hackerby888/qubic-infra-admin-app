import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import useGeneralPost, { useGeneralGet } from "@/networking/api";
import type { CronJob } from "@/types/type";
import { MyStorage } from "@/utils/storage";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

const systemCronJobs = {
    "auto-save-snapshot": {
        name: "Auto Save Snapshot",
        schedule: "Auto determined",
        type: "system",
    },
};

export default function CronJobs() {
    const queryClient = useQueryClient();
    let [cronName, setCronName] = useState("");
    let [cronSchedule, setCronSchedule] = useState("");
    let [cronCommand, setCronCommand] = useState("");
    let [cronType, setCronType] = useState<"system" | "custom">("custom");
    let { data: cronJobs } = useGeneralGet<{
        cronJobs: CronJob[];
    }>({
        queryKey: ["cron-jobs"],
        path: "/cron-jobs",
    });

    let { mutate: addCronJob } = useGeneralPost({
        queryKey: ["cron-jobs", "add"],
        path: "/cron-jobs",
    });

    let { mutate: updateCronJob } = useGeneralPost({
        queryKey: ["cron-jobs", "update"],
        path: "/cron-jobs/update",
    });

    let { mutate: deleteCronJob } = useGeneralPost({
        queryKey: ["cron-jobs", "delete"],
        path: "/cron-jobs",
        method: "DELETE",
    });

    const handleDeleteCronJob = (cronId: string) => {
        deleteCronJob(
            {
                cronId,
            } as any,
            {
                onSuccess: () => {
                    // Update local state
                    queryClient.setQueryData(["cron-jobs"], (oldData: any) => {
                        if (!oldData) return oldData;
                        let updatedCronJobs = oldData.cronJobs.filter(
                            (job: CronJob) => job.cronId !== cronId
                        );
                        return {
                            ...oldData,
                            cronJobs: updatedCronJobs,
                        };
                    });
                    toast.success("Cron job deleted successfully");
                },
                onError: (error) => {
                    toast.error(
                        "Failed to delete cron job: " +
                            (error as Error).message || "Unknown error"
                    );
                },
            }
        );
    };

    const handleChangeIsEnabled = (cronId: string, isEnabled: boolean) => {
        updateCronJob(
            {
                cronId,
                updates: {
                    isEnabled,
                },
            } as any,
            {
                onSuccess: () => {
                    // Update local state
                    queryClient.setQueryData(["cron-jobs"], (oldData: any) => {
                        if (!oldData) return oldData;
                        let updatedCronJobs = oldData.cronJobs.map(
                            (job: CronJob) => {
                                if (job.cronId === cronId) {
                                    return {
                                        ...job,
                                        isEnabled,
                                    };
                                }
                                return job;
                            }
                        );
                        return {
                            ...oldData,
                            cronJobs: updatedCronJobs,
                        };
                    });
                    toast.success("Cron job updated successfully");
                },
                onError: (error) => {
                    toast.error(
                        "Failed to update cron job: " +
                            (error as Error).message || "Unknown error"
                    );
                },
            }
        );
    };

    const handleAddCronJob = () => {
        let operator = MyStorage.getUserInfo()?.username || "default";
        addCronJob(
            {
                operator: operator,
                name: cronName,
                schedule: cronSchedule,
                command: cronCommand,
                type: cronType,
            } as any,
            {
                onSuccess: () => {
                    // Reset form fields
                    setCronName("");
                    setCronSchedule("");
                    setCronCommand("");
                    setCronType("custom");
                    // Invalidate and refetch cron jobs
                    queryClient.invalidateQueries(["cron-jobs"] as any);
                    toast.success("Cron job added successfully");
                },
                onError: (error) => {
                    toast.error(
                        "Failed to add cron job: " + (error as Error).message ||
                            "Unknown error"
                    );
                },
            }
        );
    };

    const handleSetSystemCronCommand = (systemCommand: string) => {
        // check if the system command exists in the system cron jobs
        let systemJob =
            systemCronJobs[systemCommand as keyof typeof systemCronJobs];
        if (systemJob) {
            setCronName(systemJob.name);
            setCronSchedule(systemJob.schedule);
            setCronCommand(systemCommand);
            setCronType("system");
        } else {
            toast.error("Invalid system cron commandL " + systemCommand);
        }
    };

    return (
        <div className="p-4">
            <h3 className="text-2xl font-bold mb-4">Cron Jobs</h3>
            <Dialog>
                <DialogTrigger>
                    <Button variant={"outline"} className="my-2 cursor-pointer">
                        Add Cron Job
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div>
                                <label className="block mb-1 text-sm">
                                    Cron Job Name
                                </label>
                                <Input
                                    type="text"
                                    value={cronName}
                                    onChange={(e) =>
                                        setCronName(e.target.value)
                                    }
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm">
                                    Schedule
                                </label>
                                <Input
                                    type="text"
                                    value={cronSchedule}
                                    onChange={(e) =>
                                        setCronSchedule(e.target.value)
                                    }
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm">
                                    Command
                                </label>
                                <Input
                                    type="text"
                                    value={cronCommand}
                                    onChange={(e) =>
                                        setCronCommand(e.target.value)
                                    }
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm">
                                    Type
                                </label>
                                <select
                                    value={cronType}
                                    onChange={(e) =>
                                        setCronType(
                                            e.target.value as
                                                | "system"
                                                | "custom"
                                        )
                                    }
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                >
                                    <option value="system">System</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <span>System Cron Job</span>
                            <ul className="mt-2 space-y-1 text-sm">
                                <li
                                    onClick={() => {
                                        handleSetSystemCronCommand(
                                            "auto-save-snapshot"
                                        );
                                    }}
                                    className="cursor-pointer p-2 bg-gray-100 rounded-sm hover:bg-gray-200"
                                >
                                    <span className="text-sm">
                                        Auto Save Snapshot
                                    </span>
                                    <span className="text-xs text-gray-500 ml-1">
                                        (Auto press `F8` key on Lite Node to
                                        save snapshot periodically)
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <Button
                            className="cursor-pointer my-2"
                            onClick={handleAddCronJob}
                        >
                            Add Cron Job
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cron Id</TableHead>
                        <TableHead>Cron Job Name</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Last Run</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enable</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cronJobs &&
                        cronJobs.cronJobs.map((job) => (
                            <TableRow key={job.cronId}>
                                <TableCell>{job.cronId}</TableCell>
                                <TableCell>{job.name}</TableCell>
                                <TableCell>{job.schedule}</TableCell>
                                <TableCell>{job.type}</TableCell>
                                <TableCell>
                                    {job.lastRun
                                        ? new Date(job.lastRun).toLocaleString()
                                        : "Never"}
                                </TableCell>
                                <TableCell>{job.status}</TableCell>
                                <TableCell>
                                    <Checkbox
                                        checked={job.isEnabled}
                                        onCheckedChange={(checked) => {
                                            handleChangeIsEnabled(
                                                job.cronId,
                                                Boolean(checked)
                                            );
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <span
                                        onClick={() =>
                                            handleDeleteCronJob(job.cronId)
                                        }
                                        className="text-red-500 cursor-pointer"
                                    >
                                        Delete
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
        </div>
    );
}
