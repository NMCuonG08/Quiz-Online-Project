"use client";

import React from "react";
import NavBar from "../components/Nav/NavBar";
import Footer from "../components/Footer";
import { usePathname } from "next/navigation";

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // Hide header and footer for quiz session pages
  const isQuizSession = pathname?.includes("/do-quiz");

  if (isQuizSession) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <main className="flex-1 w-full" style={{ overflow: "visible" }}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main
        className="mx-auto w-full max-w-7xl px-4 py-6"
        style={{ overflow: "visible" }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default ClientLayout;
