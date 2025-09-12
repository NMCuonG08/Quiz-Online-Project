import React from "react";
import QuizSection from "./components/QuizSection";
import OffersSection from "./components/OffersSection";

const Home = () => {
  return (
    <div className="w-full flex flex-col" style={{ overflow: "visible" }}>
      <QuizSection />
      <OffersSection />
    </div>
  );
};

export default Home;
