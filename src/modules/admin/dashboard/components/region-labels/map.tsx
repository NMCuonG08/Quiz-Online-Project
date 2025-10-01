"use client";

import jsVectorMap from "jsvectormap";
import { useEffect, useRef } from "react";

import "@/common/styles/js/us-aea-en";

export default function Map() {
  const mapRef = useRef<jsVectorMap | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Chỉ khởi tạo map một lần duy nhất
    if (!isInitialized.current) {
      isInitialized.current = true;

      mapRef.current = new jsVectorMap({
        selector: "#mapOne",
        map: "us_aea_en",
        zoomButtons: true,
        regionStyle: {
          initial: {
            fill: "#C8D0D8",
          },
          hover: {
            fillOpacity: 1,
            fill: "#3056D3",
          },
        },
        regionLabelStyle: {
          initial: {
            fontWeight: "semibold",
            fill: "#fff",
          },
          hover: {
            cursor: "pointer",
          },
        },
        labels: {
          regions: {
            render(code: string) {
              return code.split("-")[1];
            },
          },
        },
      });
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        try {
          // Destroy the map instance if it has a destroy method
          if (typeof mapRef.current.destroy === "function") {
            mapRef.current.destroy();
          }
          mapRef.current = null;
        } catch (error) {
          console.warn("Error destroying map:", error);
        }
      }
    };
  }, []);

  return (
    <div className="h-[422px]">
      <div id="mapOne" className="mapOne map-btn" />
    </div>
  );
}
