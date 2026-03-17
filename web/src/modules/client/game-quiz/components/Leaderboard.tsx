"use client";

import React from "react";
import { Trophy, Medal, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  correctAnswers: number;
  isMe?: boolean;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  title = "Arena Leaderboard",
}) => {
  // Sort entries by score descending
  const sortedEntries = [...entries].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-2xl mx-auto bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="bg-primary/10 px-8 py-6 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">{title}</h2>
        </div>
        <div className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider">
          Live Arena
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border/50">
        {sortedEntries.length > 0 ? (
          sortedEntries.map((entry, index) => {
            const isTop3 = index < 3;
            const rankIconColor = 
              index === 0 ? "text-yellow-500" : 
              index === 1 ? "text-slate-400" : 
              index === 2 ? "text-amber-600" : "";

            return (
              <div
                key={entry.userId}
                className={cn(
                  "px-8 py-5 flex items-center gap-4 transition-colors hover:bg-muted/50",
                  entry.isMe && "bg-primary/5 border-l-4 border-l-primary"
                )}
              >
                {/* Rank */}
                <div className="w-10 flex flex-col items-center justify-center">
                  {isTop3 ? (
                    <Medal className={cn("w-6 h-6", rankIconColor)} />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                  )}
                </div>

                {/* Avatar Placeholder */}
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border border-border shadow-inner">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg truncate">
                      {entry.username}
                    </span>
                    {entry.isMe && (
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-black uppercase rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Star className="w-3 h-3" />
                    {entry.correctAnswers} Correct Answers
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-2xl font-black text-primary">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    pts
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-8 py-12 text-center text-muted-foreground italic">
            Waiting for scores to arrive...
          </div>
        )}
      </div>
    </div>
  );
};
