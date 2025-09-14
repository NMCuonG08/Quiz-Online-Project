import React from "react";
import LoginPage from "@/modules/auth/pages/LoginPage";
import ClientLayout from "@/modules/client/common/layouts/ClientLayout";

const page = () => {
  return (
    <ClientLayout>
      <LoginPage />
    </ClientLayout>
  );
};

export default page;
