import type { Metadata } from "next";
import ClientLayout from "@/modules/client/common/layouts/ClientLayout";

export const metadata: Metadata = {
  title: "Quiz Online ",
  description: "Quiz Online - Learn and have fun",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ClientLayout>{children}</ClientLayout>;
}
