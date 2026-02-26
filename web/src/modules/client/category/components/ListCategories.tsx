"use client";
import React, { useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/common/components/ui/carousel";
import Image from "next/image";
import { LocalizedLink } from "@/common/components/ui";
import type { Category } from "../services/category.service";
import { useCategory } from "../hooks/useCategory";
import { useTranslations } from "next-intl";

// Fallback data nếu API chưa có dữ liệu
const fallbackCategories: Category[] = [
  {
    id: 1,
    name: "Toán học",
    slug: "toan-hoc",
    icon_url: "/categories/cate1.png",
    description: "Các bài quiz về toán học cơ bản và nâng cao",
  },
  {
    id: 2,
    name: "Vật lý",
    slug: "vat-ly",
    icon_url: "/categories/cate2.png",
    description: "Kiến thức vật lý từ cơ bản đến chuyên sâu",
  },
  {
    id: 3,
    name: "Hóa học",
    slug: "hoa-hoc",
    icon_url: "/categories/cate3.png",
    description: "Các chủ đề hóa học thú vị và bổ ích",
  },
  {
    id: 4,
    name: "Lịch sử",
    slug: "lich-su",
    icon_url: "/categories/cate4.png",
    description: "Khám phá lịch sử Việt Nam và thế giới",
  },
  {
    id: 5,
    name: "Địa lý",
    slug: "dia-ly",
    icon_url: "/categories/cate5.png",
    description: "Kiến thức địa lý tự nhiên và xã hội",
  },
  {
    id: 6,
    name: "Văn học",
    slug: "van-hoc",
    icon_url: "/categories/cate6.png",
    description: "Tác phẩm văn học và ngôn ngữ",
  },
  {
    id: 7,
    name: "Văn học",
    slug: "van-hoc",
    icon_url: "/categories/cate7.png",
    description: "Tác phẩm văn học và ngôn ngữ",
  },
  {
    id: 8,
    name: "Văn học",
    slug: "van-hoc",
    icon_url: "/categories/cate8.png",
    description: "Tác phẩm văn học và ngôn ngữ",
  },
];

const CategoryCarousel = () => {
  const { categories, loading, error, getCategories } = useCategory();
  const t = useTranslations("listCategories");

  // Fetch categories khi component mount
  useEffect(() => {
    getCategories();
  }, [getCategories]);

  // Sử dụng dữ liệu từ Redux hoặc fallback data
  const displayCategories: Category[] =
    categories.length > 0 ? (categories as Category[]) : fallbackCategories;

  // Xử lý lỗi ảnh - fallback về ảnh mặc định
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = "/categories/cate1.png";
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-center mb-2">{t("title")}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
          {t("subtitle")}
        </p>
        {loading && (
          <p className="text-center text-sm text-blue-600 dark:text-blue-400">
            {t("loading")}
          </p>
        )}
        {error && (
          <p className="text-center text-sm text-red-600 dark:text-red-400">
            {t("error", { message: String(error) })}
          </p>
        )}
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {displayCategories.map((category: Category) => (
            <CarouselItem
              key={category.id}
              className="pl-2 md:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
            >
              <LocalizedLink
                href={`/category/${category.slug}`}
                className="block text-center"
              >
                <div className="relative mx-auto mb-2 w-14 h-14 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center">
                  {category.icon_url ? (
                    <Image
                      src={category.icon_url}
                      alt={category.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                      <div className="text-gray-500 dark:text-gray-400 text-lg">
                        📚
                      </div>
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-sm text-center">
                  {category.name}
                </h3>
              </LocalizedLink>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

const ListCategories = () => {
  return <CategoryCarousel />;
};

export default ListCategories;
