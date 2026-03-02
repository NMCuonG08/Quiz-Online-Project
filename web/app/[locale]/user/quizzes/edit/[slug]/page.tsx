import React from "react";
import EditQuiz from "@/modules/client/user-quizzes/EditQuiz";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Quiz",
  description: "Edit Quiz",
};

const page = () => {
  return <EditQuiz />;
};

export default page;
