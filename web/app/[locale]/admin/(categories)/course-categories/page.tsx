import React from "react";
import ListCoursesCategories from "@/modules/admin/course-categories/ListCoursesCategories";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Course Categories",
    description: "Manage course categories",
};

const CourseCategoriesAdminPage = () => {
    return <ListCoursesCategories />;
};

export default CourseCategoriesAdminPage;
