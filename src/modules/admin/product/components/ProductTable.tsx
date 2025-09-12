import React, { useState } from "react";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import { Badge } from "@/common/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/common/components/ui/avatar";
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Heart,
  MessageSquare,
  Star,
  Calendar,
  User,
  FileText,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/common/components/ui/dialog";
import { Label } from "@/common/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import ProductForm from "./ProductForm";

interface Product {
  id: string;
  title: string;
  slug: string;
  summary: string;
  thumbnail_url?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  views_count: number;
  likes_count: number;
  comments_count: number;
  reading_time: number;
  featured: boolean;
  created_at: string;
  published_at?: string;
  author: {
    name: string;
    avatar?: string;
  };
  category?: {
    name: string;
  };
}

const ProductTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Mock data
  const productData: Product[] = [
    {
      id: "1",
      title: "Hướng dẫn React Hooks cho người mới bắt đầu",
      slug: "huong-dan-react-hooks",
      summary:
        "Bài viết chi tiết về cách sử dụng React Hooks trong dự án thực tế...",
      thumbnail_url: "https://via.placeholder.com/150x100",
      status: "PUBLISHED",
      views_count: 15420,
      likes_count: 892,
      comments_count: 156,
      reading_time: 8,
      featured: true,
      created_at: "2024-01-15T10:30:00Z",
      published_at: "2024-01-16T09:00:00Z",
      author: {
        name: "Nguyễn Văn An",
        avatar: "https://via.placeholder.com/40x40",
      },
      category: {
        name: "Frontend Development",
      },
    },
    {
      id: "2",
      title: "TypeScript Best Practices 2024",
      slug: "typescript-best-practices-2024",
      summary:
        "Những practices tốt nhất khi sử dụng TypeScript trong năm 2024...",
      thumbnail_url: "https://via.placeholder.com/150x100",
      status: "PUBLISHED",
      views_count: 8920,
      likes_count: 456,
      comments_count: 89,
      reading_time: 12,
      featured: false,
      created_at: "2024-01-10T14:20:00Z",
      published_at: "2024-01-12T08:30:00Z",
      author: {
        name: "Trần Thị Bình",
        avatar: "https://via.placeholder.com/40x40",
      },
      category: {
        name: "Programming",
      },
    },
    {
      id: "3",
      title: "Next.js 14 App Router Deep Dive",
      slug: "nextjs-14-app-router",
      summary:
        "Khám phá sâu về App Router trong Next.js 14 và cách tối ưu hóa...",
      thumbnail_url: "https://via.placeholder.com/150x100",
      status: "DRAFT",
      views_count: 0,
      likes_count: 0,
      comments_count: 0,
      reading_time: 15,
      featured: false,
      created_at: "2024-01-20T16:45:00Z",
      author: {
        name: "Lê Văn Cường",
        avatar: "https://via.placeholder.com/40x40",
      },
      category: {
        name: "Next.js",
      },
    },
    {
      id: "4",
      title: "State Management với Zustand",
      slug: "state-management-zustand",
      summary: "So sánh Zustand với Redux và cách implement trong dự án...",
      thumbnail_url: "https://via.placeholder.com/150x100",
      status: "PUBLISHED",
      views_count: 6780,
      likes_count: 234,
      comments_count: 45,
      reading_time: 10,
      featured: true,
      created_at: "2024-01-08T11:15:00Z",
      published_at: "2024-01-09T10:00:00Z",
      author: {
        name: "Phạm Thị Dung",
        avatar: "https://via.placeholder.com/40x40",
      },
      category: {
        name: "State Management",
      },
    },
    {
      id: "5",
      title: "Performance Optimization trong React",
      slug: "react-performance-optimization",
      summary: "Các kỹ thuật tối ưu hóa hiệu suất cho ứng dụng React...",
      thumbnail_url: "https://via.placeholder.com/150x100",
      status: "ARCHIVED",
      views_count: 3420,
      likes_count: 123,
      comments_count: 23,
      reading_time: 18,
      featured: false,
      created_at: "2023-12-15T09:30:00Z",
      published_at: "2023-12-16T08:00:00Z",
      author: {
        name: "Hoàng Văn Em",
        avatar: "https://via.placeholder.com/40x40",
      },
      category: {
        name: "Performance",
      },
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PUBLISHED: { label: "Đã xuất bản", variant: "default" as const },
      DRAFT: { label: "Bản nháp", variant: "secondary" as const },
      ARCHIVED: { label: "Đã lưu trữ", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const filteredProducts = productData.filter(
    (product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.author.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    console.log("Exporting product data...");
  };

  const handleEdit = (productId: string) => {
    const product = productData.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setFormMode("edit");
      setFormOpen(true);
    }
  };

  const handleDelete = (productId: string) => {
    console.log("Deleting product:", productId);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setFormMode("add");
    setFormOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    if (formMode === "add") {
      console.log("Adding new product:", data);
    } else {
      console.log("Updating product:", data);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with search and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bài viết..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-80"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Lọc
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lọc bài viết</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Trạng thái</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
                      <SelectItem value="DRAFT">Bản nháp</SelectItem>
                      <SelectItem value="ARCHIVED">Đã lưu trữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Danh mục</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="frontend">
                        Frontend Development
                      </SelectItem>
                      <SelectItem value="programming">Programming</SelectItem>
                      <SelectItem value="nextjs">Next.js</SelectItem>
                      <SelectItem value="state">State Management</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nổi bật</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tùy chọn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="featured">Chỉ bài nổi bật</SelectItem>
                      <SelectItem value="not-featured">
                        Không nổi bật
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Xuất
          </Button>

          <Button size="sm" onClick={handleAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm bài viết
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bài viết</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thống kê</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-12 rounded-md overflow-hidden bg-gray-100">
                      {product.thumbnail_url ? (
                        <img
                          src={product.thumbnail_url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FileText className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium truncate">
                          {product.title}
                        </div>
                        {product.featured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {product.summary}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {product.reading_time} phút
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {product.published_at
                            ? formatDate(product.published_at)
                            : "Chưa xuất bản"}
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={product.author.avatar} />
                      <AvatarFallback>
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{product.author.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {product.category?.name || "Không phân loại"}
                </TableCell>
                <TableCell>{getStatusBadge(product.status)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs">
                      <Eye className="h-3 w-3" />
                      {formatNumber(product.views_count)}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Heart className="h-3 w-3" />
                      {formatNumber(product.likes_count)}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <MessageSquare className="h-3 w-3" />
                      {formatNumber(product.comments_count)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatDate(product.created_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(product.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Hiển thị {filteredProducts.length} trong tổng số {productData.length}{" "}
          bài viết
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Trước
          </Button>
          <Button variant="outline" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            3
          </Button>
          <Button variant="outline" size="sm">
            Sau
          </Button>
        </div>
      </div>

      {/* Product Form Modal */}
      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        productData={selectedProduct || undefined}
        mode={formMode}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default ProductTable;
