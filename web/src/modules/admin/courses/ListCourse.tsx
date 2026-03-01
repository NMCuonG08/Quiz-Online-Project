"use client";
import React, { useState } from "react";
import { useAdminCourses } from "./hooks/useAdminCourses";
import { Button } from "@/common/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/common/components/ui/table";
import { Loader2, Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import Breadcrumb from "../common/components/Breadcrumbs/Breadcrumb";
import { format } from "date-fns";

export default function ListCourse() {
    const { courses, loading, deleteCourse, updateCourse } = useAdminCourses();

    const handleTogglePublish = async (id: string, currentStatus: boolean) => {
        await updateCourse(id, { is_published: !currentStatus });
    };

    const handleDelete = async (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa khóa học này không? Mọi nội dung liên quan đều sẽ bị xóa.")) {
            await deleteCourse(id);
        }
    };

    return (
        <>
            <Breadcrumb pageName="Danh sách Khóa học" />
            <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h4 className="text-xl font-semibold text-black dark:text-white">
                        Các khóa học của bạn
                    </h4>
                    <Button className="flex items-center gap-2">
                        <Plus size={18} />
                        Thêm Khóa học
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : courses.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        Chưa có khóa học nào. Nhấp vào nút "Thêm Khóa học" để tạo mới.
                    </div>
                ) : (
                    <div className="max-w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên khóa học</TableHead>
                                    <TableHead>Chuyên mục</TableHead>
                                    <TableHead>Độ khó</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courses.map((course) => (
                                    <TableRow key={course.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-black dark:text-white">{course.title}</span>
                                                <span className="text-xs text-muted-foreground">{course.slug}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {course.category?.name || "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${course.difficulty_level === 'HARD' ? 'bg-danger/10 text-danger' :
                                                    course.difficulty_level === 'MEDIUM' ? 'bg-warning/10 text-warning' :
                                                        'bg-success/10 text-success'
                                                }`}>
                                                {course.difficulty_level}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {course.is_published ? (
                                                <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
                                                    Đã xuất bản
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-warning/10 px-3 py-1 text-sm font-medium text-warning">
                                                    Bản nháp
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    title="Toggle visibility"
                                                    className="hover:text-primary transition-colors"
                                                    onClick={() => handleTogglePublish(course.id, course.is_published)}
                                                >
                                                    {course.is_published ? <Eye size={18} /> : <EyeOff size={18} className="text-muted-foreground" />}
                                                </button>
                                                <button title="Edit" className="hover:text-primary transition-colors">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    title="Delete"
                                                    className="hover:text-danger hover:bg-danger/10 rounded-full p-1 transition-colors"
                                                    onClick={() => handleDelete(course.id)}
                                                >
                                                    <Trash2 size={18} className="text-danger" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </>
    );
}
