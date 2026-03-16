'use client';

import React, { useState } from 'react';
import { Download, Loader2, Users, FileText, CheckSquare } from 'lucide-react';

export function ExportReportButton() {
    const [loadingType, setLoadingType] = useState<string | null>(null);

    const handleExport = async (type: 'users' | 'quizzes' | 'attempts') => {
        try {
            setLoadingType(type);
            const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
            const token = localStorage.getItem('access_token');

            const res = await fetch(`${API_BASE}/api/admin/reports/export?type=${type}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!res.ok) throw new Error('Xuất báo cáo thất bại');

            // Helper to extract filename from header
            let filename = `${type}-report.xlsx`;
            const disposition = res.headers.get('content-disposition');
            if (disposition && disposition.includes('filename=')) {
                const matches = disposition.match(/filename="?([^"]+)"?/);
                if (matches && matches[1]) {
                    filename = matches[1];
                }
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert('Không thể xuất báo cáo. Vui lòng thử lại sau.');
        } finally {
            setLoadingType(null);
        }
    };

    return (
        <div className="relative group inline-block">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium">
                <Download className="w-4 h-4" />
                <span>Xuất báo cáo</span>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#122031] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <ul className="py-2">
                    <li>
                        <button
                            onClick={() => handleExport('users')}
                            disabled={loadingType !== null}
                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" />
                                Dữ liệu Người dùng
                            </span>
                            {loadingType === 'users' && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => handleExport('quizzes')}
                            disabled={loadingType !== null}
                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-500" />
                                Dữ liệu Quiz
                            </span>
                            {loadingType === 'quizzes' && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => handleExport('attempts')}
                            disabled={loadingType !== null}
                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-red-500" />
                                Kết quả lượt chơi
                            </span>
                            {loadingType === 'attempts' && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
}
