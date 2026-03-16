import React from 'react';
import { PricingCard } from './components/PricingCard';
import { subscriptionService, DEFAULT_PLANS } from './services/subscription.service';
import { CheckCircle2, Zap } from 'lucide-react';

export default async function PricingPage() {
    // Try to load plans from backend; fallback to defaults
    let plans = DEFAULT_PLANS;
    try {
        const fetched = await subscriptionService.getPlans();
        if (fetched && fetched.length > 0) plans = fetched;
    } catch {
        plans = DEFAULT_PLANS;
    }

    const FAQ = [
        {
            q: 'Tôi có thể hủy gói bất cứ lúc nào không?',
            a: 'Có, bạn có thể hủy gói trước khi chu kỳ thanh toán tiếp theo. Bạn sẽ tiếp tục được sử dụng cho đến hết tháng hiện tại.',
        },
        {
            q: 'Thanh toán có an toàn không?',
            a: 'Hoàn toàn an toàn. Chúng tôi sử dụng ZaloPay — cổng thanh toán uy tín được bảo vệ bằng mã hóa SSL/TLS 256-bit.',
        },
        {
            q: 'Gói Premium có gì khác so với Basic?',
            a: 'Gói Premium bổ sung tính năng AI tạo câu hỏi, xuất báo cáo Excel, tùy chỉnh giao diện Quiz và hỗ trợ ưu tiên 24/7.',
        },
        {
            q: 'Tôi có thể nâng/hạ cấp gói không?',
            a: 'Có. Bạn có thể nâng cấp lên gói cao hơn bất cứ lúc nào. Phần tiền thừa sẽ được tính vào chu kỳ tiếp theo.',
        },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 py-24 px-4">
                {/* Decorative blobs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white/80 text-sm mb-6 backdrop-blur-sm">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        Nâng cấp và học hiệu quả hơn
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                        Chọn gói phù hợp với{' '}
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                            bạn
                        </span>
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        Bắt đầu miễn phí, nâng cấp khi bạn cần. Không ràng buộc hợp đồng dài hạn.
                    </p>

                    {/* Trust badges */}
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-slate-400 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Hủy bất cứ lúc nào
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Thanh toán 100% bảo mật
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Hỗ trợ tiếng Việt
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="bg-gradient-to-b from-slate-900 to-slate-50 dark:from-slate-900 dark:to-slate-950 py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        {plans.map((plan) => (
                            <PricingCard key={plan.id} plan={plan} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Comparison Table */}
            <section className="bg-white dark:bg-slate-900 py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
                        So sánh chi tiết các gói
                    </h2>

                    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800">
                                    <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Tính năng</th>
                                    <th className="text-center p-4 font-semibold text-gray-600 dark:text-gray-300">Miễn phí</th>
                                    <th className="text-center p-4 font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950">Cơ bản</th>
                                    <th className="text-center p-4 font-semibold text-amber-600 dark:text-amber-400">Cao cấp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {[
                                    ['Số Quiz mỗi tháng', '5', 'Không giới hạn', 'Không giới hạn'],
                                    ['Câu hỏi mỗi Quiz', '10', '50', 'Không giới hạn'],
                                    ['Phòng riêng tư', '✗', '✓', '✓'],
                                    ['Thống kê chi tiết', '✗', '✓', '✓'],
                                    ['Xuất báo cáo Excel', '✗', '✗', '✓'],
                                    ['AI tạo câu hỏi', '✗', '✗', '✓'],
                                    ['Tuỳ chỉnh giao diện', '✗', '✗', '✓'],
                                    ['Hỗ trợ', 'Cộng đồng', 'Email', 'Ưu tiên 24/7'],
                                ].map(([feature, free, basic, premium], idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                                        <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">{feature}</td>
                                        <td className="p-4 text-center text-gray-500 dark:text-gray-400">
                                            {free === '✗' ? <span className="text-red-400">✗</span> : free === '✓' ? <span className="text-green-500">✓</span> : free}
                                        </td>
                                        <td className="p-4 text-center bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-300">
                                            {basic === '✗' ? <span className="text-red-400">✗</span> : basic === '✓' ? <span className="text-green-500">✓</span> : basic}
                                        </td>
                                        <td className="p-4 text-center text-amber-600 dark:text-amber-400">
                                            {premium === '✗' ? <span className="text-red-400">✗</span> : premium === '✓' ? <span className="text-green-500">✓</span> : premium}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="bg-slate-50 dark:bg-slate-950 py-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
                        Câu hỏi thường gặp
                    </h2>
                    <div className="space-y-4">
                        {FAQ.map((item, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.q}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20 px-4 text-center">
                <h2 className="text-4xl font-black text-white mb-4">Sẵn sàng bắt đầu?</h2>
                <p className="text-xl text-indigo-200 mb-8">Tham gia cùng hàng nghìn người dùng đang học hiệu quả mỗi ngày.</p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <a
                        href="#pricing"
                        className="px-8 py-4 bg-white text-indigo-700 rounded-2xl font-bold hover:bg-indigo-50 transition-colors shadow-xl"
                    >
                        Bắt đầu miễn phí →
                    </a>
                    <a
                        href="#pricing"
                        className="px-8 py-4 bg-white/10 text-white border border-white/30 rounded-2xl font-semibold hover:bg-white/20 transition-colors"
                    >
                        Xem các gói
                    </a>
                </div>
            </section>
        </div>
    );
}
