import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
  return {
    locale,
    messages: (await import(`@i18n/messages/${locale}.json`)).default,
  };
});
