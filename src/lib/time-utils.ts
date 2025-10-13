import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi"; // Vietnamese locale

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);
dayjs.locale("vi"); // Set Vietnamese locale

export const formatTimeAgo = (dateString: string): string => {
  const date = dayjs(dateString);
  const now = dayjs();

  // Calculate the difference
  const diffInMinutes = now.diff(date, "minute");
  const diffInHours = now.diff(date, "hour");
  const diffInDays = now.diff(date, "day");
  const diffInWeeks = now.diff(date, "week");
  const diffInMonths = now.diff(date, "month");
  const diffInYears = now.diff(date, "year");

  // Return appropriate format based on time difference
  if (diffInMinutes < 1) {
    return "Vừa xong";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  } else if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} tuần trước`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} tháng trước`;
  } else {
    return `${diffInYears} năm trước`;
  }
};

export const formatDate = (
  dateString: string,
  format: string = "DD/MM/YYYY"
): string => {
  return dayjs(dateString).format(format);
};

export const formatDateTime = (dateString: string): string => {
  return dayjs(dateString).format("DD/MM/YYYY HH:mm");
};

export const isRecent = (dateString: string, hours: number = 24): boolean => {
  const date = dayjs(dateString);
  const now = dayjs();
  return now.diff(date, "hour") < hours;
};

export const isToday = (dateString: string): boolean => {
  const date = dayjs(dateString);
  const today = dayjs();
  return date.isSame(today, "day");
};

export const isThisWeek = (dateString: string): boolean => {
  const date = dayjs(dateString);
  const now = dayjs();
  return date.isSame(now, "week");
};

export const isThisMonth = (dateString: string): boolean => {
  const date = dayjs(dateString);
  const now = dayjs();
  return date.isSame(now, "month");
};
