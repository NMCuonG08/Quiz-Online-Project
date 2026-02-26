"use client";

import React, { useEffect } from "react";
import CategoryCarousel from "./CategoryCarousel";
import { useClientQuiz } from "../hooks/useClientQuiz";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("quizCarousel");

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
        title={t("recentlyPublished")}
        quizzes={recentlyPublished.quizzes}
        loading={recentlyPublished.loading}
        error={recentlyPublished.error}
      />
      <CategoryCarousel
        title={t("bestRated")}
        quizzes={bestRated.quizzes}
        loading={bestRated.loading}
        error={bestRated.error}
      />
      <CategoryCarousel
        title={t("popular")}
        quizzes={popular.quizzes}
        loading={popular.loading}
        error={popular.error}
      />
      <CategoryCarousel
        title={t("easyQuizzes")}
        quizzes={easy.quizzes}
        loading={easy.loading}
        error={easy.error}
      />
      <CategoryCarousel
        title={t("hardQuizzes")}
        quizzes={hard.quizzes}
        loading={hard.loading}
        error={hard.error}
      />
    </div>
  );
};

export default ListQuizzes;
