"use client";
import React from "react";
import { useIsMobile } from "@/common/hooks/use-mobile";
import dynamic from "next/dynamic";

const NavBarMobile = dynamic(() => import("./NavBarMobile"), { ssr: false });
const NavBarLaptop = dynamic(() => import("./NavBarLaptop"), { ssr: false });

const NavBar = () => {
  const isMobile = useIsMobile();
  return isMobile ? <NavBarMobile /> : <NavBarLaptop />;
};

export default NavBar;
