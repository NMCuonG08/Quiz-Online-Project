"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/common/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/common/components/ui";
import {
  Bell,
  Plus,
  Home,
  Folder,
  Archive,
  Star,
  Settings,
  LogOut,
  Search,
} from "lucide-react";
import AuthGuard from "@/common/guards/AuthGuard";

export default function UserLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <div className="min-h-screen w-full flex bg-background text-foreground">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-border p-4 hidden md:flex md:flex-col md:sticky md:top-0 md:h-screen md:overflow-y-auto">
          <div className="flex items-center gap-2 mb-6">
            <div className="size-8 rounded-md bg-primary" />
            <span className="font-semibold">Learning Content</span>
          </div>

          <nav className="space-y-1">
            <SidebarItem href="#" icon={<Home size={18} />} label="Recents" />
            <SidebarItem
              href="#"
              icon={<Folder size={18} />}
              label="Shared Content"
            />
            <SidebarItem
              href="#"
              icon={<Archive size={18} />}
              label="Archived"
            />
            <SidebarItem href="#" icon={<Star size={18} />} label="Templates" />
          </nav>

          <div className="mt-6">
            <p className="text-xs uppercase text-muted-foreground mb-2">
              Favorites
            </p>
            <div className="space-y-2">
              <SidebarBadge label="Figma Basic" color="bg-sky-500" />
              <SidebarBadge label="Folder NEW 2024" color="bg-emerald-500" />
              <SidebarBadge label="Assignment 101" color="bg-indigo-500" />
              <SidebarBadge label="Quiz Figma" color="bg-amber-500" />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase text-muted-foreground">
                Projects
              </p>
              <Button variant="outline" size="icon" className="h-6 w-6">
                <Plus size={16} />
              </Button>
            </div>
            <div className="space-y-1">
              <SidebarDot label="Figma basic" color="bg-violet-600" />
              <SidebarDot label="Fikri studio" color="bg-rose-500" />
            </div>
          </div>

          <div className="mt-auto space-y-2">
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium mb-2">Get Trenning AI</p>
              <p className="text-xs text-muted-foreground mb-3">
                Use AI in every action on Trenning webapp
              </p>
              <Button size="sm" className="w-full">
                Try it now
              </Button>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="size-8 rounded-full bg-muted" />
              <span className="text-sm">RF</span>
              <div className="ml-auto flex items-center gap-2">
                <Settings size={16} />
                <LogOut size={16} />
              </div>
            </div>
          </div>
        </aside>

        {/* Right area */}
        <div className="flex-1 flex flex-col">
          {/* Top Navbar */}
          <header className="h-14 border-b border-border px-4 flex items-center gap-2 sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Folder size={18} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <div className="w-full h-full p-4 flex flex-col">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="size-8 rounded-md bg-primary" />
                    <span className="font-semibold">Learning Content</span>
                  </div>

                  <nav className="space-y-1">
                    <SidebarItem
                      href="#"
                      icon={<Home size={18} />}
                      label="Recents"
                    />
                    <SidebarItem
                      href="#"
                      icon={<Folder size={18} />}
                      label="Shared Content"
                    />
                    <SidebarItem
                      href="#"
                      icon={<Archive size={18} />}
                      label="Archived"
                    />
                    <SidebarItem
                      href="#"
                      icon={<Star size={18} />}
                      label="Templates"
                    />
                  </nav>

                  <div className="mt-6">
                    <p className="text-xs uppercase text-muted-foreground mb-2">
                      Favorites
                    </p>
                    <div className="space-y-2">
                      <SidebarBadge label="Figma Basic" color="bg-sky-500" />
                      <SidebarBadge
                        label="Folder NEW 2024"
                        color="bg-emerald-500"
                      />
                      <SidebarBadge
                        label="Assignment 101"
                        color="bg-indigo-500"
                      />
                      <SidebarBadge label="Quiz Figma" color="bg-amber-500" />
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs uppercase text-muted-foreground">
                        Projects
                      </p>
                      <Button variant="outline" size="icon" className="h-6 w-6">
                        <Plus size={16} />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <SidebarDot label="Figma basic" color="bg-violet-600" />
                      <SidebarDot label="Fikri studio" color="bg-rose-500" />
                    </div>
                  </div>

                  <div className="mt-auto space-y-2">
                    <div className="rounded-lg border p-3">
                      <p className="text-sm font-medium mb-2">
                        Get Trenning AI
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Use AI in every action on Trenning webapp
                      </p>
                      <Button size="sm" className="w-full">
                        Try it now
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="size-8 rounded-full bg-muted" />
                      <span className="text-sm">RF</span>
                      <div className="ml-auto flex items-center gap-2">
                        <Settings size={16} />
                        <LogOut size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="font-semibold">Fikri Studio</h1>
            <span className="ml-2 text-xs bg-amber-200 text-amber-900 rounded px-2 py-0.5">
              pro
            </span>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden sm:block">
                <input
                  className="h-9 w-48 md:w-72 rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none"
                  placeholder="Search"
                />
                <Search
                  size={16}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
              <Button variant="outline" className="gap-2 hidden sm:inline-flex">
                Upload
              </Button>
              <Button className="gap-2 hidden md:inline-flex">
                <Plus size={16} /> New Content
              </Button>
              <Button variant="ghost" size="icon">
                <Bell size={18} />
              </Button>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}

function SidebarItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted text-sm"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function SidebarBadge({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted">
      <span className={`size-5 rounded ${color}`} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function SidebarDot({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted">
      <span className={`size-2 rounded-full ${color}`} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
