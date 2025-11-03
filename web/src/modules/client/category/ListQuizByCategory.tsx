import React from "react";
import ListCategories from "./components/ListCategories";
import ListQuizzes from "./components/ListQuizzes";

const ListQuizByCategory = () => {
  return (
    <div>
      <ListCategories />
      <ListQuizzes />
    </div>
  );
};

export default ListQuizByCategory;
