import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Geist, Geist_Mono, Comfortaa } from "next/font/google";
import "./globals.css";
import "@/styles/input-selection.css";
import { ThemeProvider } from "@/common/contexts/ThemeContext";
import ReduxProvider from "@/common/contexts/ReduxProvider";
import AuthRestorer from "@/common/contexts/AuthRestorer";
import { NotificationContainer } from "@/common/components/NotificationContainer";
import ClientOnly from "@/common/contexts/ClientOnly";
import { WebSocketDebugger } from "@/components/WebSocketDebugger";
import ErrorBoundary from "@/common/components/ErrorBoundary";

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quiz Online ",
  description: "Quiz Online - Learn and have fun",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Gasoek+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${comfortaa.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider>
              <ReduxProvider>
                <AuthRestorer>{children}</AuthRestorer>
                <NotificationContainer />
                <ClientOnly>{/* <WebSocketDebugger /> */}</ClientOnly>
              </ReduxProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
