"use client";

import React, { useEffect } from "react";
import GameQuizDemoPage from "@/modules/client/pages/GameQuizDemoPage";

const Page = () => {
  useEffect(() => {
    // Hide NavBar and Footer
    const hideHeaderFooter = () => {
      const navBar = document.querySelector(
        'nav, [class*="NavBar"], [class*="navbar"]'
      );
      const footer = document.querySelector(
        'footer, [class*="Footer"], [class*="footer"]'
      );

      if (navBar) {
        (navBar as HTMLElement).style.display = "none";
      }
      if (footer) {
        (footer as HTMLElement).style.display = "none";
      }

      // Also hide main wrapper padding
      const main = document.querySelector("main");
      if (main) {
        main.style.padding = "0";
        main.style.maxWidth = "100%";
      }
    };

    hideHeaderFooter();

    // Use MutationObserver to catch dynamic renders
    const observer = new MutationObserver(hideHeaderFooter);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      // Restore on unmount
      const navBar = document.querySelector(
        'nav, [class*="NavBar"], [class*="navbar"]'
      );
      const footer = document.querySelector(
        'footer, [class*="Footer"], [class*="footer"]'
      );
      if (navBar) {
        (navBar as HTMLElement).style.display = "";
      }
      if (footer) {
        (footer as HTMLElement).style.display = "";
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-background overflow-hidden">
      <GameQuizDemoPage />
    </div>
  );
};

export default Page;
