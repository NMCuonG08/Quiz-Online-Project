import React from "react";
import EditQuizAdminPage from "@/modules/admin/pages/EditQuizAdminPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Quiz",
  description: "Edit Quiz",
};

const page = () => {
  return <EditQuizAdminPage />;
};

export default page;
