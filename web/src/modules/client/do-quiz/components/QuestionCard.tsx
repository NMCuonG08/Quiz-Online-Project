"use client";

import React from "react";
import { Question } from "../types/quiz.types";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Clock, Star } from "lucide-react";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
}) => {
  const renderMedia = () => {
    if (!question.media_url) return null;

    const mediaClass = "w-full max-w-2xl mx-auto rounded-xl shadow-lg";

    // Default to image if media_type is not specified
    const mediaType = question.media_type?.toLowerCase() || "image";

    switch (mediaType) {
      case "image":
        return (
          <div className="mt-6 p-4 bg-white dark:bg-gray-900 rounded-xl">
            <img
              src={question.media_url}
              alt="Question media"
              className={mediaClass}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        );
      case "video":
        return (
          <div className="mt-6 p-4 bg-white dark:bg-gray-900 rounded-xl">
            <video
              src={question.media_url}
              controls
              className={mediaClass}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      case "audio":
        return (
          <div className="mt-6 p-4 bg-white dark:bg-gray-900 rounded-xl">
            <audio
              src={question.media_url}
              controls
              className="w-full max-w-md mx-auto"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      default:
        return (
          <div className="mt-6 p-4 bg-white dark:bg-gray-900 rounded-xl">
            <img
              src={question.media_url}
              alt="Question media"
              className={mediaClass}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        );
    }
  };

  // Get color based on question number for variety
  const getQuestionColor = (num: number) => {
    const colors = [
      { bg: "bg-blue-500", text: "text-blue-600", light: "bg-blue-50 dark:bg-blue-950" },
      { bg: "bg-emerald-500", text: "text-emerald-600", light: "bg-emerald-50 dark:bg-emerald-950" },
      { bg: "bg-violet-500", text: "text-violet-600", light: "bg-violet-50 dark:bg-violet-950" },
      { bg: "bg-amber-500", text: "text-amber-600", light: "bg-amber-50 dark:bg-amber-950" },
      { bg: "bg-rose-500", text: "text-rose-600", light: "bg-rose-50 dark:bg-rose-950" },
      { bg: "bg-cyan-500", text: "text-cyan-600", light: "bg-cyan-50 dark:bg-cyan-950" },
      { bg: "bg-pink-500", text: "text-pink-600", light: "bg-pink-50 dark:bg-pink-950" },
      { bg: "bg-indigo-500", text: "text-indigo-600", light: "bg-indigo-50 dark:bg-indigo-950" },
    ];
    return colors[(num - 1) % colors.length];
  };

  const questionColor = getQuestionColor(questionNumber);

  return (
    <Card className="overflow-hidden border shadow-lg bg-white dark:bg-gray-900">
      {/* Color bar at top */}
      <div className={`h-1.5 ${questionColor.bg}`} />

      {/* Question Header */}
      <CardHeader className="p-5 md:p-6 pb-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className={`px-3 py-1.5 font-bold text-sm ${questionColor.bg} text-white border-none`}>
              Q{questionNumber}/{totalQuestions}
            </Badge>
            <Badge variant="outline" className="px-3 py-1.5 font-semibold text-sm flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {question.points} pts
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {question.time_limit && (
              <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center gap-1.5 border-gray-200 dark:border-gray-700">
                <Clock className="w-3.5 h-3.5" />
                {question.time_limit}s
              </Badge>
            )}
            <Badge className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 border-none">
              {question.question_type.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 md:p-6">
        {/* Question Text */}
        <div className={`p-4 rounded-xl ${questionColor.light}`}>
          <h3 className={`text-lg md:text-xl font-bold ${questionColor.text} dark:text-white leading-relaxed`}>
            {question.content}
          </h3>
        </div>

        {/* Media */}
        {renderMedia()}
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
