import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async exportUsersReport(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Quiz Online Admin';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Người dùng', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    // Define columns
    sheet.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Họ và Tên', key: 'full_name', width: 25 },
      { header: 'Tên đăng nhập', key: 'username', width: 20 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Admin', key: 'isAdmin', width: 10 },
      { header: 'Ngày đăng ký', key: 'created_at', width: 22 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }, // indigo-600
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF3B37C7' } },
        bottom: { style: 'thin', color: { argb: 'FF3B37C7' } },
      };
    });
    headerRow.height = 32;

    // Fetch data
    const users = await this.prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        full_name: true,
        username: true,
        email: true,
        isAdmin: true,
        created_at: true,
      },
    });

    // Add data rows
    users.forEach((user, index) => {
      const row = sheet.addRow({
        stt: index + 1,
        full_name: user.full_name || '—',
        username: user.username || '—',
        email: user.email,
        isAdmin: user.isAdmin ? 'Admin' : 'User',
        created_at: user.created_at.toLocaleString('vi-VN'),
      });

      // Alternate row colors
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F3FF' }, // indigo-50
          };
        });
      }
      row.height = 22;
    });

    // Summary row
    sheet.addRow({});
    const summaryRow = sheet.addRow({ full_name: `Tổng số: ${users.length} người dùng` });
    summaryRow.getCell('full_name').font = { bold: true, italic: true };

    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  async exportQuizzesReport(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Quiz Online Admin';

    const sheet = workbook.addWorksheet('Danh sách Quiz', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Tên Quiz', key: 'title', width: 40 },
      { header: 'Danh mục', key: 'category', width: 20 },
      { header: 'Người tạo', key: 'creator', width: 25 },
      { header: 'Độ khó', key: 'difficulty', width: 12 },
      { header: 'Số câu hỏi', key: 'questions', width: 14 },
      { header: 'Lượt thử', key: 'attempts', width: 12 },
      { header: 'Công khai', key: 'is_public', width: 12 },
      { header: 'Ngày tạo', key: 'created_at', width: 22 },
    ];

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } }; // emerald-600
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    headerRow.height = 32;

    const quizzes = await this.prisma.quiz.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        category: { select: { name: true } },
        creator: { select: { full_name: true, username: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });

    const DIFFICULTY_MAP = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' };

    quizzes.forEach((quiz, index) => {
      const row = sheet.addRow({
        stt: index + 1,
        title: quiz.title,
        category: quiz.category.name,
        creator: quiz.creator.full_name || quiz.creator.username || '—',
        difficulty: DIFFICULTY_MAP[quiz.difficulty_level] || quiz.difficulty_level,
        questions: quiz._count.questions,
        attempts: quiz._count.attempts,
        is_public: quiz.is_public ? 'Công khai' : 'Riêng tư',
        created_at: quiz.created_at.toLocaleString('vi-VN'),
      });

      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
        });
      }
      row.height = 22;
    });

    sheet.addRow({});
    const summaryRow = sheet.addRow({ title: `Tổng số: ${quizzes.length} Quiz` });
    summaryRow.getCell('title').font = { bold: true, italic: true };

    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  async exportAttemptsReport(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Lượt thử', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Người dùng', key: 'user', width: 25 },
      { header: 'Quiz', key: 'quiz', width: 35 },
      { header: 'Điểm', key: 'score', width: 10 },
      { header: '% Điểm', key: 'percentage', width: 12 },
      { header: 'Kết quả', key: 'passed', width: 12 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Ngày thử', key: 'started_at', width: 22 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } }; // red-600
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    headerRow.height = 32;

    const attempts = await this.prisma.quizAttempt.findMany({
      take: 500,
      orderBy: { started_at: 'desc' },
      include: {
        user: { select: { full_name: true, username: true, email: true } },
        quiz: { select: { title: true } },
      },
    });

    const STATUS_MAP = {
      IN_PROGRESS: 'Đang làm',
      COMPLETED: 'Hoàn thành',
      ABANDONED: 'Bỏ dở',
      TIMED_OUT: 'Hết giờ',
    };

    attempts.forEach((attempt, index) => {
      const row = sheet.addRow({
        stt: index + 1,
        user: attempt.user.full_name || attempt.user.username || attempt.user.email,
        quiz: attempt.quiz.title,
        score: `${attempt.score}/${attempt.max_score}`,
        percentage: `${attempt.percentage.toFixed(1)}%`,
        passed: attempt.passed ? '✓ Đạt' : '✗ Không đạt',
        status: STATUS_MAP[attempt.status] || attempt.status,
        started_at: attempt.started_at.toLocaleString('vi-VN'),
      });

      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5F5' } };
        });
      }
      row.height = 22;
    });

    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }
}
