"use client";
import React from "react";
import ProductStats from "./components/ProductStats";
import ProductTable from "./components/ProductTable";

const Product = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý bài viết</h1>
        <p className="text-muted-foreground">
          Quản lý và theo dõi tất cả bài viết trong hệ thống
        </p>
      </div>

      {/* Stats Cards */}
      <ProductStats />

      {/* Product Table */}
      <ProductTable />
    </div>
  );
};

export default Product;
