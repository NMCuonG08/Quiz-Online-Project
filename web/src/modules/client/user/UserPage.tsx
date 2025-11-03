import React from "react";
import HistoryQuizes from "./components/HistoryQuizes";
import FriendsCarousel from "./components/FriendsCarousel";

const UserPage = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Hi, Youu</p>
        <h1 className="text-2xl sm:text-3xl font-semibold">
          Let’s continue a quiz!
        </h1>
      </div>

      <HistoryQuizes />

      <FriendsCarousel />
    </div>
  );
};

export default UserPage;
