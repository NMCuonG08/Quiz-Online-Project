import { useState, useCallback, useEffect } from "react";
import { AdminCourseService } from "../services/course.service";
import { AdminCourse, CourseCreateData, CourseUpdateData } from "../types/course.type";
import { showSuccess, showError } from "@/lib/Notification";

export const useAdminCourses = () => {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCourses = useCallback(async (currentPage = page, currentLimit = limit) => {
    setLoading(true);
    const { success, data, error } = await AdminCourseService.getAllCourses(currentPage, currentLimit);
    if (success && data) {
      const coursesData = (data as any).data?.data || (data as any).data || data || [];
      const extractedCourses = Array.isArray(coursesData) ? coursesData : [];
      setCourses(extractedCourses);
      setTotal((data as any).data?.meta?.total || (data as any).meta?.total || 0);
      setTotalPages((data as any).data?.meta?.totalPages || (data as any).meta?.totalPages || 1);
    } else {
      showError(error || "Không thể lấy danh sách khóa học");
    }
    setLoading(false);
  }, [page, limit]);

  const createCourse = async (courseData: CourseCreateData) => {
    const { success, data, error } = await AdminCourseService.createCourse(courseData);
    if (success && data) {
      setCourses((prev) => [data, ...prev]);
      showSuccess("Tạo khóa học thành công");
      return true;
    } else {
      showError(error || "Lỗi tạo khóa học");
      return false;
    }
  };

  const updateCourse = async (id: string, courseData: CourseUpdateData) => {
    const { success, data, error } = await AdminCourseService.updateCourse(id, courseData);
    if (success && data) {
      setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
      showSuccess("Cập nhật khóa học thành công");
      return true;
    } else {
      showError(error || "Lỗi cập nhật khóa học");
      return false;
    }
  };

  const deleteCourse = async (id: string) => {
    const { success, error } = await AdminCourseService.deleteCourse(id);
    if (success) {
      setCourses((prev) => prev.filter((c) => c.id !== id));
      showSuccess("Xóa khóa học thành công");
      return true;
    } else {
      showError(error || "Lỗi xóa khóa học");
      return false;
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    loading,
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    refresh: fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
  };
};
