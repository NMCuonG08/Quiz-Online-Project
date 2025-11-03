import React from "react";
import ListCategoriesTable from "./components/ListCategoriesTable";
import Breadcrumb from "@/modules/admin/common/components/Breadcrumb";

const ListQuizzesCategories = () => {
  return (
    <div>
      <Breadcrumb pageName="Tables" />
      <ListCategoriesTable />
    </div>
  );
};

export default ListQuizzesCategories;
