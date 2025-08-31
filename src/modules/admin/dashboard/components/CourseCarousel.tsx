import React, { useState } from "react";
import { Card, CardContent } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { Avatar } from "@/common/components/ui/avatar";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";

const CourseCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const courses = [
    {
      id: 1,
      title: "Beginner's Guide to Becoming a Professional Front-End Developer",
      category: "FRONT END",
      mentor: "Leonardo samsul",
      mentorAvatar: "/avatar.jpg",
      image: "/lily.png",
      rating: 4.8,
      students: 1247,
    },
    {
      id: 2,
      title: "Optimizing User Experience with the Best UI/UX Design",
      category: "UI/UX DESIGN",
      mentor: "Bayu Salto",
      mentorAvatar: "/avatar.jpg",
      image: "/lily.png",
      rating: 4.9,
      students: 892,
    },
    {
      id: 3,
      title: "Reviving and Refresh Company Image",
      category: "BRANDING",
      mentor: "Padhang Satrio",
      mentorAvatar: "/avatar.jpg",
      image: "/lily.png",
      rating: 4.7,
      students: 1563,
    },
    {
      id: 4,
      title: "Advanced JavaScript: From ES6+ to Modern Frameworks",
      category: "JAVASCRIPT",
      mentor: "Zakir Horizontal",
      mentorAvatar: "/avatar.jpg",
      image: "/lily.png",
      rating: 4.6,
      students: 2341,
    },
    {
      id: 5,
      title: "Complete React Developer Course with Hooks & Context",
      category: "REACT",
      mentor: "Leonardo Samsul",
      mentorAvatar: "/avatar.jpg",
      image: "/lily.png",
      rating: 4.8,
      students: 1892,
    },
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, courses.length - 2));
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prev) =>
        (prev - 1 + Math.max(1, courses.length - 2)) %
        Math.max(1, courses.length - 2)
    );
  };

  const visibleCourses = courses.slice(currentIndex, currentIndex + 3);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Continue Watching</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            disabled={currentIndex >= courses.length - 3}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleCourses.map((course) => (
          <Card
            key={course.id}
            className="group hover:shadow-lg transition-all duration-300"
          >
            <div className="relative">
              <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
                <Heart className="h-4 w-4 text-gray-600" />
              </button>
              <Badge className="absolute top-3 left-3 bg-blue-600 text-white">
                {course.category}
              </Badge>
            </div>

            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {course.title}
              </h3>

              <div className="flex items-center space-x-2 mb-3">
                <Avatar className="h-6 w-6">
                  <img src={course.mentorAvatar} alt={course.mentor} />
                </Avatar>
                <span className="text-sm text-gray-600">{course.mentor}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <span>⭐ {course.rating}</span>
                </div>
                <span>{course.students.toLocaleString()} students</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CourseCarousel;
