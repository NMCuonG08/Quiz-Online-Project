"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Progress } from "@/common/components/ui/progress";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/common/components/ui/carousel";

type QuizItem = {
  id: string;
  title: string;
  totalQuestions: number;
  answeredQuestions: number;
  thumbnail: string; // public path
};

// Mock data kept locally for now. Fields mirror what a real API would expose
// so we can swap later without changing UI logic.
const mockQuizes: QuizItem[] = [
  {
    id: "space-explorers",
    title: "Space Explorers",
    totalQuestions: 10,
    answeredQuestions: 2,
    thumbnail: "/home/quiz2.jpg",
  },
  {
    id: "world-capitals",
    title: "World Capitals",
    totalQuestions: 12,
    answeredQuestions: 7,
    thumbnail: "/home/quiz.jpg",
  },
  {
    id: "basic-math",
    title: "Basic Math",
    totalQuestions: 8,
    answeredQuestions: 4,
    thumbnail: "/home/quiz3.jpg",
  },
];

const HistoryQuizes = () => {
  return (
    <section className="relative">
      <Carousel
        className="w-full"
        opts={{
          align: "start",
          containScroll: "trimSnaps",
        }}
      >
        <CarouselContent className="-ml-3 md:-ml-4">
          {mockQuizes.map((quiz) => {
            const progress =
              quiz.totalQuestions === 0
                ? 0
                : Math.round(
                    (quiz.answeredQuestions / quiz.totalQuestions) * 100
                  );

            return (
              <CarouselItem
                key={quiz.id}
                className="pl-3 md:pl-4 basis-full sm:basis-[90%] md:basis-1/2"
              >
                <Card
                  className="p-0 overflow-hidden cursor-pointer"
                  disableHover
                  tightShadow
                >
                  <div className="grid grid-cols-2 gap-0 h-56 sm:h-56 md:h-64">
                    {/* Left: title + progress */}
                    <CardContent className="col-span-1 p-5 sm:p-6 flex flex-col justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg sm:text-xl">
                          {quiz.title}
                        </CardTitle>
                        <CardDescription className="mt-0.5 text-sm">
                          {quiz.totalQuestions} questions
                        </CardDescription>
                      </div>

                      <div className="space-y-2">
                        <Progress value={progress} />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {quiz.answeredQuestions}/{quiz.totalQuestions}
                          </span>
                          <span>{progress}%</span>
                        </div>
                      </div>

                      <div>
                        <Button size="sm">Let&apos;s go!</Button>
                      </div>
                    </CardContent>

                    {/* Right: thumbnail */}
                    <div className="col-span-1 relative">
                      <Image
                        src={quiz.thumbnail}
                        alt={quiz.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 320px"
                        priority={false}
                      />
                    </div>
                  </div>
                  {/* Thin global progress bar at the bottom of the card */}
                  <div className="absolute left-0 right-0 bottom-0 h-1 bg-primary/20">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${progress}%` }}
                      aria-hidden
                    />
                  </div>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default HistoryQuizes;
