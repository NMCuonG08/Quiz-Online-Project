import { PaymentsOverview } from "@/modules/admin/dashboard/components/payments-overview";
import { UsedDevices } from "@/modules/admin/dashboard/components/used-devices";
import { WeeksProfit } from "@/modules/admin/dashboard/components/weeks-profit";
import { createTimeFrameExtractor } from "@/utils/timeframe-extractor";
import { Suspense } from "react";
import { ChatsCard } from "@/modules/admin/dashboard/components/chats-card";
import { OverviewCardsGroup } from "@/modules/admin/dashboard/components/overview-cards";
import { OverviewCardsSkeleton } from "@/modules/admin/dashboard/components/overview-cards/skeleton";
import { RegionLabels } from "@/modules/admin/dashboard/components/region-labels";
import { RecentQuizzes } from "@/modules/admin/dashboard/components/recent-quizzes";
import { RecentUsers } from "@/modules/admin/dashboard/components/recent-users";
import { getDashboardDetailedData } from "@/modules/admin/dashboard/components/fetch";
import { ExportReportButton } from "@/modules/admin/reports/components/ExportButton";

type PropsType = {
  searchParams: Promise<{
    selected_time_frame?: string;
  }>;
};

export default async function Home({ searchParams }: PropsType) {
  const { selected_time_frame } = await searchParams;
  const extractTimeFrame = createTimeFrameExtractor(selected_time_frame);
  const detailedData = await getDashboardDetailedData();

  return (
    <>
      <div className="flex justify-end mb-6">
        <ExportReportButton />
      </div>

      <Suspense fallback={<OverviewCardsSkeleton />}>
        <OverviewCardsGroup />
      </Suspense>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-9 2xl:gap-7.5 dark:text-white">
        <PaymentsOverview
          className="col-span-12 xl:col-span-7"
          key={extractTimeFrame("payments_overview")}
          timeFrame={extractTimeFrame("payments_overview")?.split(":")[1]}
        />

        <WeeksProfit
          key={extractTimeFrame("weeks_profit")}
          timeFrame={extractTimeFrame("weeks_profit")?.split(":")[1]}
          className="col-span-12 xl:col-span-5"
        />

        <UsedDevices
          className="col-span-12 xl:col-span-5"
          key={extractTimeFrame("used_devices")}
          timeFrame={extractTimeFrame("used_devices")?.split(":")[1]}
        />

        <RegionLabels />

        <RecentQuizzes
          data={detailedData.recentQuizzes}
          className="col-span-12 xl:col-span-8"
        />

        <RecentUsers
          data={detailedData.recentUsers}
          className="col-span-12 xl:col-span-4"
        />

        <Suspense fallback={null}>
          <ChatsCard />
        </Suspense>
      </div>
    </>
  );
}
