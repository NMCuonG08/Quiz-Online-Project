import React from "react";
import LoginBanner from "@/modules/auth/components/LoginBanner";
import LoginForm from "@/modules/auth/components/LoginForm";

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex w-full">
      <LoginBanner />
      <LoginForm />
    </div>
  );
};

export default LoginPage;
