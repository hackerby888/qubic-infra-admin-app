import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function Operator() {
    return (
        <div className="p-4">
            <h3 className="text-2xl font-bold mb-4">Operator Management</h3>
            <div className="flex flex-col space-y-4">
                <div className="p-4 bg-white rounded-sm shadow-sm">
                    <h4 className="text-lg font-semibold mb-2">Operators</h4>
                    <p className="text-sm text-gray-500">
                        Manage operators who have access to this Lite Node
                        administration panel.
                    </p>
                </div>
                <div className="p-4 bg-white rounded-sm shadow-sm">
                    <h4 className="text-lg font-semibold mb-2">
                        Add New Operator
                    </h4>
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-col">
                            <label
                                htmlFor="username"
                                className="text-sm font-medium mb-1"
                            >
                                Username
                            </label>
                            <Input
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
                                type="password"
                                id="password"
                                className="border border-gray-300 rounded-sm p-2"
                                placeholder="Enter password"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="cursor-pointer text-sm bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600 w-fit float-right"
                        >
                            Add Operator
                        </Button>
                    </div>
                </div>
                <div>
                    <h4 className="text-lg font-semibold mb-2">
                        Existing Operators
                    </h4>
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
                            <TableRow>
                                <TableCell>operator1</TableCell>
                                <TableCell>Operator</TableCell>
                                <TableCell>2024-01-15</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>operator2</TableCell>
                                <TableCell>Operator</TableCell>
                                <TableCell>2024-02-20</TableCell>
                                <TableCell>
                                    <span className="text-red-500 cursor-pointer hover:underline">
                                        Remove
                                    </span>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
