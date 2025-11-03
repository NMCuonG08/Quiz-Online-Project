"use client";
import React from "react";
import QuizSection from "./components/QuizSection";
import OffersSection from "./components/OffersSection";
import FeatureSection from "./components/FeatureSection";
import HowItWorksSection from "./components/HowItWorksSection";
import MultiplayerSection from "./components/MultiplayerSection";
import LevelUpSection from "./components/LevelUpSection";
import TestimonialsSection from "./components/TestimonialsSection";
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

      <ScrollReveal animation="fadeInUp" delay={600} duration={800}>
        <HowItWorksSection />
      </ScrollReveal>

      <ScrollReveal animation="fadeInUp" delay={800} duration={800}>
        <MultiplayerSection />
      </ScrollReveal>

      <ScrollReveal animation="fadeInUp" delay={1000} duration={800}>
        <LevelUpSection />
      </ScrollReveal>

      <ScrollReveal animation="fadeInUp" delay={1200} duration={800}>
        <TestimonialsSection />
      </ScrollReveal>
    </div>
  );
};

export default Home;
