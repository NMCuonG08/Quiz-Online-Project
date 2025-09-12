"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
} from "@/common/components/ui/sidebar";
import {
  CreditCard,
  LayoutDashboard,
  SettingsIcon,
  UsersRound,
  Calendar,
  LogOut,
  Proportions,
  ChevronDown,
  Target,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/common/components/ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  Span,
  DropdownMenuContent,
  DropdownMenuItem,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/common/components/ui";

const AdminSidebar: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();

  const handleLogout = () => {
    // Add logout logic here
    console.log("User confirmed logout");
    // You can add your logout function here
    // For example: signOut() or router.push('/login')
  };

  const isActivePath = (currentPath: string, href: string) => {
    if (!currentPath || !href) return false;
    if (currentPath === href) return true;
    // Only match subpaths for non-root admin links
    if (href === "/admin") return false;
    return currentPath.startsWith(href + "/");
  };

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/staff", label: "Staff", icon: UsersRound },
    { href: "/admin/product", label: "Product", icon: Target },
    { href: "/admin/payments", label: "Payments & Invoices", icon: CreditCard },
    { href: "/admin/bookings", label: "Bookings", icon: Calendar },
    { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
    { href: "/admin/procurement", label: "Procurement", icon: Proportions },
  ];

  return (
    <SidebarProvider>
      <Sidebar className="bg-white border-1 border-r-black p-3 ">
        <SidebarHeader>
          <div className="px-2 text-xl font-semibold flex items-center gap-2 mb-3">
            {" "}
            <Image src="/lily.png" alt="Olando Admin" width={40} height={40} />
            Olando
          </div>
        </SidebarHeader>
        <div className="flex justify-center items-center m-4 ">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Span className="group bg-white w-60 max-h-12 border-2 border-black rounded-md p-3 flex items-center gap-2 hover:bg-gray-50">
                <Image
                  src="/avatar.jpg"
                  alt="Olando Admin"
                  width={30}
                  height={30}
                  className="rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <span className="block truncate" title="Cuong">
                    Cuong
                  </span>
                </div>
                <ChevronDown className="size-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </Span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
              <DropdownMenuItem onClick={() => alert("Option 1 selected")}>
                Option 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert("Option 2 selected")}>
                Option 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert("Option 3 selected")}>
                Option 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActivePath(pathname, item.href)}
                      className="data-[active=true]:bg-neutral-900 data-[active=true]:text-white hover:bg-neutral-800 hover:text-white"
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-2"
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="w-full flex justify-between border-t-1 pt-2 border-gray-950 items-center">
            <div className="text-xs text-muted-foreground px-2">v1.0.0</div>
            <div className="text-xs text-muted-foreground px-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <LogOut />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>
                      Đăng xuất
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
};

export default AdminSidebar;
