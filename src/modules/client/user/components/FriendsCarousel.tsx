"use client";

import React from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/common/components/ui/carousel";

type Friend = {
  id: string;
  name: string;
  avatar?: string | null;
};

const mockFriends: Friend[] = [
  { id: "f1", name: "Alex", avatar: "/icons/icon1.png" },
  { id: "f2", name: "Sam", avatar: "/icons/icon2.png" },
  { id: "f3", name: "Jamie", avatar: "/icons/icon3.png" },
  { id: "f4", name: "Taylor", avatar: null },
  { id: "f5", name: "Dana", avatar: "/icons/icon2.png" },
  { id: "f6", name: "Chris", avatar: "/icons/icon1.png" },
];

const FriendsCarousel = () => {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">My Friends</h2>
        <button className="text-xs text-muted-foreground hover:underline">
          See All
        </button>
      </div>

      <Carousel
        className="w-full"
        opts={{
          dragFree: true,
          containScroll: "trimSnaps",
        }}
      >
        <CarouselContent className="-ml-2">
          {mockFriends.map((friend) => {
            const src = friend.avatar || "/avatar.jpg"; // default fallback
            return (
              <CarouselItem
                key={friend.id}
                className="pl-2 basis-[20%] sm:basis-[16%] md:basis-[12.5%] lg:basis-[11%]"
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden ring-2 ring-border/60 bg-muted">
                    <Image
                      src={src}
                      alt={friend.name}
                      fill
                      className="object-cover"
                      sizes="44px"
                      priority={false}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-16">
                    {friend.name}
                  </span>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default FriendsCarousel;
