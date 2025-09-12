"use client";
import Link from "next/link";
import React from "react";
import { createPortal } from "react-dom";
import { ThemeToggle } from "@/common/components/ui/theme-toggle";

const NavBarMobile = () => {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const mobileMenu =
    open && mounted ? (
      <div
        className="mobile-menu-container fixed inset-0 z-[99999] md:hidden animate-in fade-in duration-200"
        style={{ zIndex: 99999 }}
        onClick={() => setOpen(false)}
      >
        <div className="mobile-menu-overlay absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />
        <div
          className="mobile-nav-sheet absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-background p-4 sm:p-6 shadow-2xl border-r border-border animate-in slide-in-from-left duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            className="mb-4 flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="text-muted-foreground"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <nav className="flex flex-col gap-3">
            <Link
              href="#"
              className="mobile-nav-link rounded-md px-3 py-2 text-base text-foreground hover:bg-accent transition-colors"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>
            <Link
              href="#courses"
              className="mobile-nav-link rounded-md px-3 py-2 text-base text-foreground hover:bg-accent transition-colors"
              onClick={() => setOpen(false)}
            >
              Courses
            </Link>
            <Link
              href="#community"
              className="mobile-nav-link rounded-md px-3 py-2 text-base text-foreground hover:bg-accent transition-colors"
              onClick={() => setOpen(false)}
            >
              Community
            </Link>
            <Link
              href="#about"
              className="mobile-nav-link rounded-md px-3 py-2 text-base text-foreground hover:bg-accent transition-colors"
              onClick={() => setOpen(false)}
            >
              About
            </Link>
          </nav>

          {/* Theme toggle in mobile menu */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Chế độ hiển thị
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <button
            aria-label="Toggle menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
            onClick={() => setOpen((s) => !s)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="text-foreground"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-pink-300 via-purple-300 to-blue-300" />
            <span className="text-base font-semibold tracking-tight text-foreground">
              CourseCo
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/signin"
              className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile sheet using Portal */}
      {mounted && mobileMenu && createPortal(mobileMenu, document.body)}
    </>
  );
};

export default NavBarMobile;
