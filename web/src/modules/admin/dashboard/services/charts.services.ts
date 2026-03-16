const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

async function fetchWithFallback<T>(endpoint: string, fallback: T): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.data || fallback;
  } catch (error) {
    console.warn(`Failed to fetch ${url}, using fallback`, error);
    return fallback;
  }
}

export async function getDevicesUsedData(timeFrame?: string) {
  // Using category distribution as a meaningful substitute for "devices used" in context of Quiz App
  const data = await fetchWithFallback('/api/admin/dashboard/category-distribution', []);
  
  if (data.length === 0) {
    return [
      { name: "General", percentage: 1, amount: 0 }
    ];
  }
  return data;
}

export async function getPaymentsOverviewData(timeFrame?: string) {
  const trendData = await fetchWithFallback('/api/admin/dashboard/activity-trend', { plays: [], quizzes: [] });
  
  return {
    received: trendData.plays.length > 0 ? trendData.plays : [
      { x: "Jan", y: 30 }, { x: "Feb", y: 40 }, { x: "Mar", y: 35 }, { x: "Apr", y: 50 },
      { x: "May", y: 45 }, { x: "Jun", y: 60 }, { x: "Jul", y: 70 }, { x: "Aug", y: 65 },
      { x: "Sep", y: 80 }, { x: "Oct", y: 90 }, { x: "Nov", y: 85 }, { x: "Dec", y: 95 },
    ],
    due: trendData.quizzes.length > 0 ? trendData.quizzes : [
      { x: "Jan", y: 10 }, { x: "Feb", y: 15 }, { x: "Mar", y: 12 }, { x: "Apr", y: 20 },
      { x: "May", y: 18 }, { x: "Jun", y: 25 }, { x: "Jul", y: 30 }, { x: "Aug", y: 28 },
      { x: "Sep", y: 35 }, { x: "Oct", y: 40 }, { x: "Nov", y: 38 }, { x: "Dec", y: 45 },
    ],
  };
}

export async function getWeeksProfitData(timeFrame?: string) {
  const weeklyData = await fetchWithFallback('/api/admin/dashboard/weekly-activity', []);
  
  // Transform to chart format
  return {
    sales: weeklyData.map((d: any) => ({ x: d.day, y: d.value })),
    revenue: weeklyData.map((d: any) => ({ x: d.day, y: Math.floor(d.value * 0.3) })), // Just a mock "revenue" index
  };
}

export async function getCampaignVisitorsData() {
  return {
    total_visitors: 0,
    performance: 0,
    chart: [],
  };
}

export async function getVisitorsAnalyticsData() {
  return [];
}

export async function getCostsPerInteractionData() {
  return {
    avg_cost: 0,
    growth: 0,
    chart: [],
  };
}
