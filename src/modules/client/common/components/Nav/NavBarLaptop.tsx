"use client";
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/common/components/ui/theme-toggle";
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

const NavBarLaptop = () => {
  const { isLoggedIn, logout } = useAuth();
  const pathname = usePathname();
  const [hash, setHash] = React.useState<string>("");

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
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-pink-300 via-purple-300 to-blue-300" />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            CourseCo
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden gap-8  md:flex">
          <Link
            href="/"
            className={`nav-link text-sm text-muted-foreground transition-colors ${
              isActive("/") ? "active" : "hover:text-[#FDD239]"
            }`}
          >
            Home
          </Link>
          <Link
            href="/category"
            className={`nav-link text-sm text-muted-foreground transition-colors ${
              isActive("/category") ? "active" : "hover:text-[#FDD239]"
            }`}
          >
            Quizzes
          </Link>
          <Link
            href="#courses"
            className={`nav-link text-sm text-muted-foreground transition-colors ${
              isActive("#courses") ? "active" : "hover:text-[#FDD239]"
            }`}
          >
            Courses
          </Link>
          <Link
            href="#community"
            className={`nav-link text-sm text-muted-foreground transition-colors ${
              isActive("#community") ? "active" : "hover:text-[#FDD239]"
            }`}
          >
            Community
          </Link>
          <Link
            href="#about"
            className={`nav-link text-sm text-muted-foreground transition-colors ${
              isActive("#about") ? "active" : "hover:text-[#FDD239]"
            }`}
          >
            About
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
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
                  <Link href="/user" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="flex items-center gap-2 text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login">
              <Button className="inline-flex bg-yellow dark:bg-gray-dark items-center px-4 py-2 text-sm font-medium text-primary-foreground transition-colors">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavBarLaptop;
