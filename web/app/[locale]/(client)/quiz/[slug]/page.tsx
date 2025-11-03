import React from "react";
import QuizDetailPage from "@/modules/client/pages/QuizDetailPage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const Page = async ({ params }: PageProps) => {
  const { slug } = await params;
  return <QuizDetailPage slug={slug} />;
};

export default Page;
