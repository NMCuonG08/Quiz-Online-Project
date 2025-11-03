import React from "react";
import EditCategoryAdminPage from "@/modules/admin/pages/EditCategoryAdminPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Quiz Category",
  description: "Edit Quiz Category",
};

const page = () => {
  return <EditCategoryAdminPage />;
};

export default page;
