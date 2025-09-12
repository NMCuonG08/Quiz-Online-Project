"use client";
import React from "react";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start lg:items-center mb-8">
          {/* Logo and Brand Section - 5/10 columns */}
          <div className="flex items-center">
            {/* Logo placeholder - sẽ thay thế bằng hình ảnh bạn cung cấp */}
            <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mr-6">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-2xl">
                  Q
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground">
                QuizMaster
              </h2>
              <p className="text-muted-foreground text-lg">
                Test Your Knowledge
              </p>
            </div>
          </div>

          {/* Navigation Links - 5/10 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* About Us */}
            <div>
              <h3 className="font-bold text-foreground mb-4 text-lg">
                About Us
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors text-base"
                  >
                    Mission
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors text-base"
                  >
                    Team
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors text-base"
                  >
                    Newsletter
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-bold text-foreground mb-4 text-lg">
                Support
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors text-base"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors text-base"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors text-base"
                  >
                    FAQ's
                  </a>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-bold text-foreground mb-4 text-lg">Social</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors text-base"
                  >
                    Facebook
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors text-base"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors text-base"
                  >
                    YouTube
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-border mb-6"></div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-base text-muted-foreground">
          <div className="mb-4 sm:mb-0">Copyright © QuizMaster</div>
          <div className="mb-4 sm:mb-0">
            <a href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
          <div>
            <a
              href="#"
              className="flex items-center hover:text-foreground transition-colors"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <span className="mr-2">Back to top</span>
              <div className="w-5 h-5 bg-accent/20 flex items-center justify-center rounded">
                <svg
                  className="w-3 h-3 text-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
