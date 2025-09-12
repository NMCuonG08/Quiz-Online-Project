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
  FileText,
  Eye,
  Heart,
  MessageSquare,
  Clock,
  Star,
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
  <Card className="h-full">
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

const ProductStats = () => {
  const stats = [
    {
      title: "Tổng bài viết",
      value: "1,247",
      change: "+15% từ tháng trước",
      isPositive: true,
      icon: <FileText className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Lượt xem",
      value: "45.2K",
      change: "+23% từ tháng trước",
      isPositive: true,
      icon: <Eye className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Lượt thích",
      value: "8.9K",
      change: "+12% từ tháng trước",
      isPositive: true,
      icon: <Heart className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Bình luận",
      value: "2.3K",
      change: "+8% từ tháng trước",
      isPositive: true,
      icon: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Thời gian đọc TB",
      value: "5.2 phút",
      change: "-3% từ tháng trước",
      isPositive: false,
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Bài viết nổi bật",
      value: "23",
      change: "+5% từ tháng trước",
      isPositive: true,
      icon: <Star className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default ProductStats;
