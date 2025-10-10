"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { useAdminQuestions } from "../hooks/useAdminQuestions";
import QuestionCard from "./QuestionCard";
import AddQuestionModal from "./AddQuestionModal";

// Removed local QuestionOption and QuestionItem types; rely on data as-is from hook

const ListQuestionsOfQuiz = () => {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay về
        </Button>

        <Button onClick={() => setIsAddModalOpen(true)}>Add Question</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <div className="text-sm text-gray-500">No questions found.</div>
        ) : (
          items.map((q) => (
            <QuestionCard 
              key={q.id} 
              question={q} 
              onRefresh={fetchQuestions}
            />
          ))
        )}
      </div>

      <AddQuestionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          // Refresh the questions list after successful creation
          void fetchQuestions();
        }}
        quizId={id}
      />
    </div>
  );
};

export default ListQuestionsOfQuiz;
