"use client";

import React, { useEffect } from "react";
import Breadcrumb from "@/modules/admin/common/components/Breadcrumb";
import { UserListTable } from "../users/components/UserListTable";
import { useAdminUsers } from "../users/hooks/useAdminUsers";

const UserManagementPage = () => {
    const { users, roles, loading, error, getUsers, getRoles, changeUserRoles } =
        useAdminUsers();

    useEffect(() => {
        void getUsers();
        void getRoles();
    }, [getUsers, getRoles]);

    if (loading && users.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <>
            <Breadcrumb pageName="User Management" />

            <div className="flex flex-col gap-10">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                        {error}
                    </div>
                )}

                <UserListTable
                    users={users}
                    roles={roles}
                    onUpdateRoles={async (userId, roleIds) => {
                        await changeUserRoles(userId, roleIds);
                    }}
                />
            </div>
        </>
    );
};

export default UserManagementPage;
