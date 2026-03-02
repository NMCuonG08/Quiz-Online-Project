"use client";

import React from "react";
import { usePathname } from "@/common/i18n/navigation";
import { LocalizedLink } from "@/common/components/ui";
import { Button } from "@/common/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/common/components/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar";
import NotificationDropdown from "@/common/components/NotificationDropdown";
import {
  LayoutDashboard,
  User,
  LogOut,
  BookOpen,
  Trophy,
  Users,
  Menu,
  ChevronRight,
  Gamepad2,
  Sparkles,
} from "lucide-react";
import AuthGuard from "@/common/guards/AuthGuard";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { logout } from "@/modules/auth/common/slices/authSlice";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";
import { APP_ROUTES } from "@/lib/appRoutes";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  {
    href: "/user",
    icon: <LayoutDashboard size={18} />,
    label: "Dashboard",
  },
  {
    href: "/user/profile",
    icon: <User size={18} />,
    label: "Profile",
  },
  {
    href: "/user/quizzes",
    icon: <BookOpen size={18} />,
    label: "My Quizzes",
  },
];

const quizNavItems: NavItem[] = [
  {
    href: "/quiz",
    icon: <BookOpen size={18} />,
    label: "Browse Quizzes",
  },
  {
    href: "/category",
    icon: <Sparkles size={18} />,
    label: "Categories",
  },
  {
    href: "/community",
    icon: <Users size={18} />,
    label: "Community",
  },
];

export default function UserLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useLocalizedRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const displayName = user?.username || "User";
  const email = user?.email || "";
  const avatarUrl = user?.avatarUrl;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    await dispatch(logout());
    router.push(APP_ROUTES.AUTH.LOGIN);
  };

  const isActive = (href: string) => {
    if (!pathname) return false;
    // Exact match for /user, starts-with for sub-routes
    if (href === "/user") {
      return pathname.endsWith("/user") || pathname.endsWith("/user/");
    }
    return pathname.includes(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-3 mb-8">
        <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
          <Gamepad2 size={18} className="text-primary-foreground" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight">Quiz Online</span>
          <p className="text-[10px] text-muted-foreground font-medium -mt-0.5">Dashboard</p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="space-y-1">
        <p className="text-[11px] uppercase text-muted-foreground font-semibold tracking-wider px-3 mb-2">
          Main
        </p>
        {mainNavItems.map((item) => (
          <SidebarLink
            key={item.href}
            {...item}
            active={isActive(item.href)}
          />
        ))}
      </div>

      {/* Quiz Section */}
      <div className="mt-6 space-y-1">
        <p className="text-[11px] uppercase text-muted-foreground font-semibold tracking-wider px-3 mb-2">
          Quizzes
        </p>
        {quizNavItems.map((item) => (
          <SidebarLink
            key={item.href}
            {...item}
            active={isActive(item.href)}
          />
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Premium CTA */}
      {!user?.isPremium && (
        <div className="mx-2 mb-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={16} className="text-primary" />
            <p className="text-sm font-semibold">Go Premium</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Unlock all quizzes, analytics, and priority support.
          </p>
          <Button size="sm" className="w-full text-xs font-semibold h-8">
            Upgrade Now
          </Button>
        </div>
      )}

      {/* User Profile Section */}
      <div className="border-t border-border pt-3 mx-2">
        <div className="flex items-center gap-3 px-1">
          <Avatar className="size-9 ring-2 ring-border">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <AuthGuard>
      <div className="min-h-screen w-full flex bg-background text-foreground">
        {/* Desktop Sidebar */}
        <aside className="w-[260px] shrink-0 border-r border-border p-4 hidden md:flex md:flex-col md:sticky md:top-0 md:h-screen md:overflow-y-auto">
          <SidebarContent />
        </aside>

        {/* Right area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-14 border-b border-border px-4 flex items-center gap-3 sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-4 w-[280px]">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            {/* Page Title */}
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-foreground">
                {getPageTitle(pathname)}
              </h1>
            </div>

            {/* Right Actions */}
            <div className="ml-auto flex items-center gap-2">
              <NotificationDropdown />
              <div className="hidden sm:block">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5 font-semibold"
                  onClick={() => router.push(APP_ROUTES.QUIZ.LIST)}
                >
                  <BookOpen size={14} />
                  Explore Quizzes
                </Button>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}

/* ─────────── Sub-components ─────────── */

function SidebarLink({
  href,
  icon,
  label,
  active,
  badge,
}: NavItem & { active: boolean }) {
  return (
    <LocalizedLink
      href={href}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        active
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "transition-colors",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-md">
          {badge}
        </span>
      )}
      {active && (
        <ChevronRight size={14} className="text-primary/60" />
      )}
    </LocalizedLink>
  );
}

function getPageTitle(pathname: string | null): string {
  if (!pathname) return "Dashboard";

  if (pathname.includes("/user/profile")) return "My Profile";
  if (pathname.endsWith("/user") || pathname.endsWith("/user/"))
    return "Dashboard";
  return "Dashboard";
}
