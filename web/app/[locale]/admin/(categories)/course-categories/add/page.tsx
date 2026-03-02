import React from "react";
import AddCourseCategory from "@/modules/admin/course-categories/AddCourseCategory";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Add Course Category",
    description: "Add a new course category",
};

const page = () => {
    return (
        <div>
            <AddCourseCategory />
        </div>
    );
};

export default page;
