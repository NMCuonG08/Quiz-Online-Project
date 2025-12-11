const SUPPORTED_LOCALES = ["en", "vi"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const DEFAULT_LOCALE: SupportedLocale = "en";

export function detectLocaleFromPath(
  pathname: string,
  defaultLocale: SupportedLocale = DEFAULT_LOCALE
): SupportedLocale {
  const first = pathname.split("/").filter(Boolean)[0];
  return SUPPORTED_LOCALES.includes(first as SupportedLocale)
    ? (first as SupportedLocale)
    : defaultLocale;
}

export function withLocalePrefix(
  path: string,
  opts: { pathname?: string; locale?: SupportedLocale } = {}
): string {
  const { pathname = "", locale } = opts;
  const currentLocale = locale ?? detectLocaleFromPath(pathname);

  if (!path.startsWith("/") || path.startsWith("//")) {
    return path;
  }

  const alreadyPrefixed = SUPPORTED_LOCALES.includes(
    path.split("/").filter(Boolean)[0] as any
  );

  return alreadyPrefixed ? path : `/${currentLocale}${path}`;
}
