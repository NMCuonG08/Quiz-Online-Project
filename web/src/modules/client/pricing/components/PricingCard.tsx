'use client';

import React, { useState } from 'react';
import { CheckCircle2, Zap, Crown, Sparkles } from 'lucide-react';
import { PlanConfig, subscriptionService } from '../services/subscription.service';
import { PaymentModal } from './PaymentModal';
import { useRouter } from 'next/navigation';

interface PricingCardProps {
    plan: PlanConfig;
    isCurrentPlan?: boolean;
}

const PLAN_META = {
    FREE: {
        icon: <Sparkles className="w-6 h-6" />,
        color: 'from-slate-400 to-slate-600',
        badge: null,
        buttonText: 'Đang dùng',
        bgClass: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        buttonClass: 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400',
    },
    BASIC: {
        icon: <Zap className="w-6 h-6" />,
        color: 'from-blue-500 to-indigo-600',
        badge: 'Phổ biến',
        buttonText: 'Bắt đầu ngay',
        bgClass: 'bg-gradient-to-b from-indigo-600 to-indigo-700 border-indigo-400 shadow-2xl shadow-indigo-500/30',
        buttonClass: 'bg-white text-indigo-700 hover:bg-indigo-50 font-bold',
    },
    PREMIUM: {
        icon: <Crown className="w-6 h-6" />,
        color: 'from-amber-400 to-orange-500',
        badge: 'Tốt nhất',
        buttonText: 'Nâng cấp Premium',
        bgClass: 'bg-white dark:bg-gray-800 border-amber-300 dark:border-amber-700 shadow-xl shadow-amber-100 dark:shadow-amber-900/20',
        buttonClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 font-bold',
    },
};

export const PricingCard: React.FC<PricingCardProps> = ({ plan, isCurrentPlan }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [paymentData, setPaymentData] = useState<{
        paymentId: string;
        paymentUrl: string;
        qrCode?: string;
    } | null>(null);
    const router = useRouter();
    const meta = PLAN_META[plan.name];
    const isBasic = plan.name === 'BASIC';
    const isFree = plan.name === 'FREE';

    const handleBuy = async () => {
        if (isFree || isCurrentPlan) return;

        const token = localStorage.getItem('access_token') || '';
        if (!token) {
            router.push('/auth/login');
            return;
        }

        setIsLoading(true);
        try {
            const order = await subscriptionService.createOrder(plan.name, token);
            if (order) {
                setPaymentData({
                    paymentId: order.paymentId,
                    paymentUrl: order.paymentUrl,
                    qrCode: order.qrCode,
                });
            }
        } catch {
            // Handle error
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        setPaymentData(null);
        router.refresh();
    };

    return (
        <>
            <div
                className={`relative rounded-3xl border-2 p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 ${meta.bgClass} ${isBasic ? 'scale-105 z-10' : ''}`}
            >
                {/* Badge */}
                {meta.badge && (
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r ${meta.color} text-white shadow-lg`}>
                        {meta.badge} ✨
                    </div>
                )}

                {/* Icon + Name */}
                <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-white shadow-lg`}>
                        {meta.icon}
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold ${isBasic ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            {plan.name === 'FREE' ? 'Miễn phí' : plan.name === 'BASIC' ? 'Cơ bản' : 'Cao cấp'}
                        </h3>
                        <p className={`text-xs ${isBasic ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                            {plan.name === 'FREE' ? 'Khởi đầu' : plan.name === 'BASIC' ? 'Dành cho cá nhân' : 'Dành cho chuyên gia'}
                        </p>
                    </div>
                </div>

                {/* Price */}
                <div className="mb-8">
                    {plan.price === 0 ? (
                        <div className={`text-4xl font-black ${isBasic ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            Miễn phí
                        </div>
                    ) : (
                        <div className="flex items-end gap-2">
                            <span className={`text-4xl font-black ${isBasic ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                {plan.price.toLocaleString('vi-VN')}đ
                            </span>
                            <span className={`text-sm mb-1 ${isBasic ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                / tháng
                            </span>
                        </div>
                    )}
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <CheckCircle2
                                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isBasic ? 'text-indigo-200' : 'text-green-500 dark:text-green-400'}`}
                            />
                            <span className={`text-sm ${isBasic ? 'text-indigo-100' : 'text-gray-600 dark:text-gray-300'}`}>
                                {feature}
                            </span>
                        </li>
                    ))}
                </ul>

                {/* CTA Button */}
                <button
                    onClick={handleBuy}
                    disabled={isFree || isCurrentPlan || isLoading}
                    className={`w-full py-3.5 rounded-2xl text-sm transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 ${meta.buttonClass} ${(isFree || isCurrentPlan) ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Đang xử lý...
                        </span>
                    ) : isCurrentPlan ? (
                        '✓ Gói hiện tại'
                    ) : (
                        meta.buttonText
                    )}
                </button>
            </div>

            {/* Payment Modal */}
            {paymentData && (
                <PaymentModal
                    plan={plan.name}
                    price={plan.price}
                    paymentId={paymentData.paymentId}
                    paymentUrl={paymentData.paymentUrl}
                    qrCode={paymentData.qrCode}
                    onClose={() => setPaymentData(null)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </>
    );
};
