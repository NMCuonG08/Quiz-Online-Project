import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/common/contexts/ThemeContext";
import ReduxProvider from "@/common/contexts/ReduxProvider";
import AuthRestorer from "@/common/contexts/AuthRestorer";
import ClientLayout from "@/modules/client/common/layouts/ClientLayout";

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <ReduxProvider>
        <AuthRestorer>
          <ClientLayout>{children}</ClientLayout>
        </AuthRestorer>
      </ReduxProvider>
    </ThemeProvider>
  );
}
