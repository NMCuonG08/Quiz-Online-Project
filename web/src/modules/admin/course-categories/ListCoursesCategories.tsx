import React from "react";
import ListCourseCategoriesTable from "./components/ListCourseCategoriesTable";
import Breadcrumb from "@/modules/admin/common/components/Breadcrumb";

const ListCoursesCategories = () => {
    return (
        <div>
            <Breadcrumb pageName="Course Categories" />
            <ListCourseCategoriesTable />
        </div>
    );
};

export default ListCoursesCategories;
