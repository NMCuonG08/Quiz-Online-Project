import type { Metadata } from "next";
import { Geist, Geist_Mono, Comfortaa } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/common/contexts/ThemeContext";
import ReduxProvider from "@/common/contexts/ReduxProvider";
import AuthRestorer from "@/common/contexts/AuthRestorer";
import { NotificationContainer } from "@/common/components/NotificationContainer";
import ClientOnly from "@/common/contexts/ClientOnly";
import { WebSocketDebugger } from "@/components/WebSocketDebugger";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Gasoek+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${comfortaa.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ReduxProvider>
            <AuthRestorer>{children}</AuthRestorer>
            <NotificationContainer />
            <ClientOnly>{/* <WebSocketDebugger /> */}</ClientOnly>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
