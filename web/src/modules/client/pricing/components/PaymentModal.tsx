'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, XCircle, Smartphone } from 'lucide-react';

interface PaymentModalProps {
    plan: string;
    price: number;
    paymentId: string;
    paymentUrl: string;
    qrCode?: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    plan,
    price,
    paymentId,
    paymentUrl,
    qrCode,
    onClose,
    onSuccess,
}) => {
    const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
    const [countdown, setCountdown] = useState(300); // 5 phút

    // Countdown timer
    useEffect(() => {
        if (status !== 'pending') return;
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setStatus('failed');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [status]);

    // Poll payment status every 3 seconds
    useEffect(() => {
        if (status !== 'pending' || !paymentId) return;
        const token = localStorage.getItem('access_token') || '';
        const interval = setInterval(async () => {
            try {
                const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
                const res = await fetch(`${API_BASE}/api/payments/${paymentId}/status`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.data?.status === 'SUCCESS') {
                        setStatus('success');
                        clearInterval(interval);
                        setTimeout(onSuccess, 2000);
                    } else if (data.data?.status === 'FAILED') {
                        setStatus('failed');
                        clearInterval(interval);
                    }
                }
            } catch {
                // silently ignore polling errors
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [paymentId, status, onSuccess]);

    const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const formatPrice = (p: number) => p.toLocaleString('vi-VN') + 'đ';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header gradient */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-white text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="text-4xl mb-2">⭐</div>
                    <h2 className="text-xl font-bold">Nâng cấp lên {plan}</h2>
                    <p className="text-white/80 text-sm mt-1">Thanh toán qua ZaloPay</p>
                </div>

                {/* Body */}
                <div className="p-6">
                    {status === 'pending' && (
                        <>
                            {/* QR Code area */}
                            <div className="flex flex-col items-center gap-4">
                                {qrCode ? (
                                    <div className="relative">
                                        <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 blur-sm" />
                                        <img
                                            src={qrCode}
                                            alt="QR Code thanh toán"
                                            className="relative w-52 h-52 rounded-xl border-4 border-white shadow-lg"
                                        />
                                    </div>
                                ) : (
                                    /* Placeholder QR khi backend chưa ready */
                                    <div className="w-52 h-52 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 dark:bg-indigo-950 flex flex-col items-center justify-center gap-3">
                                        <Smartphone className="w-12 h-12 text-indigo-400" />
                                        <p className="text-sm text-center text-indigo-500 font-medium px-4">
                                            QR Code sẽ xuất hiện sau khi<br />tích hợp ZaloPay
                                        </p>
                                    </div>
                                )}

                                {/* Amount */}
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Số tiền thanh toán</p>
                                    <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                        {formatPrice(price)}
                                    </p>
                                </div>

                                {/* Status indicator */}
                                <div className="w-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                            Đang chờ xác nhận...
                                        </p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">
                                            Hết hạn sau: <span className="font-mono font-bold">{formatTime(countdown)}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-1 w-full list-decimal list-inside">
                                    <li>Mở ứng dụng <strong>ZaloPay</strong> trên điện thoại</li>
                                    <li>Chọn <strong>Quét mã QR</strong></li>
                                    <li>Quét mã và xác nhận thanh toán</li>
                                </ol>

                                {/* Manual link */}
                                {paymentUrl && (
                                    <a
                                        href={paymentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-indigo-500 hover:text-indigo-700 underline"
                                    >
                                        Hoặc thanh toán qua trình duyệt →
                                    </a>
                                )}
                            </div>
                        </>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center gap-4 py-4 text-center animate-in fade-in">
                            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-green-600 dark:text-green-400">Thanh toán thành công! 🎉</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Tài khoản của bạn đã được nâng cấp lên <strong>{plan}</strong>.
                                </p>
                            </div>
                            <div className="w-full bg-green-50 dark:bg-green-950 rounded-xl p-3 text-sm text-green-700 dark:text-green-300">
                                Email xác nhận đã được gửi đến hộp thư của bạn.
                            </div>
                        </div>
                    )}

                    {status === 'failed' && (
                        <div className="flex flex-col items-center gap-4 py-4 text-center">
                            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Giao dịch thất bại</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Hết thời gian hoặc thanh toán bị từ chối. Vui lòng thử lại.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
                            >
                                Thử lại
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
