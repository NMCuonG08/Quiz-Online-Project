import { BadRequestException, ConflictException } from '@nestjs/common';
import { QuizService } from './quiz.service';

const payload = {
  title: 'Python cơ bản',
  slug: 'python-co-ban',
  category_id: 'category-1',
  description: 'Quiz test',
  difficulty_level: 'EASY',
  time_limit: 600,
  max_attempts: 0,
  passing_score: 70,
  is_active: false,
  quiz_type: 'MULTIPLE_CHOICE',
  instructions: '',
  questions: [{
    question_text: 'Python là gì?',
    question_type: 'SINGLE_CHOICE',
    options: [
      { option_text: 'Ngôn ngữ lập trình', is_correct: true, sort_order: 0 },
      { option_text: 'Hệ điều hành', is_correct: false, sort_order: 1 },
    ],
  }],
} as never;

function createService(tx: any) {
  const service = Object.create(QuizService.prototype) as QuizService & any;
  service.prisma = {
    $transaction: jest.fn(async (callback: (value: any) => Promise<unknown>) => callback(tx)),
    aiWriteIdempotency: {
      findUnique: jest.fn(),
    },
  };
  service.eventRepository = { emit: jest.fn().mockResolvedValue(undefined) };
  return service;
}

function createTransaction() {
  const tx = {
    aiWriteIdempotency: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'reservation-1' }),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    },
    quiz: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'quiz-1', slug: 'python-co-ban', title: 'Python cơ bản', is_active: false,
      }),
    },
    question: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'question-1' }),
    },
    questionOption: {
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
  };
  return tx;
}

describe('QuizService.createQuizWithQuestions', () => {
  it('creates the quiz and questions in one transaction with an idempotency record', async () => {
    const tx = createTransaction();
    const service = createService(tx);

    const result = await service.createQuizWithQuestions(payload, 'user-1', 'request-1');

    expect(service.prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.aiWriteIdempotency.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        user_id: 'user-1',
        idempotency_key: 'request-1',
        operation: 'create_quiz_with_questions',
        status: 'PROCESSING',
      }),
    }));
    expect(tx.questionOption.createMany).toHaveBeenCalledTimes(1);
    expect(tx.aiWriteIdempotency.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'COMPLETED' }),
    }));
    expect(result).toEqual(expect.objectContaining({
      id: 'quiz-1', questions_created: 1, partial_failure: false,
    }));
    expect(service.eventRepository.emit).toHaveBeenCalledWith('QuizCreated', { id: 'quiz-1' });
    expect(service.eventRepository.emit).toHaveBeenCalledWith('QuestionCreated', {
      id: 'question-1', quizId: 'quiz-1',
    });
  });

  it('rejects a reused key with a different payload', async () => {
    const tx = createTransaction();
    tx.aiWriteIdempotency.findUnique.mockResolvedValue({
      id: 'reservation-1',
      request_hash: 'different-hash',
      status: 'COMPLETED',
      response: { id: 'quiz-old' },
      expires_at: new Date(Date.now() + 60_000),
    });
    const service = createService(tx);

    await expect(service.createQuizWithQuestions(payload, 'user-1', 'request-1'))
      .rejects.toBeInstanceOf(ConflictException);
    expect(tx.quiz.create).not.toHaveBeenCalled();
  });

  it('requires an idempotency key before touching the database', async () => {
    const tx = createTransaction();
    const service = createService(tx);

    await expect(service.createQuizWithQuestions(payload, 'user-1', undefined))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(service.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('fails the transaction when a question insert fails', async () => {
    const tx = createTransaction();
    tx.question.create.mockRejectedValue(new Error('question insert failed'));
    const service = createService(tx);

    await expect(service.createQuizWithQuestions(payload, 'user-1', 'request-1'))
      .rejects.toThrow('question insert failed');
    expect(tx.aiWriteIdempotency.update).not.toHaveBeenCalled();
  });
});
