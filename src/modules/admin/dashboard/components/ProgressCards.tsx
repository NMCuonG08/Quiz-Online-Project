import React from "react";
import { Card, CardContent } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { MoreVertical, Palette, MessageSquare, Building } from "lucide-react";

const ProgressCards: React.FC = () => {
  const progressData = [
    {
      id: 1,
      title: "UI/UX Design",
      progress: { completed: 2, total: 8 },
      icon: Palette,
      color: "bg-purple-500",
      category: "Design",
    },
    {
      id: 2,
      title: "Branding",
      progress: { completed: 3, total: 8 },
      icon: MessageSquare,
      color: "bg-pink-500",
      category: "Marketing",
    },
    {
      id: 3,
      title: "Front End",
      progress: { completed: 6, total: 12 },
      icon: Building,
      color: "bg-blue-500",
      category: "Development",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {progressData.map((item) => {
        const IconComponent = item.icon;
        const progressPercentage =
          (item.progress.completed / item.progress.total) * 100;

        return (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg ${item.color}`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {item.title}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {item.category}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">
                    {item.progress.completed}/{item.progress.total}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color.replace(
                      "bg-",
                      "bg-"
                    )}`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>

                <p className="text-xs text-gray-500">
                  {item.progress.completed} of {item.progress.total} lessons
                  completed
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProgressCards;
