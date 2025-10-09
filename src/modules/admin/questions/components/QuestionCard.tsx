"use client";
import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/common/components/ui/collapsible";
import type { QuestionItem, QuestionOption } from "../types/admin.question";
import { Input } from "@/common/components/ui/input";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Textarea } from "@/common/components/ui/textarea";

type Props = {
  question: QuestionItem;
  onChangeOption?: (
    questionId: string,
    optionId: string,
    patch: Partial<QuestionOption>
  ) => void;
};

const truncateToLines = (text: string, maxChars: number): string => {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, Math.max(0, maxChars - 1)) + "…";
};

const QuestionCard: React.FC<Props> = ({ question, onChangeOption }) => {
  const [open, setOpen] = useState(false);
  const maxTitleChars = 120; // approximate for 2 lines; tailwind handles clamp via fixed height

  const titleText = useMemo(
    () => truncateToLines(question.question_text, maxTitleChars),
    [question.question_text]
  );

  return (
    <Card className="border-stroke dark:border-dark-3 min-h-[240px] w-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-semibold line-clamp-2 min-h-[48px]">
          {titleText}
        </CardTitle>
        <div className="mt-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-[#1f2937]">
              {question.question_type}
            </span>
            <span>{question.points} pts</span>
            <span>{question.time_limit}s</span>
          </div>
          <div className="text-[11px] text-gray-500">
            {question.options_count ?? (question.options?.length || 0)} options
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <div className="mb-2 w-full rounded-md border border-input bg-background px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground">
              {open ? "Hide Options" : "+ Options"}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-3 pr-1 w-full">
              {(question.options || []).map((opt) => (
                <div key={opt.id} className="rounded-md border p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={!!opt.is_correct}
                      onCheckedChange={(checked) =>
                        onChangeOption?.(question.id, opt.id, {
                          is_correct: Boolean(checked),
                        })
                      }
                      className="mt-2"
                    />
                    <div className="flex-1 space-y-2">
                      <Input
                        value={opt.option_text || ""}
                        onChange={(e) =>
                          onChangeOption?.(question.id, opt.id, {
                            option_text: e.target.value,
                          })
                        }
                        placeholder="Option text"
                      />
                      <Textarea
                        value={opt.explanation || ""}
                        onChange={(e) =>
                          onChangeOption?.(question.id, opt.id, {
                            explanation: e.target.value,
                          })
                        }
                        placeholder="Explanation (optional)"
                        className="min-h-[56px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
