import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon,
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p
        className={`text-xs flex items-center gap-1 ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {change}
      </p>
    </CardContent>
  </Card>
);

const StaffStats = () => {
  const stats = [
    {
      title: "Tổng nhân viên",
      value: "156",
      change: "+12% từ tháng trước",
      isPositive: true,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Nhân viên đang làm việc",
      value: "142",
      change: "+8% từ tháng trước",
      isPositive: true,
      icon: <UserCheck className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Nhân viên nghỉ việc",
      value: "14",
      change: "-2% từ tháng trước",
      isPositive: true,
      icon: <UserX className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Giờ làm việc trung bình",
      value: "168h",
      change: "+5% từ tháng trước",
      isPositive: true,
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StaffStats;
