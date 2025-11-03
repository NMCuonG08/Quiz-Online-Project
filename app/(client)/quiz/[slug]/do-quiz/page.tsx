import React from "react";
import DoQuizPage from "@/modules/client/pages/DoQuizPage";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  const { slug } = await params;
  return <DoQuizPage slug={slug} />;
};

export default Page;
