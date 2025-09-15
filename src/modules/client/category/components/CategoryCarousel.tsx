"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import { Star } from "lucide-react";
import Image from "next/image";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";

export interface QuizCardProps {
  id: string;
  title: string;
  image: string;
  rating: number;
  author: string;
  difficulty?: "EASY" | "HARD" | "AI GENERATED";
}

interface CategoryCarouselProps {
  title: string;
  quizzes: QuizCardProps[];
}

const QuizCard: React.FC<QuizCardProps> = ({
  title,
  image,
  rating,
  author,
  difficulty,
}) => {
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-500";
      case "HARD":
        return "bg-red-500";
      case "AI GENERATED":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
      <div className="relative">
        <Image
          src={image}
          alt={title}
          width={300}
          height={200}
          className="w-full h-40 sm:h-44 md:h-48 object-cover"
        />
        {difficulty && (
          <div
            className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-semibold text-white border border-black ${getDifficultyColor(
              difficulty
            )}`}
          >
            {difficulty}
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-xs sm:text-sm mb-2 h-8 sm:h-10 flex items-center overflow-hidden">
          <span className="line-clamp-2 leading-4 sm:leading-5">{title}</span>
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              {rating}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate ml-2">
            By {author}
          </span>
        </div>
      </div>
    </div>
  );
};

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  title,
  quizzes,
}) => {
  return (
    <div className="w-full mb-10">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
        {title}
      </h2>
      <Swiper
        modules={[FreeMode]}
        spaceBetween={20}
        slidesPerView="auto"
        freeMode={{
          enabled: true,
          momentum: true,
          momentumRatio: 1,
          momentumBounce: false,
        }}
        grabCursor={true}
        className="w-full"
        breakpoints={{
          320: {
            spaceBetween: 12,
          },
          640: {
            spaceBetween: 16,
          },
          768: {
            spaceBetween: 20,
          },
        }}
      >
        {quizzes.map((quiz) => (
          <SwiperSlide key={quiz.id} className="!w-48 sm:!w-56 md:!w-64">
            <QuizCard {...quiz} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default CategoryCarousel;
