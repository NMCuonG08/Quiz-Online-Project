import React from "react";
import QuizSection from "./components/QuizSection";
import OffersSection from "./components/OffersSection";
import FeatureSection from "./components/FeatureSection";

const Home = () => {
  return (
    <div className="w-full flex flex-col" style={{ overflow: "visible" }}>
      <QuizSection />
      <OffersSection />
      <FeatureSection />
    </div>
  );
};

export default Home;
