import React from "react";
import Image from "next/image";

const BannerForm = () => {
  return (
    <div className="h-full min-h-[600px] relative">
      <Image
        src="/register-banner.png"
        alt="Login Banner"
        fill
        className="object-cover"
        priority
      />
    </div>
  );
};

export default BannerForm;
