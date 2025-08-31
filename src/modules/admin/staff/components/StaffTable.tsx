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
import StaffForm from "./StaffForm";

interface Staff {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  status: "active" | "inactive" | "on_leave";
  avatar?: string;
  phone: string;
  joinDate: string;
}

const StaffTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Mock data
  const staffData: Staff[] = [
    {
      id: "1",
      name: "Nguyễn Văn An",
      email: "an.nguyen@company.com",
      position: "Senior Developer",
      department: "IT",
      status: "active",
      phone: "0123456789",
      joinDate: "2023-01-15",
    },
    {
      id: "2",
      name: "Trần Thị Bình",
      email: "binh.tran@company.com",
      position: "Product Manager",
      department: "Product",
      status: "active",
      phone: "0987654321",
      joinDate: "2022-08-20",
    },
    {
      id: "3",
      name: "Lê Văn Cường",
      email: "cuong.le@company.com",
      position: "UI/UX Designer",
      department: "Design",
      status: "on_leave",
      phone: "0123456788",
      joinDate: "2023-03-10",
    },
    {
      id: "4",
      name: "Phạm Thị Dung",
      email: "dung.pham@company.com",
      position: "Marketing Specialist",
      department: "Marketing",
      status: "active",
      phone: "0123456787",
      joinDate: "2022-11-05",
    },
    {
      id: "5",
      name: "Hoàng Văn Em",
      email: "em.hoang@company.com",
      position: "Sales Representative",
      department: "Sales",
      status: "inactive",
      phone: "0123456786",
      joinDate: "2021-06-12",
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Đang làm việc", variant: "default" as const },
      inactive: { label: "Nghỉ việc", variant: "destructive" as const },
      on_leave: { label: "Nghỉ phép", variant: "secondary" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const filteredStaff = staffData.filter(
    (staff) =>
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    // Implement export functionality
    console.log("Exporting staff data...");
  };

  const handleEdit = (staffId: string) => {
    const staff = staffData.find((s) => s.id === staffId);
    if (staff) {
      setSelectedStaff(staff);
      setFormMode("edit");
      setFormOpen(true);
    }
  };

  const handleDelete = (staffId: string) => {
    console.log("Deleting staff:", staffId);
  };

  const handleAddStaff = () => {
    setSelectedStaff(null);
    setFormMode("add");
    setFormOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    if (formMode === "add") {
      console.log("Adding new staff:", data);
    } else {
      console.log("Updating staff:", data);
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
              placeholder="Tìm kiếm nhân viên..."
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
                <DialogTitle>Lọc nhân viên</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Phòng ban</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phòng ban" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="active">Đang làm việc</SelectItem>
                      <SelectItem value="inactive">Nghỉ việc</SelectItem>
                      <SelectItem value="on_leave">Nghỉ phép</SelectItem>
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

          <Button size="sm" onClick={handleAddStaff}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Vị trí</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Ngày vào làm</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.map((staff) => (
              <TableRow key={staff.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={staff.avatar} />
                      <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{staff.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {staff.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{staff.position}</TableCell>
                <TableCell>{staff.department}</TableCell>
                <TableCell>{getStatusBadge(staff.status)}</TableCell>
                <TableCell>{staff.phone}</TableCell>
                <TableCell>
                  {new Date(staff.joinDate).toLocaleDateString("vi-VN")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(staff.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(staff.id)}
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
          Hiển thị {filteredStaff.length} trong tổng số {staffData.length} nhân
          viên
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

      {/* Staff Form Modal */}
      <StaffForm
        open={formOpen}
        onOpenChange={setFormOpen}
        staffData={selectedStaff || undefined}
        mode={formMode}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default StaffTable;
