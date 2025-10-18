"use client";
import React from "react";
import { Button } from "@/common/components/ui/button";
import { Card } from "@/common/components/ui/card";
import { Compass, Mountain, Sun } from "lucide-react";

const LevelUpSection = () => {
  return (
    <div className="w-full py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Image placeholder */}
          <div className="order-2 lg:order-1">
            <img
              src="/banners/levelip.jpg"
              alt="Multiplayer challenges"
              className="object-cover w-full h-96 rounded-lg"
              loading="lazy"
            />
          </div>

          {/* Right side - Content */}
          <div className="order-1 lg:order-2 space-y-8">
            {/* Icon */}
            <div className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center">
              <Compass className="w-8 h-8 text-white dark:text-black" />
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                Level up your learning journey
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg">
                Earn experience points, unlock achievements, and track your
                progress through an engaging gamification system
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all duration-300 px-8 py-3 rounded-lg"
              >
                Discover
              </Button>
              <div className="flex-1" />
              <button className="text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 font-medium text-lg underline underline-offset-4 hover:no-underline transition-all duration-300 ml-0 sm:ml-auto">
                Rewards &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelUpSection;
