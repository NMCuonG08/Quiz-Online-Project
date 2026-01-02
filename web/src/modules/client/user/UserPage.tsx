"use client";

import React from "react";
import HistoryQuizes from "./components/HistoryQuizes";
import FriendsCarousel from "./components/FriendsCarousel";
import { useAppSelector } from "@/hooks/useRedux";

const UserPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const displayName = user?.full_name || user?.username || "You";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Hi, {displayName}
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold">
          Your Quiz Journey
        </h1>
      </div>

      {/* All quiz attempts (both in-progress and completed) */}
      <HistoryQuizes />

      {/* Friends */}
      <FriendsCarousel />
    </div>
  );
};

export default UserPage;
