import React from "react";
import CategoryCarousel, { QuizCardProps } from "./CategoryCarousel";

const ListQuizzes: React.FC = () => {
  // Mock data - thay thế bằng data thực từ API
  const quizzes: QuizCardProps[] = [
    {
      id: "1",
      title: "School knowledge (high school)",
      image: "/categories/cate1.jpg",
      rating: 4.1,
      author: "Lord_Buba",
    },
    {
      id: "2",
      title: "Guess the drawing",
      image: "/categories/cate2.png",
      rating: 3.8,
      author: "Teacher253",
      difficulty: "EASY",
    },
    {
      id: "3",
      title: "Anime",
      image: "/categories/cate3.png",
      rating: 3.9,
      author: "user_happy",
      difficulty: "AI GENERATED",
    },
    {
      id: "4",
      title: "One Piece Ultimate Quiz",
      image: "/categories/cate4.png",
      rating: 3.6,
      author: "WADDUP",
    },
    {
      id: "5",
      title: "The most famous and expensive NFTs in the world",
      image: "/categories/cate5.png",
      rating: 4.0,
      author: "Taidzokai",
      difficulty: "HARD",
    },
    {
      id: "6",
      title: "General Knowledge: Literature",
      image: "/categories/cate6.png",
      rating: 4.2,
      author: "Blanche30",
    },
  ];

  return (
    <div>
      <CategoryCarousel title="Recently published »" quizzes={quizzes} />
      <CategoryCarousel title="Best rating right now »" quizzes={quizzes} />
      <CategoryCarousel title="Popular right now »" quizzes={quizzes} />
      <CategoryCarousel title="Easy quizzes »" quizzes={quizzes} />
      <CategoryCarousel title="Hard quizzes »" quizzes={quizzes} />
    </div>
  );
};

export default ListQuizzes;
