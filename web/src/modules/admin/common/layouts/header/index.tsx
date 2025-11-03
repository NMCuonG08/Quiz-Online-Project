"use client";

import { SearchIcon } from "../../components/icons";
import Image from "next/image";
import Link from "next/link";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import { LanguageSwitcher } from "@/common/components/ui";
import { useLocale, useTranslations } from "next-intl";

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const withLocale = (href: string) =>
    href.startsWith("/") ? `/${locale}${href}` : href;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke  dark:bg-[#122031] bg-white px-4 py-5 shadow-1 dark:border-stroke-dark dark:bg-[#122031] md:px-5 2xl:px-10">
      <button
        onClick={toggleSidebar}
        className="rounded-lg border px-1.5 py-1 dark:border-stroke-dark dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A] lg:hidden"
      >
        <MenuIcon />
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      {isMobile && (
        <Link
          href={withLocale("/")}
          className="ml-2 max-[430px]:hidden min-[375px]:ml-4"
        >
          <Image
            src={"/images/logo/logo-icon.png"}
            width={32}
            height={32}
            alt=""
            role="presentation"
          />
        </Link>
      )}

      <div className="max-xl:hidden">
        <h1 className="mb-0.5 text-heading-5 font-bold text-dark dark:text-white">
          {tNav("dashboard")}
        </h1>
        <p className="font-medium">{tCommon("adminSubtitle")}</p>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 min-[375px]:gap-4">
        <div className="relative w-full max-w-[300px]">
          <input
            type="search"
            placeholder={tCommon("search")}
            className="flex w-full items-center gap-3.5 rounded-full border bg-gray-2 py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-[#122031] dark:hover:border-dark-4 dark:hover:bg-[#122031]  dark:hover:text-dark-6 dark:focus-visible:border-primary"
          />

          <SearchIcon className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 max-[1015px]:size-5" />
        </div>

        <LanguageSwitcher />
        <ThemeToggleSwitch />

        <Notification />

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
