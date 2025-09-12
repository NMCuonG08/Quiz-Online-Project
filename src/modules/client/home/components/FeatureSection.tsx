import React from "react";
import Image from "next/image";

const features = [
  {
    title: "Quiz Game",
    subtitle:
      "Chơi và kiểm tra kiến thức với các bộ câu hỏi đa dạng, chấm điểm tức thì.",
    image: "/home/quiz.jpg",
  },
  {
    title: "Fragments",
    subtitle:
      "Học theo từng mảnh kiến thức ngắn gọn, dễ nhớ, luyện tập theo lộ trình.",
    image: "/home/quiz2.jpg",
  },
  {
    title: "Sudoku",
    subtitle: "Giải đố Sudoku từ dễ đến khó, rèn luyện tư duy logic mỗi ngày.",
    image: "/home/quiz3.jpg",
  },
];

const FeatureSection = () => {
  return (
    <section className="max-w-6xl mx-auto px-4 mt-20 py-6">
      {features.slice(0, 3).map((feature, index) => (
        <div
          key={feature.title}
          className={`flex items-start gap-8 py-6 ${
            index % 2 === 0 ? "flex-row" : "flex-row-reverse"
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
