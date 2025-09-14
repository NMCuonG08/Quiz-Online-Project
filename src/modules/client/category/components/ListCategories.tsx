import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/common/components/ui/carousel";
import { Card, CardContent } from "@/common/components/ui/card";
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
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-center mb-2">Danh mục Quiz</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center">
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
              className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <Link href={`/category/${category.slug}`}>
                <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105">
                  <CardContent className="p-0">
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors duration-300">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
};

const ListCategories = () => {
  return <CategoryCarousel />;
};

export default ListCategories;
