import React from "react";
import ListQuizByCategory from "@/modules/client/category/ListQuizByCategory";
import ClientLayout from "@/modules/client/common/layouts/ClientLayout";

const page = () => {
  return (
    <ClientLayout>
      <ListQuizByCategory />
    </ClientLayout>
  );
};

export default page;
