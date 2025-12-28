"use client";
import { Link, usePathname } from "@/common/i18n/navigation";
import { LocalizedLink } from "@/common/components/ui";
import React from "react";
import { createPortal } from "react-dom";
import { ThemeToggle } from "@/common/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/common/components/ui";
import { Button } from "@/common/components/ui/button";
import { useAuth } from "@/modules/auth/common/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import { User, LogOut, LayoutDashboard } from "lucide-react";
import "@/styles/nav-link.css";
import { useLocale, useTranslations } from "next-intl";

const NavBarMobile = () => {
  const [open, setOpen] = React.useState(false);
  const { isLoggedIn, logout } = useAuth();
  const pathname = usePathname();
  const [hash, setHash] = React.useState<string>("");
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const locale = useLocale();



  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setHash(window.location.hash || "");
      const onHashChange = () => setHash(window.location.hash || "");
      window.addEventListener("hashchange", onHashChange);
      return () => window.removeEventListener("hashchange", onHashChange);
    }
  }, []);

  const isActive = (href: string) => {
    if (href.startsWith("#")) return hash === href;
    if (href === "#") return pathname === "/";
    return pathname === href;
  };
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
              href="/"
              className={`nav-link rounded-md px-3 py-2 text-base text-foreground transition-colors ${isActive("/") ? "active" : "hover:text-yellow-500"
                }`}
              onClick={() => setOpen(false)}
            >
              {tNav("home")}
            </Link>
            <Link
              href="/category"
              className={`nav-link rounded-md px-3 py-2 text-base text-foreground transition-colors ${isActive("/category") ? "active" : "hover:text-yellow-500"
                }`}
              onClick={() => setOpen(false)}
            >
              {tNav("quizzes")}
            </Link>
            <Link
              href="#courses"
              className={`nav-link rounded-md px-3 py-2 text-base text-foreground transition-colors ${isActive("#courses") ? "active" : "hover:text-yellow-500"
                }`}
              onClick={() => setOpen(false)}
            >
              {tNav("courses")}
            </Link>
            <Link
              href="#community"
              className={`nav-link rounded-md px-3 py-2 text-base text-foreground transition-colors ${isActive("#community") ? "active" : "hover:text-yellow-500"
                }`}
              onClick={() => setOpen(false)}
            >
              {tNav("community")}
            </Link>
            <Link
              href="#about"
              className={`nav-link rounded-md px-3 py-2 text-base text-foreground transition-colors ${isActive("#about") ? "active" : "hover:text-yellow-500"
                }`}
              onClick={() => setOpen(false)}
            >
              {tNav("about")}
            </Link>
          </nav>

          {/* Removed theme toggle from sidebar per request */}
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

          <LocalizedLink href="/" className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-pink-300 via-purple-300 to-blue-300" />
            <span className="text-base font-semibold tracking-tight text-foreground">
              CourseCo
            </span>
          </LocalizedLink>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center justify-center w-9 h-9 p-0"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <LocalizedLink href="/user" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      {tNav("dashboard")}
                    </LocalizedLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    {tAuth("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <LocalizedLink href="/auth/login">
                <Button className="inline-flex bg-yellow dark:bg-gray-dark items-center px-4 py-2 text-sm font-medium text-primary-foreground transition-colors">
                  {tAuth("signIn")}
                </Button>
              </LocalizedLink>
            )}
          </div>
        </div>
      </header>

      {/* Mobile sheet using Portal */}
      {mounted && mobileMenu && createPortal(mobileMenu, document.body)}
    </>
  );
};

export default NavBarMobile;
