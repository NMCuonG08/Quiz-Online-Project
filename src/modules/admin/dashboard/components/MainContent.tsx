import React from "react";
import HeroBanner from "./HeroBanner";
import ProgressCards from "./ProgressCards";
import CourseCarousel from "./CourseCarousel";

const MainContent: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Progress Cards */}
      <ProgressCards />

      {/* Course Carousel */}
      <CourseCarousel />
    </div>
  );
};

export default MainContent;
