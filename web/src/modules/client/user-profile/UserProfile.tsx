import React from "react";
import Profile from "./components/Profile";
import { FriendsList } from "./components/FriendsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/components/ui/tabs";
import { User, Users } from "lucide-react";

const UserProfile = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Trang cá nhân</h1>
        <p className="text-muted-foreground">Quản lý tài khoản, thông tin cơ bản và kết nối bạn bè.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" /> Thông tin chung
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Bạn bè
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Profile />
        </TabsContent>
        <TabsContent value="friends">
          <FriendsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
