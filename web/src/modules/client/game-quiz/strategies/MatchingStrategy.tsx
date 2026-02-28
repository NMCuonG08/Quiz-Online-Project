"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Question } from "../../do-quiz/types/quiz.types";
import { IQuestionRendererStrategy } from "./IQuestionRendererStrategy";
import { QuestionRendererProps } from "../types/game-quiz.types";
import { Card } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface MatchingPair {
    id: string;
    left: string;
    right: string;
}

const MatchingRenderer: React.FC<QuestionRendererProps> = (props) => {
    const {
        question,
        selectedAnswer,
        onAnswerSelect,
        isAnswered,
        timeRemaining,
    } = props;
    const t = useTranslations("gameQuiz");

    // Parse matching pairs from question options
    const pairs: MatchingPair[] = useMemo(() => {
        return question.options.map((opt) => {
            try {
                const parsed = JSON.parse(opt.content);
                return { id: opt.id, left: parsed.left || opt.content, right: parsed.right || "" };
            } catch {
                return { id: opt.id, left: opt.content, right: "" };
            }
        });
    }, [question.options]);

    // Shuffle right items
    const shuffledRightItems = useMemo(() => {
        const items = pairs.map((p) => ({ id: p.id, text: p.right }));
        const seed = pairs
            .map((p) => p.id)
            .join("")
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        for (let i = items.length - 1; i > 0; i--) {
            const j = (seed + i) % (i + 1);
            [items[i], items[j]] = [items[j], items[i]];
        }
        return items;
    }, [pairs]);

    // Parse current user matches from selectedAnswer (stored as JSON string)
    const userMatches: Record<string, string> = useMemo(() => {
        if (!selectedAnswer || typeof selectedAnswer !== "string") return {};
        try {
            return JSON.parse(selectedAnswer);
        } catch {
            return {};
        }
    }, [selectedAnswer]);

    // Refs for measuring element positions
    const containerRef = useRef<HTMLDivElement>(null);
    const leftRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const rightRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // State
    const [activeLeft, setActiveLeft] = useState<string | null>(null);
    const [activeRight, setActiveRight] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const [lines, setLines] = useState<
        Array<{
            id: string;
            x1: number;
            y1: number;
            x2: number;
            y2: number;
            color: string;
        }>
    >([]);

    // Colors palette
    const colors = [
        "#3B82F6",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#EC4899",
        "#06B6D4",
        "#84CC16",
    ];
    const getColor = (index: number) => colors[index % colors.length];

    // Update connection lines when matches change
    useEffect(() => {
        const updateLines = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();

            const newLines = Object.entries(userMatches)
                .map(([leftId, rightId]) => {
                    const leftEl = leftRefs.current.get(leftId);
                    const rightEl = rightRefs.current.get(rightId);
                    if (!leftEl || !rightEl) return null;

                    const leftRect = leftEl.getBoundingClientRect();
                    const rightRect = rightEl.getBoundingClientRect();
                    const pairIndex = pairs.findIndex((p) => p.id === leftId);

                    return {
                        id: `${leftId}-${rightId}`,
                        x1: leftRect.right - rect.left,
                        y1: leftRect.top + leftRect.height / 2 - rect.top,
                        x2: rightRect.left - rect.left,
                        y2: rightRect.top + rightRect.height / 2 - rect.top,
                        color: getColor(pairIndex),
                    };
                })
                .filter(Boolean) as typeof lines;

            setLines(newLines);
        };

        updateLines();
        window.addEventListener("resize", updateLines);
        const timer = setTimeout(updateLines, 100);
        return () => {
            window.removeEventListener("resize", updateLines);
            clearTimeout(timer);
        };
    }, [userMatches, pairs]);

    // Handle mouse move
    const handleMouseMove = (e: React.MouseEvent) => {
        if ((activeLeft || activeRight) && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
    };

    // Handle match change - build JSON and pass up
    const handleMatchChange = (leftId: string, rightId: string) => {
        if (isAnswered) return;

        const newMatches = { ...userMatches };

        if (newMatches[leftId] === rightId) {
            delete newMatches[leftId];
        } else {
            delete newMatches[leftId];
            Object.keys(newMatches).forEach((key) => {
                if (newMatches[key] === rightId) {
                    delete newMatches[key];
                }
            });
            newMatches[leftId] = rightId;
        }

        onAnswerSelect(JSON.stringify(newMatches));
    };

    // Handle left item click
    const handleLeftClick = (leftId: string) => {
        if (isAnswered) return;

        if (activeRight) {
            handleMatchChange(leftId, activeRight);
            setActiveLeft(null);
            setActiveRight(null);
            setMousePos(null);
        } else if (activeLeft === leftId) {
            setActiveLeft(null);
            setMousePos(null);
        } else {
            setActiveLeft(leftId);
            setActiveRight(null);
            const el = leftRefs.current.get(leftId);
            if (el && containerRef.current) {
                const elRect = el.getBoundingClientRect();
                const contRect = containerRef.current.getBoundingClientRect();
                setMousePos({
                    x: elRect.right - contRect.left,
                    y: elRect.top + elRect.height / 2 - contRect.top,
                });
            }
        }
    };

    // Handle right item click
    const handleRightClick = (rightId: string) => {
        if (isAnswered) return;

        const existingMatch = Object.entries(userMatches).find(
            ([_, rId]) => rId === rightId
        );

        if (activeLeft) {
            handleMatchChange(activeLeft, rightId);
            setActiveLeft(null);
            setActiveRight(null);
            setMousePos(null);
        } else if (existingMatch) {
            handleMatchChange(existingMatch[0], rightId);
        } else if (activeRight === rightId) {
            setActiveRight(null);
            setMousePos(null);
        } else {
            setActiveRight(rightId);
            setActiveLeft(null);
            const el = rightRefs.current.get(rightId);
            if (el && containerRef.current) {
                const elRect = el.getBoundingClientRect();
                const contRect = containerRef.current.getBoundingClientRect();
                setMousePos({
                    x: elRect.left - contRect.left,
                    y: elRect.top + elRect.height / 2 - contRect.top,
                });
            }
        }
    };

    // Get active drag start point
    const getDragStart = () => {
        if (!containerRef.current) return null;
        const contRect = containerRef.current.getBoundingClientRect();

        if (activeLeft) {
            const el = leftRefs.current.get(activeLeft);
            if (el) {
                const rect = el.getBoundingClientRect();
                return {
                    x: rect.right - contRect.left,
                    y: rect.top + rect.height / 2 - contRect.top,
                };
            }
        }
        if (activeRight) {
            const el = rightRefs.current.get(activeRight);
            if (el) {
                const rect = el.getBoundingClientRect();
                return {
                    x: rect.left - contRect.left,
                    y: rect.top + rect.height / 2 - contRect.top,
                };
            }
        }
        return null;
    };

    // Generate bezier path
    const getBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
        const cp = Math.abs(x2 - x1) * 0.4;
        return `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
    };

    const dragStart = getDragStart();

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 md:p-6">
            {/* Question Header */}
            <div className="w-full max-w-5xl mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-4">
                    {timeRemaining !== undefined && (
                        <Badge
                            variant="secondary"
                            className="text-xl sm:text-2xl md:text-3xl px-3 py-1.5 text-yellow-600 dark:text-yellow-400"
                        >
                            ⏱ {timeRemaining}s
                        </Badge>
                    )}
                </div>
            </div>

            {/* Question Content */}
            <div className="w-full max-w-5xl mb-6 sm:mb-8">
                <Card className="p-5 sm:p-6 md:p-8">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-center leading-tight mb-3">
                        {question.content}
                    </h2>
                    <div className="text-center">
                        <Badge
                            variant="secondary"
                            className="text-base sm:text-lg md:text-xl px-3 py-1.5"
                        >
                            {t("points", { count: question.points })}
                        </Badge>
                    </div>
                </Card>
            </div>

            {/* Matching Game */}
            <div className="w-full max-w-5xl">
                <div className="text-center mb-4">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">🎯 Nối cặp tương ứng</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Click item trái → Click item phải để nối. Click cặp đã nối để hủy.
                    </p>
                </div>

                <div
                    ref={containerRef}
                    className="relative"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() =>
                        !activeLeft && !activeRight && setMousePos(null)
                    }
                >
                    {/* SVG Overlay */}
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none z-10"
                        style={{
                            minHeight: `${Math.max(pairs.length, shuffledRightItems.length) * 72}px`,
                        }}
                    >
                        {/* Connection lines */}
                        {lines.map((line) => (
                            <g key={line.id}>
                                <path
                                    d={getBezierPath(line.x1, line.y1, line.x2, line.y2)}
                                    fill="none"
                                    stroke={line.color}
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    opacity="0.15"
                                />
                                <path
                                    d={getBezierPath(line.x1, line.y1, line.x2, line.y2)}
                                    fill="none"
                                    stroke={line.color}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    className="transition-all duration-300"
                                />
                                <circle cx={line.x1} cy={line.y1} r="6" fill={line.color} />
                                <circle cx={line.x2} cy={line.y2} r="6" fill={line.color} />
                            </g>
                        ))}

                        {/* Active drag line */}
                        {(activeLeft || activeRight) && dragStart && mousePos && (
                            <g>
                                <path
                                    d={getBezierPath(
                                        dragStart.x,
                                        dragStart.y,
                                        mousePos.x,
                                        mousePos.y
                                    )}
                                    fill="none"
                                    stroke={
                                        activeLeft
                                            ? getColor(pairs.findIndex((p) => p.id === activeLeft))
                                            : "#888"
                                    }
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray="8 4"
                                    className="animate-pulse"
                                />
                                <circle
                                    cx={dragStart.x}
                                    cy={dragStart.y}
                                    r="8"
                                    fill={
                                        activeLeft
                                            ? getColor(pairs.findIndex((p) => p.id === activeLeft))
                                            : "#888"
                                    }
                                    className="animate-pulse"
                                />
                                <circle
                                    cx={mousePos.x}
                                    cy={mousePos.y}
                                    r="6"
                                    fill="none"
                                    stroke="#888"
                                    strokeWidth="2"
                                />
                            </g>
                        )}
                    </svg>

                    {/* Two columns */}
                    <div className="grid grid-cols-2 gap-10 md:gap-20 lg:gap-32">
                        {/* LEFT - Questions */}
                        <div className="space-y-3">
                            <div className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                                <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                    📝
                                </span>
                                Câu hỏi
                            </div>
                            {pairs.map((pair, index) => {
                                const isMatched = !!userMatches[pair.id];
                                const isActive = activeLeft === pair.id;
                                const color = getColor(index);

                                return (
                                    <div
                                        key={pair.id}
                                        ref={(el) => {
                                            if (el) leftRefs.current.set(pair.id, el);
                                        }}
                                        onClick={() => handleLeftClick(pair.id)}
                                        className={cn(
                                            "relative p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 text-lg sm:text-xl",
                                            isMatched
                                                ? "bg-green-50 dark:bg-green-950/20"
                                                : "bg-card hover:shadow-lg",
                                            isActive
                                                ? "ring-2 ring-offset-2 scale-[1.02] shadow-lg"
                                                : "hover:scale-[1.01]",
                                            isAnswered && "opacity-70 cursor-not-allowed"
                                        )}
                                        style={{
                                            borderColor:
                                                isMatched || isActive ? color : undefined,
                                            ["--tw-ring-color" as string]: color,
                                        }}
                                    >
                                        <div className="flex items-center gap-3 pr-4">
                                            <span
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white shadow"
                                                style={{ backgroundColor: color }}
                                            >
                                                {index + 1}
                                            </span>
                                            <span className="font-medium">{pair.left}</span>
                                        </div>

                                        {/* Right edge connector */}
                                        <div
                                            className={cn(
                                                "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow z-20 transition-all",
                                                isActive && "scale-125 animate-pulse"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* RIGHT - Answers */}
                        <div className="space-y-3">
                            <div className="text-xs font-bold uppercase text-green-600 dark:text-green-400 mb-3 flex items-center gap-2 justify-end">
                                Đáp án
                                <span className="w-6 h-6 rounded bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                    ✅
                                </span>
                            </div>
                            {shuffledRightItems.map((item) => {
                                const matchEntry = Object.entries(userMatches).find(
                                    ([_, rId]) => rId === item.id
                                );
                                const isMatched = !!matchEntry;
                                const isActive = activeRight === item.id;
                                const origIndex =
                                    isMatched
                                        ? pairs.findIndex((p) => p.id === matchEntry![0])
                                        : -1;
                                const color =
                                    isMatched && origIndex >= 0
                                        ? getColor(origIndex)
                                        : "#9CA3AF";

                                return (
                                    <div
                                        key={item.id}
                                        ref={(el) => {
                                            if (el) rightRefs.current.set(item.id, el);
                                        }}
                                        onClick={() => handleRightClick(item.id)}
                                        className={cn(
                                            "relative p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 text-lg sm:text-xl",
                                            isMatched
                                                ? "bg-green-50 dark:bg-green-950/20"
                                                : "bg-card hover:shadow-lg",
                                            isActive
                                                ? "ring-2 ring-offset-2 scale-[1.02] shadow-lg ring-gray-400"
                                                : "hover:scale-[1.01]",
                                            isAnswered && "opacity-70 cursor-not-allowed"
                                        )}
                                        style={{
                                            borderColor: isMatched ? color : undefined,
                                        }}
                                    >
                                        {/* Left edge connector */}
                                        <div
                                            className={cn(
                                                "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow z-20 transition-all",
                                                isActive && "scale-125 animate-pulse"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />

                                        <div className="flex items-center gap-3 pl-4 justify-end">
                                            <span className="font-medium text-right">
                                                {item.text}
                                            </span>
                                            {isMatched && (
                                                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export class MatchingStrategy implements IQuestionRendererStrategy {
    render(props: QuestionRendererProps): React.ReactNode {
        return <MatchingRenderer {...props} />;
    }

    validateAnswer(question: Question, answer: string | string[]): boolean {
        if (typeof answer !== "string") return false;
        try {
            const matches: Record<string, string> = JSON.parse(answer);
            // All matches must be correct (each pair's left id matches its own right id)
            const pairs = question.options.map((opt) => opt.id);
            return pairs.every((id) => matches[id] === id);
        } catch {
            return false;
        }
    }

    getDefaultAnswer(): string {
        return "{}";
    }
}
