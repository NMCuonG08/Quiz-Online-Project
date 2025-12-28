"use client";

import React from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/common/i18n/navigation";
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

  const onValueChange = (nextLocale: string) => {
    router.replace(pathname, { locale: nextLocale as "en" | "vi" });
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
