"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  EffectCoverflow,
  Navigation,
  Pagination,
  Autoplay,
} from "swiper/modules";

// Styles for Swiper
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";

const Test3 = () => {
  const images = [
    "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=600&h=900&fit=crop",
    "https://images.unsplash.com/photo-1485841890310-6a055c88698a?w=600&h=900&fit=crop",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&h=900&fit=crop",
    "https://images.unsplash.com/photo-1505685296765-3a2736de412f?w=600&h=900&fit=crop",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&h=900&fit=crop",
  ];

  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-black">
      <div
        className="pointer-events-none absolute inset-0 opacity-40 blur-2xl"
        style={{
          backgroundImage: `url(${images[activeIndex]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />

      <div className="relative z-10 flex h-full items-center">
        <Swiper
          modules={[EffectCoverflow, Navigation, Pagination, Autoplay]}
          effect="coverflow"
          centeredSlides
          grabCursor
          loop
          slidesPerView="auto"
          coverflowEffect={{
            rotate: 0,
            stretch: -80,
            depth: 320,
            modifier: 1.6,
            slideShadows: false,
          }}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 2800, disableOnInteraction: false }}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          className="mx-auto w-full px-6"
        >
          {images.map((src, idx) => (
            <SwiperSlide key={idx} className="!w-auto">
              <div
                className="relative overflow-hidden rounded-3xl ring-1 ring-white/10 shadow-2xl"
                style={{
                  height: "86svh",
                  width: "min(92vw, calc(86svh * 0.6667))",
                }}
              >
                <img
                  src={src}
                  alt={`Poster ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default Test3;
