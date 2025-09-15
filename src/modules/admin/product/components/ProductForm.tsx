import React, { useState, useEffect } from "react";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { Textarea } from "@/common/components/ui/textarea";
import { Switch } from "@/common/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/common/components/ui/dialog";
import { Separator } from "@/common/components/ui/separator";
import { Calendar, Clock, User, Tag, Image as ImageIcon } from "lucide-react";

interface ProductFormData {
  title: string;
  slug: string;
  content: string;
  summary: string;
  thumbnail_url?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  reading_time: number;
  featured: boolean;
  categoryId?: string;
  authorId: string;
  tags: string[];
  published_at?: string;
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productData?: ProductFormData;
  mode: "add" | "edit";
  onSubmit: (data: ProductFormData) => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  open,
  onOpenChange,
  productData,
  mode,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    slug: "",
    content: "",
    summary: "",
    thumbnail_url: "",
    status: "DRAFT",
    reading_time: 5,
    featured: false,
    categoryId: "",
    authorId: "",
    tags: [],
    published_at: "",
  });

  useEffect(() => {
    if (productData && mode === "edit") {
      setFormData(productData);
    } else {
      setFormData({
        title: "",
        slug: "",
        content: "",
        summary: "",
        thumbnail_url: "",
        status: "DRAFT",
        reading_time: 5,
        featured: false,
        categoryId: "",
        authorId: "",
        tags: [],
        published_at: "",
      });
    }
  }, [productData, mode, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  const handleInputChange = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    handleInputChange("title", title);
    if (mode === "add") {
      handleInputChange("slug", generateSlug(title));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Thêm bài viết mới" : "Chỉnh sửa bài viết"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Thông tin cơ bản
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Nhập tiêu đề bài viết"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="url-friendly-slug"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Tóm tắt</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => handleInputChange("summary", e.target.value)}
                placeholder="Tóm tắt ngắn gọn về bài viết..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Nội dung *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                placeholder="Nội dung bài viết..."
                rows={10}
                required
              />
            </div>
          </div>

          <Separator />

          {/* Media & Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="h-4 w-4" />
              Media & Cài đặt
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  value={formData.thumbnail_url}
                  onChange={(e) =>
                    handleInputChange("thumbnail_url", e.target.value)
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reading_time">Thời gian đọc (phút)</Label>
                <Input
                  id="reading_time"
                  type="number"
                  min="1"
                  value={formData.reading_time}
                  onChange={(e) =>
                    handleInputChange("reading_time", parseInt(e.target.value))
                  }
                  placeholder="5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Danh mục</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    handleInputChange("categoryId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontend">
                      Frontend Development
                    </SelectItem>
                    <SelectItem value="programming">Programming</SelectItem>
                    <SelectItem value="nextjs">Next.js</SelectItem>
                    <SelectItem value="state">State Management</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Tác giả *</Label>
                <Select
                  value={formData.authorId}
                  onValueChange={(value) =>
                    handleInputChange("authorId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tác giả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Nguyễn Văn An</SelectItem>
                    <SelectItem value="2">Trần Thị Bình</SelectItem>
                    <SelectItem value="3">Lê Văn Cường</SelectItem>
                    <SelectItem value="4">Phạm Thị Dung</SelectItem>
                    <SelectItem value="5">Hoàng Văn Em</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    handleInputChange(
                      "status",
                      value as ProductFormData["status"]
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Bản nháp</SelectItem>
                    <SelectItem value="PUBLISHED">Xuất bản</SelectItem>
                    <SelectItem value="ARCHIVED">Lưu trữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="published_at">Ngày xuất bản</Label>
                <Input
                  id="published_at"
                  type="datetime-local"
                  value={formData.published_at}
                  onChange={(e) =>
                    handleInputChange("published_at", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  handleInputChange("featured", checked)
                }
              />
              <Label htmlFor="featured">Bài viết nổi bật</Label>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4" />
              Tags
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (phân cách bằng dấu phẩy)</Label>
              <Input
                id="tags"
                value={formData.tags.join(", ")}
                onChange={(e) =>
                  handleInputChange(
                    "tags",
                    e.target.value.split(", ").filter((tag) => tag.trim())
                  )
                }
                placeholder="react, typescript, nextjs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit">
              {mode === "add" ? "Thêm bài viết" : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
