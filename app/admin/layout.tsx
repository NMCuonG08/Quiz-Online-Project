import React from "react";
import AdminLayout from "@/modules/admin/common/layouts/AdminLayout";
export const metadata = {
  title: "Admin page",
  description: "Admin page",
};

export default function RootAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminLayout>{children}</AdminLayout>;
}
