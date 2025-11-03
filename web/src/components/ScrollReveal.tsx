"use client";
import React from "react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import "../styles/scroll-animations.css";

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?:
    | "fadeInUp"
    | "fadeInDown"
    | "fadeInLeft"
    | "fadeInRight"
    | "fadeIn"
    | "slideInUp"
    | "slideInDown";
  delay?: number;
  duration?: number;
  className?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  animation = "fadeInUp",
  delay = 0,
  duration = 600,
  className = "",
}) => {
  const { ref, isVisible } = useScrollAnimation();

  const getAnimationClasses = () => {
    const baseClasses = "scroll-reveal";
    const animationClass = animation.replace(/([A-Z])/g, "-$1").toLowerCase();
    const delayClass = delay > 0 ? `delay-${Math.min(delay, 500)}` : "";

    return `${baseClasses} ${animationClass} ${delayClass} ${
      isVisible ? "visible" : ""
    }`;
  };

  return (
    <div
      ref={ref}
      className={`${getAnimationClasses()} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
