import React from "react";
import { Avatar } from "@/common/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Progress } from "@/common/components/ui/progress";

const UserSidebar: React.FC = () => {
  // Mock data
  const user = {
    name: "Jason Ranti",
    avatar: "/avatar.jpg",
    email: "jason.ranti@example.com",
    progress: 32,
    friends: [
      {
        id: 1,
        name: "Padhang Satrio",
        avatar: "/avatar.jpg",
        status: "online",
      },
      {
        id: 2,
        name: "Zakir Horizontal",
        avatar: "/avatar.jpg",
        status: "offline",
      },
      {
        id: 3,
        name: "Leonardo Samsul",
        avatar: "/avatar.jpg",
        status: "online",
      },
      { id: 4, name: "Bayu Salto", avatar: "/avatar.jpg", status: "away" },
    ],
  };

  const stats = [
    { label: "Courses Completed", value: 12, total: 20 },
    { label: "Hours Studied", value: 156, total: 200 },
    { label: "Certificates", value: 8, total: 15 },
  ];

  return (
    <div className="p-6 space-y-6 w-full">
      {/* User Profile */}
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <img src={user.avatar} alt={user.name} />
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <Badge variant="secondary" className="mt-1">
                Premium Member
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Learning Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">
                  {user.progress}%
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Overall Progress</p>
          </div>

          <div className="space-y-3">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{stat.label}</span>
                  <span>
                    {stat.value}/{stat.total}
                  </span>
                </div>
                <Progress
                  value={(stat.value / stat.total) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Friends List */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Friends & Mentors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {user.friends.map((friend) => (
              <div key={friend.id} className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <img src={friend.avatar} alt={friend.name} />
                  </Avatar>
                  <div
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      friend.status === "online"
                        ? "bg-green-500"
                        : friend.status === "away"
                        ? "bg-yellow-500"
                        : "bg-gray-400"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{friend.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {friend.status}
                  </p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm flex-shrink-0">
                  Message
                </button>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All Friends
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSidebar;
