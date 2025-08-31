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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/common/components/ui/dialog";

interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: "active" | "inactive" | "on_leave";
  address?: string;
  joinDate: string;
}

interface StaffFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffData?: StaffFormData;
  mode: "add" | "edit";
  onSubmit: (data: StaffFormData) => void;
}

const StaffForm: React.FC<StaffFormProps> = ({
  open,
  onOpenChange,
  staffData,
  mode,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<StaffFormData>({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    status: "active",
    address: "",
    joinDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (staffData && mode === "edit") {
      setFormData(staffData);
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        position: "",
        department: "",
        status: "active",
        address: "",
        joinDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [staffData, mode, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  const handleInputChange = (field: keyof StaffFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Thêm nhân viên mới" : "Chỉnh sửa nhân viên"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nhập họ và tên"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="example@company.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="0123456789"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="joinDate">Ngày vào làm *</Label>
              <Input
                id="joinDate"
                type="date"
                value={formData.joinDate}
                onChange={(e) => handleInputChange("joinDate", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Vị trí *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                placeholder="Nhập vị trí công việc"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Phòng ban *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  handleInputChange("department", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                handleInputChange("status", value as any)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang làm việc</SelectItem>
                <SelectItem value="inactive">Nghỉ việc</SelectItem>
                <SelectItem value="on_leave">Nghỉ phép</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Nhập địa chỉ"
              rows={3}
            />
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
              {mode === "add" ? "Thêm nhân viên" : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StaffForm;
