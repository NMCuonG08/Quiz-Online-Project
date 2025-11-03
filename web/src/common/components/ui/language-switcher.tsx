"use client";

import React from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value as "en" | "vi";
    // Ensure we always have a leading slash path
    const current = pathname.startsWith("/") ? pathname : `/${pathname}`;
    const parts = current.split("/");
    // parts[0] = "" due to leading slash; parts[1] should be current locale
    if (parts.length > 1) {
      parts[1] = nextLocale;
    }
    const nextPath = parts.join("/") || `/${nextLocale}`;
    router.replace(nextPath);
  };

  const onValueChange = (val: string) => {
    handleChange({
      target: { value: val },
    } as unknown as React.ChangeEvent<HTMLSelectElement>);
  };

  return (
    <Select value={locale} onValueChange={onValueChange}>
      <div className="relative inline-block group">
        <SelectTrigger className="h-9 w-[120px] relative z-10">
          <SelectValue aria-label="Language selector" />
        </SelectTrigger>
        <div
          className="absolute bg-black/80 dark:bg-white rounded-md w-full h-full -bottom-1 -right-1 transition-all duration-200 group-hover:-bottom-1 group-hover:-right-1 group-active:bottom-0 group-active:right-0 -z-10"
          style={{ overflow: "visible" }}
        />
      </div>

      <SelectContent className="shadow-lg shadow-black/5 dark:shadow-black/20 border border-border">
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="vi">Tiếng Việt</SelectItem>
      </SelectContent>
    </Select>
  );
}
