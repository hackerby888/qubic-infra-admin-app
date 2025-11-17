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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import useGeneralPost, { useGeneralGet } from "@/networking/api";
import type { User } from "@/types/type";
import { hashSHA256 } from "@/utils/crypto";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export default function Operator() {
    const queryClient = useQueryClient();
    let [currentRole, setCurrentRole] = useState<"operator" | "admin">(
        "operator"
    );
    let [open, setOpen] = useState(false);
    let [username, setUsername] = useState("");
    let [password, setPassword] = useState("");

    let { mutate: addOperator, isPending: isAddingOperator } = useGeneralPost({
        queryKey: ["register-operator"],
        path: "/operators",
    });
    let { data: operators, isLoading: isLoadingOperators } = useGeneralGet<{
        operators: User[];
    }>({
        queryKey: ["get-operators"],
        path: "/operators",
    });
    let { mutate: deleteOperator, isPending: isDeletingOperator } =
        useGeneralPost({
            queryKey: ["delete-operator"],
            path: "/operators",
            method: "DELETE",
        });

    const handleRoleChange = (role: "operator" | "admin") => {
        setCurrentRole(role);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            toast.error("Please fill in all the fields.");
            return;
        }

        let passwordHash = await hashSHA256(password);
        let body = {
            username,
            passwordHash,
            role: currentRole,
        };

        addOperator(body as unknown as void, {
            onSuccess: () => {
                toast.success("Operator added successfully.");
                setUsername("");
                setPassword("");
                setOpen(false);
            },
            onError: (error: any) => {
                toast.error("Failed to add operator: " + error.message);
            },
        });
    };

    const handleDelete = (username: string) => {
        deleteOperator({ username } as unknown as void, {
            onSuccess: () => {
                toast.success("Operator deleted successfully.");
                queryClient.invalidateQueries({ queryKey: ["get-operators"] });
            },
            onError: (error: any) => {
                toast.error("Failed to delete operator: " + error.message);
            },
        });
    };

    return (
        <div className="p-4">
            <h3 className="text-2xl font-bold mb-4">Operator Management</h3>
            <div className="flex flex-col space-y-4">
                <div className="p-4 bg-white rounded-sm shadow-sm">
                    <h4 className="text-lg font-semibold mb-2">Operators</h4>
                    <p className="text-sm text-gray-500">
                        Manage operators who have access to this administration
                        panel.
                    </p>
                </div>

                <div>
                    <h4 className="text-lg font-semibold mb-2">
                        Existing Operators
                    </h4>
                    <div className="mb-1">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger>
                                {" "}
                                <Button
                                    className="cursor-pointer"
                                    variant={"outline"}
                                >
                                    <span className="mr-1">+ </span>Add New
                                    Operator
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add new operator</DialogTitle>
                                    <DialogDescription>
                                        Provide the username and password for
                                        the new operator.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="">
                                    <div className="flex flex-col space-y-4">
                                        <div className="flex flex-col">
                                            <label
                                                htmlFor="username"
                                                className="text-sm font-medium mb-1"
                                            >
                                                Username
                                            </label>
                                            <Input
                                                value={username}
                                                onChange={(e) =>
                                                    setUsername(e.target.value)
                                                }
                                                type="text"
                                                id="username"
                                                className="border border-gray-300 rounded-sm p-2"
                                                placeholder="Enter username"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label
                                                htmlFor="password"
                                                className="text-sm font-medium mb-1"
                                            >
                                                Password
                                            </label>
                                            <Input
                                                value={password}
                                                onChange={(e) =>
                                                    setPassword(e.target.value)
                                                }
                                                type="password"
                                                id="password"
                                                className="border border-gray-300 rounded-sm p-2"
                                                placeholder="Enter password"
                                            />
                                        </div>
                                        <div className="flex flex-col text-sm">
                                            <label
                                                htmlFor="role"
                                                className="text-sm font-medium mb-1"
                                            >
                                                Role
                                            </label>
                                            <div
                                                className="flex items-center cursor-pointer mb-2"
                                                onClick={() =>
                                                    handleRoleChange("operator")
                                                }
                                            >
                                                <Checkbox
                                                    checked={
                                                        currentRole ==
                                                        "operator"
                                                    }
                                                />
                                                <span className="ml-2">
                                                    Operator
                                                </span>
                                            </div>
                                            <div
                                                className="flex items-center cursor-pointer mb-2"
                                                onClick={() =>
                                                    handleRoleChange("admin")
                                                }
                                            >
                                                <Checkbox
                                                    checked={
                                                        currentRole == "admin"
                                                    }
                                                />
                                                <span className="ml-2">
                                                    Admin
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            {" "}
                                            {!isAddingOperator ? (
                                                <Button
                                                    onClick={handleSubmit}
                                                    type="submit"
                                                    className="cursor-pointer text-sm bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600 w-fit float-right"
                                                >
                                                    Add Operator
                                                </Button>
                                            ) : (
                                                <Button
                                                    disabled
                                                    className="cursor-pointer text-sm bg-gray-400 text-white px-4 py-2 rounded-sm w-fit float-right"
                                                >
                                                    Adding...
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Date Added</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingOperators ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-4">
                                        Loading operators...
                                    </TableCell>
                                </TableRow>
                            ) : operators && operators.operators.length > 0 ? (
                                operators.operators.map((operator) => (
                                    <TableRow key={operator.username}>
                                        <TableCell>
                                            {operator.username}
                                        </TableCell>
                                        <TableCell>{operator.role}</TableCell>
                                        <TableCell>
                                            {new Date(
                                                operator.insertedAt
                                            ).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {!isDeletingOperator ? (
                                                <span
                                                    className="text-red-500 cursor-pointer hover:underline"
                                                    onClick={() =>
                                                        handleDelete(
                                                            operator.username
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">
                                                    Deleting...
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-4">
                                        No operators found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
