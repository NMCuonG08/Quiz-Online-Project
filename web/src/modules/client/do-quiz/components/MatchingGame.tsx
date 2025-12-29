"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface MatchingPair {
    id: string;
    left: string;
    right: string;
}

interface MatchingGameProps {
    pairs: MatchingPair[];
    userMatches: Record<string, string>;
    onMatchChange: (leftId: string, rightId: string) => void;
    isSubmitting: boolean;
}

const MatchingGame: React.FC<MatchingGameProps> = ({
    pairs,
    userMatches,
    onMatchChange,
    isSubmitting,
}) => {
    // Shuffle right items using question pairs as seed for consistency
    const shuffledRightItems = useMemo(() => {
        const items = pairs.map(p => ({ id: p.id, text: p.right }));
        const seed = pairs.map(p => p.id).join('').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        for (let i = items.length - 1; i > 0; i--) {
            const j = (seed + i) % (i + 1);
            [items[i], items[j]] = [items[j], items[i]];
        }
        return items;
    }, [pairs]);

    // Refs for measuring element positions
    const containerRef = useRef<HTMLDivElement>(null);
    const leftRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const rightRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // State
    const [activeLeft, setActiveLeft] = useState<string | null>(null);
    const [activeRight, setActiveRight] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const [lines, setLines] = useState<Array<{
        id: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        color: string;
    }>>([]);

    // Colors palette
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    const getColor = (index: number) => colors[index % colors.length];

    // Update connection lines when matches change
    useEffect(() => {
        const updateLines = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();

            const newLines = Object.entries(userMatches).map(([leftId, rightId]) => {
                const leftEl = leftRefs.current.get(leftId);
                const rightEl = rightRefs.current.get(rightId);
                if (!leftEl || !rightEl) return null;

                const leftRect = leftEl.getBoundingClientRect();
                const rightRect = rightEl.getBoundingClientRect();
                const pairIndex = pairs.findIndex(p => p.id === leftId);

                return {
                    id: `${leftId}-${rightId}`,
                    x1: leftRect.right - rect.left,
                    y1: leftRect.top + leftRect.height / 2 - rect.top,
                    x2: rightRect.left - rect.left,
                    y2: rightRect.top + rightRect.height / 2 - rect.top,
                    color: getColor(pairIndex),
                };
            }).filter(Boolean) as typeof lines;

            setLines(newLines);
        };

        updateLines();
        window.addEventListener('resize', updateLines);
        const timer = setTimeout(updateLines, 100); // Update after animations
        return () => {
            window.removeEventListener('resize', updateLines);
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

    // Handle left item click
    const handleLeftClick = (leftId: string) => {
        if (isSubmitting) return;

        if (activeRight) {
            onMatchChange(leftId, activeRight);
            setActiveLeft(null);
            setActiveRight(null);
            setMousePos(null);
        } else if (activeLeft === leftId) {
            setActiveLeft(null);
            setMousePos(null);
        } else {
            setActiveLeft(leftId);
            setActiveRight(null);
            // Set start position
            const el = leftRefs.current.get(leftId);
            if (el && containerRef.current) {
                const elRect = el.getBoundingClientRect();
                const contRect = containerRef.current.getBoundingClientRect();
                setMousePos({ x: elRect.right - contRect.left, y: elRect.top + elRect.height / 2 - contRect.top });
            }
        }
    };

    // Handle right item click
    const handleRightClick = (rightId: string) => {
        if (isSubmitting) return;

        const existingMatch = Object.entries(userMatches).find(([_, rId]) => rId === rightId);

        if (activeLeft) {
            onMatchChange(activeLeft, rightId);
            setActiveLeft(null);
            setActiveRight(null);
            setMousePos(null);
        } else if (existingMatch) {
            // Unmatch
            onMatchChange(existingMatch[0], rightId);
        } else if (activeRight === rightId) {
            setActiveRight(null);
            setMousePos(null);
        } else {
            setActiveRight(rightId);
            setActiveLeft(null);
            // Set start position
            const el = rightRefs.current.get(rightId);
            if (el && containerRef.current) {
                const elRect = el.getBoundingClientRect();
                const contRect = containerRef.current.getBoundingClientRect();
                setMousePos({ x: elRect.left - contRect.left, y: elRect.top + elRect.height / 2 - contRect.top });
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
                return { x: rect.right - contRect.left, y: rect.top + rect.height / 2 - contRect.top };
            }
        }
        if (activeRight) {
            const el = rightRefs.current.get(activeRight);
            if (el) {
                const rect = el.getBoundingClientRect();
                return { x: rect.left - contRect.left, y: rect.top + rect.height / 2 - contRect.top };
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
    const matchedCount = Object.keys(userMatches).length;
    const totalPairs = pairs.length;

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-bold mb-2">🎯 Nối cặp tương ứng</h3>
                <p className="text-sm text-muted-foreground">
                    Click item trái → Click item phải để nối. Click cặp đã nối để hủy.
                </p>
            </div>

            <div
                ref={containerRef}
                className="relative"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => !activeLeft && !activeRight && setMousePos(null)}
            >
                {/* SVG Overlay */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    style={{ minHeight: `${Math.max(pairs.length, shuffledRightItems.length) * 72}px` }}
                >
                    {/* Connection lines */}
                    {lines.map(line => (
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
                                d={getBezierPath(dragStart.x, dragStart.y, mousePos.x, mousePos.y)}
                                fill="none"
                                stroke={activeLeft ? getColor(pairs.findIndex(p => p.id === activeLeft)) : '#888'}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray="8 4"
                                className="animate-pulse"
                            />
                            <circle cx={dragStart.x} cy={dragStart.y} r="8" fill={activeLeft ? getColor(pairs.findIndex(p => p.id === activeLeft)) : '#888'} className="animate-pulse" />
                            <circle cx={mousePos.x} cy={mousePos.y} r="6" fill="none" stroke="#888" strokeWidth="2" />
                        </g>
                    )}
                </svg>

                {/* Two columns */}
                <div className="grid grid-cols-2 gap-10 md:gap-20 lg:gap-32">
                    {/* LEFT - Questions */}
                    <div className="space-y-3">
                        <div className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">📝</span>
                            Câu hỏi
                        </div>
                        {pairs.map((pair, index) => {
                            const isMatched = !!userMatches[pair.id];
                            const isActive = activeLeft === pair.id;
                            const color = getColor(index);

                            return (
                                <div
                                    key={pair.id}
                                    ref={el => { if (el) leftRefs.current.set(pair.id, el); }}
                                    onClick={() => handleLeftClick(pair.id)}
                                    className={cn(
                                        "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                        isMatched ? "bg-green-50 dark:bg-green-950/20" : "bg-card hover:shadow-lg",
                                        isActive ? "ring-2 ring-offset-2 scale-[1.02] shadow-lg" : "hover:scale-[1.01]",
                                        isSubmitting && "opacity-50 cursor-not-allowed"
                                    )}
                                    style={{
                                        borderColor: isMatched || isActive ? color : undefined,
                                        ['--tw-ring-color' as string]: color,
                                    }}
                                >
                                    <div className="flex items-center gap-3 pr-4">
                                        <span
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow"
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
                            <span className="w-6 h-6 rounded bg-green-100 dark:bg-green-900/50 flex items-center justify-center">✅</span>
                        </div>
                        {shuffledRightItems.map((item, index) => {
                            const matchEntry = Object.entries(userMatches).find(([_, rId]) => rId === item.id);
                            const isMatched = !!matchEntry;
                            const isActive = activeRight === item.id;
                            const origIndex = isMatched ? pairs.findIndex(p => p.id === matchEntry![0]) : -1;
                            const color = isMatched && origIndex >= 0 ? getColor(origIndex) : '#9CA3AF';

                            return (
                                <div
                                    key={item.id}
                                    ref={el => { if (el) rightRefs.current.set(item.id, el); }}
                                    onClick={() => handleRightClick(item.id)}
                                    className={cn(
                                        "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                        isMatched ? "bg-green-50 dark:bg-green-950/20" : "bg-card hover:shadow-lg",
                                        isActive ? "ring-2 ring-offset-2 scale-[1.02] shadow-lg ring-gray-400" : "hover:scale-[1.01]",
                                        isSubmitting && "opacity-50 cursor-not-allowed"
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
                                        <span className="font-medium text-right">{item.text}</span>
                                        {isMatched && <Check className="w-5 h-5 text-green-600 flex-shrink-0" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchingGame;

