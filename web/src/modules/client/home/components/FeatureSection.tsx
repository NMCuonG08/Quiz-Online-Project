import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

const FeatureSection = () => {
  const t = useTranslations("featureSection");

  const features = [
    {
      title: t("feature1Title"),
      subtitle: t("feature1Subtitle"),
      image: "/home/quiz.jpg",
    },
    {
      title: t("feature2Title"),
      subtitle: t("feature2Subtitle"),
      image: "/home/quiz2.jpg",
    },
    {
      title: t("feature3Title"),
      subtitle: t("feature3Subtitle"),
      image: "/home/quiz3.jpg",
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 mt-20 py-6">
      {features.slice(0, 3).map((feature, index) => (
        <div
          key={feature.title}
          className={`flex items-start gap-8 py-6 ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"
            }`}
        >
          <div className="flex-1 flex justify-start">
            <Image
              src={feature.image}
              alt={feature.title}
              width={100}
              height={100}
              priority={index === 0}
              className="w-[100px] h-[100px] object-cover rounded-lg"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl md:text-3xl font-bold mb-3 text-black dark:text-white">
              {feature.title}
            </h3>
            <p className="text-base leading-7 text-black dark:text-white">
              {feature.subtitle}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
};

export default FeatureSection;
