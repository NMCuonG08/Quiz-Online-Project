import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/common/components/ui/carousel";
import Image from "next/image";
import Link from "next/link";

// Dữ liệu mẫu cho các category
const categories = [
  {
    id: 1,
    name: "Toán học",
    slug: "toan-hoc",
    image: "/icons/icon1.png",
    description: "Các bài quiz về toán học cơ bản và nâng cao",
  },
  {
    id: 2,
    name: "Vật lý",
    slug: "vat-ly",
    image: "/icons/icon2.png",
    description: "Kiến thức vật lý từ cơ bản đến chuyên sâu",
  },
  {
    id: 3,
    name: "Hóa học",
    slug: "hoa-hoc",
    image: "/icons/icon3.png",
    description: "Các chủ đề hóa học thú vị và bổ ích",
  },
  {
    id: 4,
    name: "Lịch sử",
    slug: "lich-su",
    image: "/icons/blue.jpg",
    description: "Khám phá lịch sử Việt Nam và thế giới",
  },
  {
    id: 5,
    name: "Địa lý",
    slug: "dia-ly",
    image: "/icons/green.jpg",
    description: "Kiến thức địa lý tự nhiên và xã hội",
  },
  {
    id: 6,
    name: "Văn học",
    slug: "van-hoc",
    image: "/icons/pink.jpg",
    description: "Tác phẩm văn học và ngôn ngữ",
  },
];

const CategoryCarousel = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-center mb-2">Danh mục Quiz</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
          Chọn chủ đề yêu thích và bắt đầu thử thách
        </p>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {categories.map((category) => (
            <CarouselItem
              key={category.id}
              className="pl-2 md:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
            >
              <Link
                href={`/category/${category.slug}`}
                className="block text-center"
              >
                <div className="relative w-12 h-12 mx-auto mb-2">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-contain"
                    sizes="48px"
                  />
                </div>
                <h3 className="font-medium text-sm text-center">
                  {category.name}
                </h3>
              </Link>
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
