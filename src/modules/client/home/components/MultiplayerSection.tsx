import React from "react";
import { Button } from "@/common/components/ui/button";
import Link from "next/link";

const MultiplayerSection = () => {
  const partners = [
    { name: "Webflow", logo: "W" },
    { name: "Relume", logo: "R" },
    { name: "Webflow", logo: "W" },
    { name: "Relume", logo: "R" },
  ];

  return (
    <section className="w-full py-16 px-4 sm:px-8 lg:px-12 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="flex flex-col gap-6">
            {/* Category */}
            <p className="text-sm text-muted-foreground">Compete</p>

            {/* Main Title */}
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Multiplayer challenges
            </h2>

            {/* Description */}
            <p className="text-lg text-muted-foreground leading-relaxed">
              Real-time leaderboards and interactive quizzes that keep you
              engaged and motivated.
            </p>

            {/* Partner Logos */}
            <div className="grid grid-cols-2 gap-6 mt-4">
              {partners.map((partner, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-foreground rounded flex items-center justify-center">
                    <span className="text-background font-bold text-sm">
                      {partner.logo}
                    </span>
                  </div>
                  <span className="text-foreground font-medium">
                    {partner.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row gap-4 items-center mt-6">
              <Button className="px-6 py-3 bg-yellow dark:bg-gray-dark text-gray-dark dark:text-primary-foreground hover:opacity-90">
                Join now
              </Button>
              <Link
                href="#"
                className="text-foreground hover:text-muted-foreground transition-colors"
              >
                Learn more &gt;
              </Link>
            </div>
          </div>

          {/* Right Column - Image Placeholder */}
          <div className="relative w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src="/banners/challenges.jpg"
              alt="Multiplayer challenges"
              className="object-cover w-full h-full rounded-lg"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MultiplayerSection;
