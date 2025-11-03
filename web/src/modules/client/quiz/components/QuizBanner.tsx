"use client";

import React from "react";

interface QuizBannerProps {
  src: string | null;
  title: string;
}

const QuizBanner: React.FC<QuizBannerProps> = ({ src, title }) => {
  const fallback = "/images/cover/cover-02.jpg";
  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || fallback}
        alt={title}
        className="w-full h-56 sm:h-72 md:h-80 lg:h-96 object-cover"
      />
    </div>
  );
};

export default QuizBanner;
