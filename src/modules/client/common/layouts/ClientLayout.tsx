import React from "react";
import NavBar from "../components/Nav/NavBar";
import Footer from "../components/Footer";

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
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
