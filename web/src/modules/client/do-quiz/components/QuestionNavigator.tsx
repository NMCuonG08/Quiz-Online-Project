"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Grid3X3 } from "lucide-react";

interface QuestionNavigatorProps {
    totalQuestions: number;
    currentQuestion: number;
    answeredQuestions: Set<number>;
    onQuestionSelect: (index: number) => void;
}

const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
    totalQuestions,
    currentQuestion,
    answeredQuestions,
    onQuestionSelect,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getQuestionStatus = (index: number) => {
        if (index === currentQuestion) return "current";
        if (answeredQuestions.has(index)) return "answered";
        return "unanswered";
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "current":
                return "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-lg shadow-primary/30";
            case "answered":
                return "bg-green-500 text-white hover:bg-green-600";
            default:
                return "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground";
        }
    };

    const answeredCount = answeredQuestions.size;
    const progressPercentage = Math.round((answeredCount / totalQuestions) * 100);

    return (
        <div className="relative">
            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-all duration-300"
            >
                <Grid3X3 className="w-4 h-4" />
                <span className="text-sm font-medium">
                    {answeredCount}/{totalQuestions}
                </span>
                <span className="text-xs text-muted-foreground">
                    ({progressPercentage}%)
                </span>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                ) : (
                    <ChevronDown className="w-4 h-4" />
                )}
            </button>

            {/* Question Grid Panel */}
            {isExpanded && (
                <div className="absolute top-full right-0 mt-2 p-4 bg-card border border-border rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 min-w-[280px]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-foreground">Question Navigator</h4>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Close
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-primary">{progressPercentage}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Question Grid */}
                    <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: totalQuestions }, (_, i) => {
                            const status = getQuestionStatus(i);
                            return (
                                <button
                                    key={i}
                                    onClick={() => {
                                        onQuestionSelect(i);
                                        setIsExpanded(false);
                                    }}
                                    className={cn(
                                        "w-10 h-10 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center",
                                        getStatusStyle(status)
                                    )}
                                    title={`Question ${i + 1} - ${status}`}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-primary" />
                            <span className="text-muted-foreground">Current</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-green-500" />
                            <span className="text-muted-foreground">Answered</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-muted" />
                            <span className="text-muted-foreground">Unanswered</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionNavigator;
