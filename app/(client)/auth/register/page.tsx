import React from "react";
import RegisterPage from "@/modules/auth/pages/RegisterPage";
import ClientLayout from "@/modules/client/common/layouts/ClientLayout";

export default function Register() {
  return (
    <ClientLayout>
      <RegisterPage />
    </ClientLayout>
  );
}
