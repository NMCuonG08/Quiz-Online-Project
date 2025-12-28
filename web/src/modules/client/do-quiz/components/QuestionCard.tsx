"use client";

import React from "react";
import { Question } from "../types/quiz.types";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Clock, HelpCircle, Star } from "lucide-react";

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

    const mediaClass = "w-full max-w-2xl mx-auto rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 ring-1 ring-border/50";

    // Default to image if media_type is not specified
    const mediaType = question.media_type?.toLowerCase() || "image";

    switch (mediaType) {
      case "image":
        return (
          <div className="mb-8 animate-in zoom-in-95 duration-500">
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
          <div className="mb-8 animate-in zoom-in-95 duration-500">
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
          <div className="mb-8 animate-in zoom-in-95 duration-500">
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
        // If unknown type but has URL, try to show as image
        return (
          <div className="mb-8 animate-in zoom-in-95 duration-500">
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

  return (
    <Card className="overflow-hidden border-none shadow-2xl bg-card/50 backdrop-blur-sm transition-all duration-300 group hover:bg-card/80">
      {/* Question Header */}
      <CardHeader className="p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1 font-bold text-sm bg-primary/10 text-primary hover:bg-primary/20 border-none">
              Question {questionNumber}/{totalQuestions}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 font-medium text-sm flex items-center gap-1.5 border-border">
              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
              {question.points} {question.points !== 1 ? "Points" : "Point"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {question.time_limit && (
              <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-muted/30 text-muted-foreground flex items-center gap-1.5 border-none">
                <Clock className="w-3.5 h-3.5" />
                Time: {question.time_limit}s
              </Badge>
            )}
            <Badge className="px-3 py-1 text-xs font-bold uppercase tracking-widest bg-violet-500/10 text-violet-500 border-none">
              {question.question_type.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Question Title */}
        <div className="mt-4 relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight tracking-tight">
            {question.content}
          </h3>
        </div>
      </CardHeader>

      <CardContent className="px-6 md:px-8 pb-8">
        {/* Media */}
        {renderMedia()}

        {!question.media_url && (
          <div className="flex justify-center opacity-5 pb-4">
            <HelpCircle className="w-32 h-32" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
