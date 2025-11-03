"use client";

import React, { useEffect } from "react";
import CategoryCarousel from "./CategoryCarousel";
import { useClientQuiz } from "../hooks/useClientQuiz";

const ListQuizzes: React.FC = () => {
  const {
    recentlyPublished,
    bestRated,
    popular,
    easy,
    hard,
    getRecentlyPublishedQuizzes,
    getBestRatedQuizzes,
    getPopularQuizzes,
    getEasyQuizzes,
    getHardQuizzes,
  } = useClientQuiz();

  useEffect(() => {
    // Fetch all quiz categories on component mount
    const fetchAllQuizzes = async () => {
      await Promise.all([
        getRecentlyPublishedQuizzes({ limit: 10 }),
        getBestRatedQuizzes({ limit: 10 }),
        getPopularQuizzes({ limit: 10 }),
        getEasyQuizzes({ limit: 10 }),
        getHardQuizzes({ limit: 10 }),
      ]);
    };

    fetchAllQuizzes();
  }, [
    getRecentlyPublishedQuizzes,
    getBestRatedQuizzes,
    getPopularQuizzes,
    getEasyQuizzes,
    getHardQuizzes,
  ]);

  return (
    <div className="space-y-8">
      <CategoryCarousel
        title="Recently published »"
        quizzes={recentlyPublished.quizzes}
        loading={recentlyPublished.loading}
        error={recentlyPublished.error}
      />
      <CategoryCarousel
        title="Best rating right now »"
        quizzes={bestRated.quizzes}
        loading={bestRated.loading}
        error={bestRated.error}
      />
      <CategoryCarousel
        title="Popular right now »"
        quizzes={popular.quizzes}
        loading={popular.loading}
        error={popular.error}
      />
      <CategoryCarousel
        title="Easy quizzes »"
        quizzes={easy.quizzes}
        loading={easy.loading}
        error={easy.error}
      />
      <CategoryCarousel
        title="Hard quizzes »"
        quizzes={hard.quizzes}
        loading={hard.loading}
        error={hard.error}
      />
    </div>
  );
};

export default ListQuizzes;
