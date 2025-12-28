"use client";

import { SidebarProvider } from "@/modules/admin/common/layouts/sidebar/sidebar-context";
import { ThemeProvider } from "@/common/contexts/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>{children}</SidebarProvider>
    </ThemeProvider>
  );
}
