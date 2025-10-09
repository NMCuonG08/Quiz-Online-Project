"use client";
import React, { useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAdminQuestions } from "../hooks/useAdminQuestions";
import QuestionCard from "./QuestionCard";

// Removed local QuestionOption and QuestionItem types; rely on data as-is from hook

const ListQuestionsOfQuiz = () => {
  const params = useParams();
  const id = (params?.id as string) || "";

  const { items, loading, error, getQuestions } = useAdminQuestions();

  const fetchQuestions = useCallback(async () => {
    if (!id) return;
    await getQuestions(id, { page: 1, limit: 10 });
  }, [id, getQuestions]);

  useEffect(() => {
    if (!id) return;
    void fetchQuestions();
  }, [id, fetchQuestions]);

  if (loading) return <div>Loading questions...</div>;
  if (error) return <div className="text-red-500">{String(error)}</div>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.length === 0 ? (
        <div className="text-sm text-gray-500">No questions found.</div>
      ) : (
        items.map((q) => <QuestionCard key={q.id} question={q} />)
      )}
    </div>
  );
};

export default ListQuestionsOfQuiz;
