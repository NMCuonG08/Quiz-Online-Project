import React from "react";
import DashBoard from "../dashboard/DashBoard";

type PropsType = {
  searchParams: Promise<{
    selected_time_frame?: string;
  }>;
};

const DashBoardAdminPage = ({ searchParams }: PropsType) => {
  return <DashBoard searchParams={searchParams} />;
};

export default DashBoardAdminPage;
