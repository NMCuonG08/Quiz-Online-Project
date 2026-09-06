"use client";

import React from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/common/components/ui/carousel";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";

type Friend = {
  id: string;
  name: string;
  avatar?: string | null;
};

const FriendsCarousel = () => {
  const router = useLocalizedRouter();
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    let active = true;
    apiClient.get(apiRoutes.FRIENDSHIPS.FRIENDS).then((response) => {
      const items = response.data?.data ?? response.data ?? [];
      if (active) setFriends(items.map((item: any) => {
        const friend = item.friend ?? item;
        return { id: friend.id, name: friend.full_name || friend.username || "Bạn", avatar: friend.avatar };
      }));
    }).catch(() => { if (active) setFriends([]); });
    return () => { active = false; };
  }, []);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">My Friends</h2>
        <button onClick={() => router.push("/user/profile?tab=friends")} className="text-xs text-muted-foreground hover:underline">
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
          {friends.map((friend) => {
            const src = friend.avatar || "/avatar.jpg"; // default fallback
            return (
              <CarouselItem
                key={friend.id}
                className="pl-2 basis-[20%] sm:basis-[16%] md:basis-[12.5%] lg:basis-[11%]"
              >
                <button className="flex flex-col items-center gap-1" onClick={() => router.push(`/users/${friend.id}`)}>
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
                </button>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
      {friends.length === 0 && <p className="text-sm text-muted-foreground">Chưa có bạn bè. Hãy tìm và kết nối với bạn học.</p>}
    </section>
  );
};

export default FriendsCarousel;
