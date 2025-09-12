"use client";
import Link from "next/link";
import React from "react";
import { ThemeToggle } from "@/common/components/ui/theme-toggle";

const NavBarLaptop = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-pink-300 via-purple-300 to-blue-300" />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            CourseCo
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden gap-8 md:flex">
          <Link
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <Link
            href="#courses"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Courses
          </Link>
          <Link
            href="#community"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Community
          </Link>
          <Link
            href="#about"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/signin"
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
};

export default NavBarLaptop;
