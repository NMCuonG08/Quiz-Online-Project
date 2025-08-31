"use client";   
import React from "react";
import StaffStats from "./components/StaffStats";
import StaffTable from "./components/StaffTable";

const StaffList = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý nhân viên</h1>
        <p className="text-muted-foreground">
          Quản lý và theo dõi thông tin nhân viên trong tổ chức
        </p>
      </div>

      {/* Stats Cards */}
      <StaffStats />

      {/* Staff Table */}
      <StaffTable />
    </div>
  );
};

export default StaffList;
