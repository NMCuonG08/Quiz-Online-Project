import Breadcrumb from "@/modules/admin/common/components/Breadcrumb";
import { InvoiceTable } from "@/modules/admin/common/components/invoice-table";
import { TopChannels } from "@/modules/admin/common/components/top-channels";
import { TopChannelsSkeleton } from "@/modules/admin/common/components/top-channels/skeleton";
import { TopProducts } from "@/modules/admin/common/components/top-products";
import { TopProductsSkeleton } from "@/modules/admin/common/components/top-products/skeleton";

import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tables",
};

const TablesPage = () => {
  return (
    <>
      <Breadcrumb pageName="Tables" />

      <div className="space-y-10">
        <Suspense fallback={<TopChannelsSkeleton />}>
          <TopChannels />
        </Suspense>

        <Suspense fallback={<TopProductsSkeleton />}>
          <TopProducts />
        </Suspense>

        <InvoiceTable />
      </div>
    </>
  );
};

export default TablesPage;
