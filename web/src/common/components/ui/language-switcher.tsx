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
        <SelectTrigger className="h-9 w-[120px] relative z-10 rounded-lg border-border bg-card text-foreground shadow-sm">
          <SelectValue aria-label="Language selector" />
        </SelectTrigger>
        <div
          className="hidden"
          style={{ overflow: "visible" }}
        />
      </div>

      <SelectContent className="rounded-lg border-border bg-popover shadow-lg shadow-black/10">
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="vi">Tiếng Việt</SelectItem>
      </SelectContent>
    </Select>
  );
}
