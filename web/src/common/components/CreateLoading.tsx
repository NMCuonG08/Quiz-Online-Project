import React, { useEffect } from "react";
import { hatch, bouncy } from "ldrs";
// Register LDRS components
if (typeof window !== "undefined") {
  hatch.register();
  bouncy.register();
}

const link =
  "https://res.cloudinary.com/dj9r2qksh/video/upload/v1742444295/Recording_2025-03-20_111752_ynsddt.mp4";

const CreateLoading = ({ isVisible = true, videoSource = link }) => {
  // Prevent background scrolling when loading is visible
  useEffect(() => {
    if (isVisible) {
      // Save current scroll position
      const scrollY = window.scrollY;

      // Disable scrolling
      document.body.classList.add("overflow-hidden");
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      // Disable pointer events on all other elements
      document
        .querySelectorAll('body > *:not([class*="fixed"])')
        .forEach((el) => {
          el.setAttribute("aria-hidden", "true");
        });

      return () => {
        // Re-enable scrolling when component unmounts
        document.body.classList.remove("overflow-hidden");
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);

        // Re-enable pointer events
        document.querySelectorAll('[aria-hidden="true"]').forEach((el) => {
          el.removeAttribute("aria-hidden");
        });
      };
    }
  }, [isVisible]);

  // If not visible, don't render anything
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/85 flex justify-center items-center z-[999999] backdrop-blur-lg pointer-events-auto touch-none select-none overflow-hidden animate-fade-in">
      <div className="flex flex-col items-center justify-center p-8 sm:p-6 rounded-2xl bg-black/60 shadow-[0_0_30px_rgba(0,0,0,0.5),0_0_60px_rgba(255,255,255,0.1)] max-w-80 w-[90%] animate-pulse-shadow">
        <div className="flex flex-col items-center">
          <l-bouncy
            size="45"
            stroke="5"
            speed="2.5"
            color="white"
            className="animate-pulse-custom drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          ></l-bouncy>
          <p className="text-white text-xl sm:text-lg mt-5 font-medium text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-pulse-text">
            Please wait...
          </p>

          <div className="max-w-72 sm:max-w-56 mt-6 rounded-lg overflow-hidden shadow-[0_8px_16px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.1)] transition-transform duration-300">
            <video
              width="280"
              autoPlay
              loop
              muted
              playsInline
              className="w-full block"
            >
              <source src={videoSource} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLoading;
