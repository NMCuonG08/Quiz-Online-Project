"use client";
import React from "react";
import Image from "next/image";
import { Button } from "@/common/components/ui/button";
import { LocalizedLink } from "@/common/components/ui";
import { useTranslations } from "next-intl";

const QuizSection = () => {
  const t = useTranslations("quizSection");
  const quizCategories = [
    "/banners/th1.png",
    "/banners/th6.jpg",
    "/banners/th3.jpg",
    "/banners/th8.jpg",
  ];

  return (
    <section className="w-full" style={{ overflow: "visible" }}>
      <div
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10"
        style={{ overflow: "visible" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col justify-center gap-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              {t("title")}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {t("description")}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-0 sm:min-w-fit">
                <LocalizedLink href="/category">
                  <Button className="w-full px-6 py-6 bg-yellow dark:bg-gray-dark text-base lg:text-lg text-black dark:text-white">
                    {t("startQuiz")}
                  </Button>
                </LocalizedLink>
              </div>
              <div className="flex-1 min-w-0 sm:min-w-fit">
                <LocalizedLink href="/category">
                  <Button
                    variant="outline"
                    className="w-full px-6 py-6 bg-gray dark:bg-gray-dark text-base lg:text-lg"
                  >
                    {t("viewQuizList")}
                  </Button>
                </LocalizedLink>
              </div>
            </div>

            <div className="mt-8 hidden sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {quizCategories.map((src, idx) => (
                <div
                  key={idx}
                  className="h-16 sm:h-20 lg:h-24 w-full  border border-border/60 bg-background/50 flex items-center justify-center"
                >
                  <Image
                    src={src}
                    alt={t("categoryAlt", { index: idx + 1 })}
                    width={200}
                    height={200}
                    className="h-10 sm:h-12 lg:h-14 w-auto object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="relative w-full h-64 sm:h-80 md:h-[28rem] lg:h-[32rem] rounded-xl overflow-hidden">
            <Image
              src="/banners/home.png"
              alt={t("imageAlt")}
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuizSection;
