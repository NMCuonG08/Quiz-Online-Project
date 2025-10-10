"use client";
import React from "react";

import ListQuizByCategory from "@/modules/client/category/ListQuizByCategory";

const Page = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nội dung chính */}
      <ListQuizByCategory />
    </div>
  );
};

export default Page;
