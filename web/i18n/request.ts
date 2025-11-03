import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

export default getRequestConfig(async () => {
  const h = await headers();
  const locale = h.get("X-NEXT-INTL-LOCALE") ?? "en";
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
