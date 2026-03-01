import ListCourse from "@/modules/admin/courses/ListCourse";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quản lý Khóa học",
    description: "Trang quản lý danh sách khóa học",
};

export default function CoursesPage() {
    return (
        <>
            <ListCourse />
        </>
    );
}
