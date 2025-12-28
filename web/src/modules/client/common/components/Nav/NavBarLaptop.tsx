"use client";
import { Link, usePathname } from "@/common/i18n/navigation";
import { LocalizedLink } from "@/common/components/ui";
import React from "react";
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

const NavBarLaptop = () => {
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
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <LocalizedLink href="/" className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-pink-300 via-purple-300 to-blue-300" />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            CourseCo
          </span>
        </LocalizedLink>

        {/* Nav links */}
        <nav className="hidden gap-8  md:flex">
          <LocalizedLink
            href="/"
            className={`nav-link text-sm text-muted-foreground transition-colors ${isActive("/") ? "active" : "hover:text-[#FDD239]"
              }`}
          >
            {tNav("home")}
          </LocalizedLink>
          <LocalizedLink
            href="/category"
            className={`nav-link text-sm text-muted-foreground transition-colors ${isActive("/category") ? "active" : "hover:text-[#FDD239]"
              }`}
          >
            {tNav("quizzes")}
          </LocalizedLink>
          <Link
            href="#courses"
            className={`nav-link text-sm text-muted-foreground transition-colors ${isActive("#courses") ? "active" : "hover:text-[#FDD239]"
              }`}
          >
            {tNav("courses")}
          </Link>
          <Link
            href="#community"
            className={`nav-link text-sm text-muted-foreground transition-colors ${isActive("#community") ? "active" : "hover:text-[#FDD239]"
              }`}
          >
            {tNav("community")}
          </Link>
          <Link
            href="#about"
            className={`nav-link text-sm text-muted-foreground transition-colors ${isActive("#about") ? "active" : "hover:text-[#FDD239]"
              }`}
          >
            {tNav("about")}
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="inline-flex bg-yellow items-center justify-center w-9 h-9 p-0"
                >
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <LocalizedLink
                    href="/user"
                    className="flex items-center gap-2"
                  >
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
  );
};

export default NavBarLaptop;
