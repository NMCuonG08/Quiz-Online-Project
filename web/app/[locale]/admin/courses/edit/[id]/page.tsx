import React from "react";
import EditCourse from "@/modules/admin/courses/EditCourse";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Edit Course",
    description: "Edit existing course",
};

const page = () => {
    return <EditCourse />;
};

export default page;
