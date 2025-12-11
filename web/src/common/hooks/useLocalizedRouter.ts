import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { detectLocaleFromPath, withLocalePrefix } from "@/lib/locale";

type NavigateOptions = Parameters<ReturnType<typeof useRouter>["push"]>[1];

export function useLocalizedRouter() {
  const router = useRouter();
  const pathname = usePathname();

  const locale = useMemo(
    () => detectLocaleFromPath(pathname ?? "/"),
    [pathname]
  );

  const prefix = (href: string): string => {
    if (typeof href !== "string") return href;
    return withLocalePrefix(href, { pathname, locale });
  };

  return {
    ...router,
    push: (href: string, options?: NavigateOptions) =>
      router.push(prefix(href), options),
    replace: (href: string, options?: NavigateOptions) =>
      router.replace(prefix(href), options),
    locale,
    pathname,
    prefixPath: prefix,
  };
}
