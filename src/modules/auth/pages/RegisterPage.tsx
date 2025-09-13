import React from "react";
import RegisterBanner from "@/modules/auth/components/RegisterBanner";
import RegisterForm from "@/modules/auth/components/RegisterForm";

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex w-full">
      <RegisterBanner />
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
