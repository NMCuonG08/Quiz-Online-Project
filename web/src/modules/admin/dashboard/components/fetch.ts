const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export async function getOverviewData() {
  const url = `${API_BASE}/api/admin/dashboard/stats`;
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    const data = result.data; // Backend wraps response in { data: ... }
    
    if (!data || !data.overview) {
       throw new Error('Data format incorrect or missing overview');
    }

    // Map backend keys to what the UI expects
    return {
      views: data.overview.attempts || { value: 0, growthRate: 0 },
      profit: data.overview.questions || { value: 0, growthRate: 0 },
      products: data.overview.quizzes || { value: 0, growthRate: 0 },
      users: data.overview.users || { value: 0, growthRate: 0 },
    };
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    // Fallback to mock data if API fails
    return {
      views: { value: 0, growthRate: 0 },
      profit: { value: 0, growthRate: 0 },
      products: { value: 0, growthRate: 0 },
      users: { value: 0, growthRate: 0 },
    };
  }
}

export async function getChatsData() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    {
      name: "Jacob Jones",
      profile: "/images/user/user-01.png",
      isActive: true,
      lastMessage: {
        content: "See you tomorrow at the meeting!",
        type: "text",
        timestamp: "2024-12-19T14:30:00Z",
        isRead: false,
      },
      unreadCount: 3,
    },
    // ... remaining data omitted for brevity but should be kept in real file
    {
      name: "Wilium Smith",
      profile: "/images/user/user-03.png",
      isActive: true,
      lastMessage: {
        content: "Thanks for the update",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "Johurul Haque",
      profile: "/images/user/user-04.png",
      isActive: false,
      lastMessage: {
        content: "What's up?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "M. Chowdhury",
      profile: "/images/user/user-05.png",
      isActive: false,
      lastMessage: {
        content: "Where are you now?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 2,
    },
    {
      name: "Akagami",
      profile: "/images/user/user-07.png",
      isActive: false,
      lastMessage: {
        content: "Hey, how are you?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
  ];
}

export async function getDashboardDetailedData() {
  const url = `${API_BASE}/api/admin/dashboard/stats`;
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.data || {
      overview: { attempts: { value: 0 }, questions: { value: 0 }, quizzes: { value: 0 }, users: { value: 0 } },
      recentQuizzes: [],
      recentUsers: [],
    };
  } catch (error) {
    console.error(`Error fetching detailed from ${url}:`, error);
    return {
      overview: { attempts: { value: 0 }, questions: { value: 0 }, quizzes: { value: 0 }, users: { value: 0 } },
      recentQuizzes: [],
      recentUsers: [],
    };
  }
}
