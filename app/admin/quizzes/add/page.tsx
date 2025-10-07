import React from "react";
import AddQuizAdminPage from "@/modules/admin/pages/AddQuizAdminPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Quiz",
  description: "Add New Quiz",
};

const page = () => {
  return <AddQuizAdminPage />;
};

export default page;
