const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export type SubscriptionPlan = 'FREE' | 'BASIC' | 'PREMIUM';

export interface PlanConfig {
  id: string;
  name: SubscriptionPlan;
  price: number;
  duration: number;
  features: string[];
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  started_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface CreateOrderResponse {
  paymentId: string;
  paymentUrl: string;
  qrCode?: string;
}

export const subscriptionService = {
  async getPlans(): Promise<PlanConfig[]> {
    try {
      const res = await fetch(`${API_BASE}/api/subscriptions/plans`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch plans');
      const data = await res.json();
      return data.data || DEFAULT_PLANS;
    } catch {
      return DEFAULT_PLANS;
    }
  },

  async getMySubscription(token: string): Promise<UserSubscription | null> {
    try {
      const res = await fetch(`${API_BASE}/api/subscriptions/my-plan`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data || null;
    } catch {
      return null;
    }
  },

  async createOrder(plan: SubscriptionPlan, token: string): Promise<CreateOrderResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error('Failed to create order');
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  async checkPaymentStatus(paymentId: string, token: string): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/api/payments/${paymentId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return 'PENDING';
      const data = await res.json();
      return data.data?.status || 'PENDING';
    } catch {
      return 'PENDING';
    }
  },
};

// Default plans — used while backend not yet ready
export const DEFAULT_PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'FREE',
    price: 0,
    duration: 0,
    is_active: true,
    features: [
      '5 Quiz mỗi tháng',
      'Tối đa 10 câu hỏi / quiz',
      'Chơi cùng bạn bè',
      'Báo cáo cơ bản',
      'Hỗ trợ cộng đồng',
    ],
  },
  {
    id: 'basic',
    name: 'BASIC',
    price: 49000,
    duration: 30,
    is_active: true,
    features: [
      'Không giới hạn Quiz',
      'Tối đa 50 câu hỏi / quiz',
      'Phòng chờ riêng tư',
      'Thống kê chi tiết',
      'Hỗ trợ qua email',
      'Không có quảng cáo',
    ],
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    price: 99000,
    duration: 30,
    is_active: true,
    features: [
      'Tất cả tính năng BASIC',
      'Xuất báo cáo Excel / PDF',
      'AI tạo câu hỏi tự động',
      'Tùy chỉnh giao diện Quiz',
      'Phân tích nâng cao',
      'Ưu tiên hỗ trợ 24/7 ⚡',
    ],
  },
];
