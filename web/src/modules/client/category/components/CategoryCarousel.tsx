import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import { Star, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/time-utils";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";

export interface QuizCardProps {
  id: string;
  title: string;
  thumbnail_url: string;
  average_rating: number;
  total_ratings: number;
  creator_name: string;
  difficulty?: "EASY" | "HARD" | "AI GENERATED";
  difficulty_level?: string;
  category_name?: string;
  quiz_type?: string;
  slug?: string;
  created_at?: string;
  updated_at?: string;
}

interface CategoryCarouselProps {
  title: string;
  quizzes: QuizCardProps[];
  loading?: boolean;
  error?: string | null;
}

const QuizCard: React.FC<QuizCardProps> = ({
  title,
  thumbnail_url,
  average_rating,
  total_ratings,
  creator_name,
  difficulty,
  difficulty_level,
  category_name,
  quiz_type,
  created_at,
  slug,
}) => {
  const [imageError, setImageError] = React.useState(false);

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

  const handleImageError = () => {
    setImageError(true);
  };

  const timeAgo = created_at ? formatTimeAgo(created_at) : null;

  // Format rating display
  const formatRating = (rating: number, totalRatings: number) => {
    return `${rating.toFixed(1)} (${totalRatings})`;
  };

  const CardInner = (
    <Card className="overflow-hidden cursor-pointer p-0 w-48 sm:w-56 md:w-64 h-80 sm:h-84 md:h-88 flex flex-col gap-0">
      <CardHeader className="p-0 flex-shrink-0 gap-0">
        <div className="relative w-full h-40 sm:h-44 md:h-48">
          {imageError || !thumbnail_url ? (
            <Image
              src="/404not-found.jpg"
              alt="Not Found"
              width={300}
              height={200}
              className="w-full h-full object-cover"
              // Avoid infinite loop if /404not-found is also broken
              onError={undefined}
            />
          ) : (
            <Image
              src={thumbnail_url}
              alt={title}
              width={300}
              height={200}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          )}

          {/* Category name badge */}
          {category_name && (
            <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold text-white bg-black/70 backdrop-blur-sm">
              {category_name}
            </div>
          )}

          {/* Difficulty badge */}
          {(difficulty || difficulty_level) && (
            <div
              className={`absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold text-white border border-black whitespace-nowrap ${getDifficultyColor(
                difficulty || difficulty_level
              )}`}
            >
              {difficulty || difficulty_level}
            </div>
          )}

          {/* Quiz type badge */}
          {quiz_type && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold text-white bg-purple-500/80 backdrop-blur-sm whitespace-nowrap">
              {quiz_type}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-xs sm:text-sm mb-2 h-6 sm:h-9 flex items-center overflow-hidden">
            <span className="line-clamp-1 truncate whitespace-nowrap leading-5 sm:leading-5">
              {title}
            </span>
          </h3>

          {/* Time ago */}
          {timeAgo && (
            <div className="flex items-center mb-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              <span>{timeAgo}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 min-w-0 mt-auto">
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-[11px] sm:text-xs font-medium text-gray-700 dark:text-gray-300">
              {formatRating(average_rating, total_ratings)}
            </span>
          </div>
          <span className="flex-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate text-right ml-2 min-w-0">
            By {creator_name}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return slug ? <Link href={`/quiz/${slug}`}>{CardInner}</Link> : CardInner;
};

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  title,
  quizzes,
  loading = false,
  error = null,
}) => {
  // Loading skeleton component
  const LoadingSkeleton = () => (
    <Card className="overflow-hidden p-0 w-48 sm:w-56 md:w-64 h-80 sm:h-84 md:h-88 flex flex-col gap-0">
      <CardHeader className="p-0 flex-shrink-0 gap-0">
        {/* Image skeleton */}
        <div className="relative w-full h-40 sm:h-44 md:h-48">
          <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>

          {/* Category name badge skeleton */}
          <div className="absolute top-2 left-2 w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>

          {/* Difficulty badge skeleton */}
          <div className="absolute bottom-2 left-2 w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>

          {/* Quiz type badge skeleton */}
          <div className="absolute bottom-2 right-2 w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
        <div className="flex-1">
          {/* Title skeleton */}
          <div className="mb-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-1"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-3/4"></div>
          </div>

          {/* Time skeleton */}
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mr-1"></div>
            <div className="w-16 h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Rating and creator_name skeleton */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
          <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );

  // Error component
  const ErrorMessage = () => (
    <div className="w-full h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
      <div className="text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          Failed to load quizzes
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="w-full mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          {title}
        </h2>
        <a
          href="#"
          className="text-sm font-medium text-primary border-b-2 border-primary hover:text-primary-dark transition"
        >
          View all
        </a>
      </div>

      {error ? (
        <ErrorMessage />
      ) : (
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
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <SwiperSlide
                  key={`skeleton-${index}`}
                  className="!w-48 sm:!w-56 md:!w-64"
                >
                  <LoadingSkeleton />
                </SwiperSlide>
              ))
            : quizzes.map((quiz) => (
                <SwiperSlide
                  key={quiz.id}
                  className="!w-48 sm:!w-56 md:!w-64 pb-8"
                >
                  <QuizCard {...quiz} />
                </SwiperSlide>
              ))}
        </Swiper>
      )}
    </div>
  );
};

export default CategoryCarousel;
