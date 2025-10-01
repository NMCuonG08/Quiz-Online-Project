import Breadcrumb from "@/modules/admin/common/components/Breadcrumb";
import CalendarBox from "@/modules/admin/common/components/CalendarBox";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calender Page",
  // other metadata
};

const CalendarPage = () => {
  return (
    <>
      <Breadcrumb pageName="Calendar" />

      <CalendarBox />
    </>
  );
};

export default CalendarPage;
