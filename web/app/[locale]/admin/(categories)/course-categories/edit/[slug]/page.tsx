import React from "react";
import EditCourseCategory from "@/modules/admin/course-categories/EditCourseCategory";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Edit Course Category",
    description: "Edit a course category",
};

const page = () => {
    return <EditCourseCategory />;
};

export default page;
