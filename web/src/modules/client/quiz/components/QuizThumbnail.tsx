"use client";

import React from "react";

interface QuizThumbnailProps {
  src: string | null;
  alt: string;
}

const QuizThumbnail: React.FC<QuizThumbnailProps> = ({ src, alt }) => {
  if (!src) return null;
  return (
    <div className="w-full overflow-hidden rounded-md border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full h-auto object-cover" />
    </div>
  );
};

export default QuizThumbnail;
