import DashBoardAdminPage from "@/modules/admin/pages/DashBoardAdminPage";

const page = async ({
  searchParams,
}: {
  searchParams: Promise<{ selected_time_frame?: string }>;
}) => {
  return <DashBoardAdminPage searchParams={searchParams} />;
};

export default page;
