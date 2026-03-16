import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  private async calculateGrowthRate(
    currentQuery: () => Promise<number>,
    previousQuery: () => Promise<number>
  ) {
    const [current, previous] = await Promise.all([currentQuery(), previousQuery()]);
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat(((current - previous) / previous * 100).toFixed(2));
  }

  async getStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, totalQuizzes, totalQuestions, totalAttempts,
      curUsers, prevUsers,
      curQuizzes, prevQuizzes,
      curQuestions, prevQuestions,
      curAttempts, prevAttempts
    ] = await Promise.all([
      this.prismaService.user.count(),
      this.prismaService.quiz.count(),
      this.prismaService.question.count(),
      this.prismaService.quizAttempt.count(),
      // Current period counts
      this.prismaService.user.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
      this.prismaService.user.count({ where: { created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      this.prismaService.quiz.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
      this.prismaService.quiz.count({ where: { created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      this.prismaService.question.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
      this.prismaService.question.count({ where: { created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      this.prismaService.quizAttempt.count({ where: { started_at: { gte: thirtyDaysAgo } } }),
      this.prismaService.quizAttempt.count({ where: { started_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    ]);

    const recentQuizzes = await this.prismaService.quiz.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        category: { select: { name: true } },
        creator: { select: { full_name: true, username: true } },
        thumbnail: { select: { url: true } },
      },
    });

    const recentUsers = await this.prismaService.user.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        full_name: true,
        username: true,
        email: true,
        avatar: true,
        created_at: true,
      },
    });

    const getRate = (cur: number, prev: number) => {
      if (prev === 0) return cur > 0 ? 100 : 0;
      return parseFloat(((cur - prev) / prev * 100).toFixed(2));
    };

    return {
      overview: {
        users: { value: totalUsers, growthRate: getRate(curUsers, prevUsers) },
        quizzes: { value: totalQuizzes, growthRate: getRate(curQuizzes, prevQuizzes) },
        questions: { value: totalQuestions, growthRate: getRate(curQuestions, prevQuestions) },
        attempts: { value: totalAttempts, growthRate: getRate(curAttempts, prevAttempts) },
      },
      recentQuizzes,
      recentUsers,
    };
  }

  async getCategoryDistribution() {
    try {
      const categories = await this.prismaService.category.findMany({
        where: { is_active: true },
        include: { _count: { select: { quizzes: true } } },
      });
      
      const totalQuizzes = categories.reduce((acc, cat) => acc + cat._count.quizzes, 0);
      
      return categories
        .filter(cat => cat._count.quizzes > 0)
        .map(cat => ({
          name: cat.name,
          percentage: totalQuizzes > 0 ? parseFloat((cat._count.quizzes / totalQuizzes).toFixed(2)) : 0,
          amount: cat._count.quizzes
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 4);
    } catch (error) {
      console.error('Error in getCategoryDistribution:', error);
      return [];
    }
  }

  async getActivityTrend() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    
    const monthlyAttempts: { x: string; y: number }[] = [];
    const monthlyQuizzes: { x: string; y: number }[] = [];

    for (let i = 0; i < 12; i++) {
      const startDate = new Date(currentYear, i, 1);
      const endDate = new Date(currentYear, i + 1, 1);

      const [attempts, quizzes] = await Promise.all([
        this.prismaService.quizAttempt.count({
          where: { started_at: { gte: startDate, lt: endDate } }
        }),
        this.prismaService.quiz.count({
          where: { created_at: { gte: startDate, lt: endDate } }
        })
      ]);

      monthlyAttempts.push({ x: months[i], y: attempts });
      monthlyQuizzes.push({ x: months[i], y: quizzes });
    }

    return {
      plays: monthlyAttempts,
      quizzes: monthlyQuizzes
    };
  }

  async getWeeklyActivity() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const result: { day: string; value: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const count = await this.prismaService.quizAttempt.count({
        where: {
          started_at: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      result.push({
        day: days[date.getDay()],
        value: count,
      });
    }

    return result;
  }
}
