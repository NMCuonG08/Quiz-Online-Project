import React from "react";
import AddCourse from "@/modules/admin/courses/AddCourse";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Add Course",
    description: "Add a new course",
};

const page = () => {
    return <AddCourse />;
};

export default page;
