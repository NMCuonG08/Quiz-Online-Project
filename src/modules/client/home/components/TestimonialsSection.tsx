"use client";
import React from "react";
import { Card } from "@/common/components/ui/card";
import { Star, User } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      text: "This platform changed how I study. The competitive edge keeps me motivated.",
      author: "Sarah Johnson",
      role: "University student",
      rating: 5,
    },
    {
      id: 2,
      text: "Multiplayer quizzes make learning fun and interactive.",
      author: "Michael Chen",
      role: "High school learner",
      rating: 5,
    },
    {
      id: 3,
      text: "I've improved my test scores dramatically using these study challenges.",
      author: "Emma Rodriguez",
      role: "Professional trainer",
      rating: 5,
    },
  ];

  return (
    <div className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="relative inline-block">
            <div className="absolute -top-2 left-0 w-full h-0.5 bg-purple-500"></div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              What learners say
            </h2>
            <div className="absolute -bottom-2 left-0 w-full h-0.5 bg-purple-500"></div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-6">
            Real stories from students who transformed their learning
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="p-6 h-full flex flex-col hover:shadow-lg transition-shadow duration-300"
            >
              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-black dark:text-white fill-current"
                  />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-6 flex-grow line-clamp-3">
                "{testimonial.text}"
              </p>

              {/* Author Info */}
              <div className="flex items-center mt-auto">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
                  <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {testimonial.author}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;
