import { useState, useCallback, useEffect } from "react";
import { AdminCourseService } from "../services/course.service";
import { AdminCourse, CourseCreateData, CourseUpdateData } from "../types/course.type";
import { showSuccess, showError } from "@/lib/Notification";

export const useAdminCourses = () => {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const { success, data, error } = await AdminCourseService.getAllCourses();
    if (success && data) {
      setCourses(data);
    } else {
      showError(error || "Không thể lấy danh sách khóa học");
    }
    setLoading(false);
  }, []);

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
    refresh: fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
  };
};
