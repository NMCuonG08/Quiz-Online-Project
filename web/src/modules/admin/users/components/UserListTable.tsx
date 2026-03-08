"use client";

import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/common/components/ui/table";
import { User, Role } from "../types";
import { cn } from "@/lib/utils";
import { Edit2 } from "lucide-react";
import { Button } from "@/common/components/ui/button";

interface UserListTableProps {
    users: User[];
    roles: Role[];
    onUpdateRoles: (userId: string, roleIds: string[]) => Promise<void>;
}

export const UserListTable: React.FC<UserListTableProps> = ({
    users,
    roles,
    onUpdateRoles,
}) => {
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

    const handleEdit = (user: User) => {
        setEditingUserId(user.id);
        setSelectedRoleIds(user.userRoles.map((ur) => ur.roleId));
    };

    const handleSave = async (userId: string) => {
        await onUpdateRoles(userId, selectedRoleIds);
        setEditingUserId(null);
    };

    const toggleRole = (roleId: string) => {
        setSelectedRoleIds((prev) =>
            prev.includes(roleId)
                ? prev.filter((id) => id !== roleId)
                : [...prev, roleId]
        );
    };

    return (
        <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-[#122031] dark:shadow-card sm:p-7.5">
            <Table>
                <TableHeader>
                    <TableRow className="border-none bg-[#F7F9FC] dark:bg-[#122031] [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
                        <TableHead className="min-w-[150px] xl:pl-7.5">User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead className="text-right xl:pr-7.5">Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id} className="border-[#eee] dark:border-dark-3">
                            <TableCell className="min-w-[150px] xl:pl-7.5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-2 dark:bg-dark overflow-hidden">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.username || ""} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full w-full text-lg font-bold">
                                                {(user.full_name || user.username || user.email).charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h5 className="font-medium text-dark dark:text-white">
                                            {user.full_name || user.username || "Anonymous"}
                                        </h5>
                                        <p className="text-xs text-body-sm italic">@{user.username || "no-username"}</p>
                                    </div>
                                </div>
                            </TableCell>

                            <TableCell>
                                <p className="text-dark dark:text-white">{user.email}</p>
                            </TableCell>

                            <TableCell>
                                {editingUserId === user.id ? (
                                    <div className="flex flex-wrap gap-2">
                                        {roles.map((role) => (
                                            <button
                                                key={role.id}
                                                onClick={() => toggleRole(role.id)}
                                                className={cn(
                                                    "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                                                    selectedRoleIds.includes(role.id)
                                                        ? "bg-primary text-white border-primary"
                                                        : "bg-gray-2 text-dark dark:bg-dark dark:text-white border-stroke dark:border-dark-3 hover:border-primary"
                                                )}
                                            >
                                                {role.name}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {user.userRoles.length > 0 ? (
                                            user.userRoles.map((ur) => (
                                                <span
                                                    key={ur.roleId}
                                                    className="rounded-full bg-primary/[0.08] px-3 py-1 text-xs font-medium text-primary border border-primary/20"
                                                >
                                                    {ur.role.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No roles</span>
                                        )}
                                    </div>
                                )}
                            </TableCell>

                            <TableCell className="text-right xl:pr-7.5">
                                {editingUserId === user.id ? (
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setEditingUserId(null)}
                                            className="text-gray-500"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleSave(user.id)}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="hover:text-primary transition-colors p-2"
                                        title="Edit Roles"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
