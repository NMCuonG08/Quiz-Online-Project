import React from "react";
import DoQuizPage from "@/modules/client/pages/DoQuizPage";

interface PageProps {
  params: {
    slug: string;
  };
}

const Page = ({ params }: PageProps) => {
  return <DoQuizPage slug={params.slug} />;
};

export default Page;
