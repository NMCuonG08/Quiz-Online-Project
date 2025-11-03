import React from "react";
import QuizDetail from "../quiz/QuizDetail";

interface QuizDetailPageProps {
  slug: string;
}

const QuizDetailPage: React.FC<QuizDetailPageProps> = ({ slug }) => {
  return (
    <div>
      <QuizDetail slug={slug} />
    </div>
  );
};

export default QuizDetailPage;
