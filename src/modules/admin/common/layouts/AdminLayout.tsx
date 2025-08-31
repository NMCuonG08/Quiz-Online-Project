"use client";

import React from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminNavbar from "../components/AdminNavbar";

const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AdminSidebar>
      <AdminNavbar />
      <div className="p-4 w-full">{children}</div>
    </AdminSidebar>
  );
};

export default AdminLayout;
