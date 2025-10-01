"use client";

import { useIsMobile } from "@/common/hooks/use-mobile";
import { useTheme } from "next-themes";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

type PropsType = {
  data: {
    received: { x: unknown; y: number }[];
    due: { x: unknown; y: number }[];
  };
};

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export function PaymentsOverviewChart({ data }: PropsType) {
  const isMobile = useIsMobile();
  const { theme } = useTheme();

  const options: ApexOptions = {
    legend: {
      show: false,
    },
    colors: ["#5750F1", "#0ABEF9"],
    chart: {
      height: 310,
      type: "area",
      toolbar: {
        show: false,
      },
      fontFamily: "inherit",
    },
    fill: {
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 300,
          },
        },
      },
      {
        breakpoint: 1366,
        options: {
          chart: {
            height: 320,
          },
        },
      },
    ],
    stroke: {
      curve: "smooth",
      width: isMobile ? 2 : 3,
    },
    grid: {
      strokeDashArray: 5,
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      marker: {
        show: true,
      },
    },
    xaxis: {
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: theme === "dark" ? "#ffffff" : "#6B7280",
          fontSize: "12px",
          fontFamily: "inherit",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: theme === "dark" ? "#ffffff" : "#6B7280",
          fontSize: "12px",
          fontFamily: "inherit",
        },
      },
    },
  };

  return (
    <div className="-ml-4 -mr-5 h-[310px] dark:text-white">
      <Chart
        options={options}
        series={[
          {
            name: "Received",
            data: data.received,
          },
          {
            name: "Due",
            data: data.due,
          },
        ]}
        type="area"
        height={310}
      />
    </div>
  );
}
