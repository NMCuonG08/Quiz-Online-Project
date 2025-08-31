import React from "react";
import { Button } from "@/common/components/ui/button";
import { ArrowRight } from "lucide-react";

const HeroBanner: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="mb-4">
          <span className="text-blue-200 text-sm font-medium">
            ONLINE COURSE
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-4 max-w-2xl">
          Sharpen Your Skills with Professional Online Courses
        </h1>

        <Button
          size="lg"
          className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
        >
          Join Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default HeroBanner;
