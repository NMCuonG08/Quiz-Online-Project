import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

export default getRequestConfig(async () => {
  const h = await headers();
  const locale = h.get("X-NEXT-INTL-LOCALE") ?? "en";
  return {
    locale,
    messages: (await import(`@i18n/messages/${locale}.json`)).default,
  };
});
