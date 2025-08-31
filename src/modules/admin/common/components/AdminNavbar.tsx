"use client";

import React from "react";
import { SidebarTrigger } from "@/common/components/ui/sidebar";
import { Button } from "@/common/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/common/components/ui/tooltip";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/common/components/ui/avatar";
import { Bell, MessageSquare, Settings } from "lucide-react";
import { Span } from "@/common/components/ui";

const AdminNavbar: React.FC = () => {
  return (
    <div className="border-b container mx-auto  bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between gap-3 px-3">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="md:hidden" />
          <div className="text-sm font-semibold">Welcome you</div>
        </div>

        <TooltipProvider>
          <div className="flex items-center gap-5 mr-5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild className="gap-2">
                <Button variant="default" size="icon" aria-label="Messages">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Messages</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="default" size="icon" aria-label="Settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>

            <Button>Cuong</Button>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default AdminNavbar;
