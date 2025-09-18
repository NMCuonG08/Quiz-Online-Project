"use client";
import React from "react";
import QuizSection from "./components/QuizSection";
import OffersSection from "./components/OffersSection";
import FeatureSection from "./components/FeatureSection";
import ScrollReveal from "../../../components/ScrollReveal";

const Home = () => {
  return (
    <div className="w-full flex flex-col" style={{ overflow: "visible" }}>
      <ScrollReveal animation="fadeInUp" delay={0} duration={800}>
        <QuizSection />
      </ScrollReveal>

      <ScrollReveal animation="fadeInUp" delay={200} duration={800}>
        <OffersSection />
      </ScrollReveal>

      <ScrollReveal animation="fadeInUp" delay={400} duration={800}>
        <FeatureSection />
      </ScrollReveal>
    </div>
  );
};

export default Home;
