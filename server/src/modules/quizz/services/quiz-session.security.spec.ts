import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { QuizSessionService } from './quiz-session.service';

describe('QuizSessionService security contracts', () => {
  function createService(prisma: Record<string, unknown>) {
    const service = Object.create(
      QuizSessionService.prototype,
    ) as QuizSessionService;
    Object.assign(service as unknown as Record<string, unknown>, { prisma });
    return service;
  }

  it('never assigns anonymous attempts to an arbitrary database user', async () => {
    const service = createService({});
    await expect(
      service.startSession(undefined, { quiz_slug: 'ai' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects questions outside the attempt quiz', async () => {
    const service = createService({
      quizAttempt: {
        findUnique: jest.fn().mockResolvedValue({
          user_id: 'user-1',
          quiz_id: 'quiz-1',
          status: 'IN_PROGRESS',
        }),
      },
      question: { findFirst: jest.fn().mockResolvedValue(null) },
    });

    await expect(
      service.submitAnswer(
        'attempt-1',
        { question_id: 'question-other' },
        'user-1',
        false,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects options that do not belong to the attempt question', async () => {
    const service = createService({
      quizAttempt: {
        findUnique: jest.fn().mockResolvedValue({
          user_id: 'user-1',
          quiz_id: 'quiz-1',
          status: 'IN_PROGRESS',
        }),
      },
      question: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'question-1',
          points: 1,
          options: [{ id: 'option-1', is_correct: true }],
        }),
      },
    });

    await expect(
      service.submitAnswer(
        'attempt-1',
        {
          question_id: 'question-1',
          selected_option_id: 'option-foreign',
        },
        'user-1',
        false,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not auto-mark text answers correct when no correct options exist', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'response-1' });
    const service = createService({
      quizAttempt: {
        findUnique: jest.fn().mockResolvedValue({
          user_id: 'user-1',
          quiz_id: 'quiz-1',
          status: 'IN_PROGRESS',
        }),
      },
      question: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'question-1', points: 1, options: [] }),
      },
      questionResponse: {
        findUnique: jest.fn().mockResolvedValue(null),
        create,
      },
    });

    await service.submitAnswer(
      'attempt-1',
      { question_id: 'question-1', text_answer: 'Câu trả lời' },
      'user-1',
      false,
    );

    expect(create.mock.calls[0][0].data.is_correct).toBe(false);
    expect(create.mock.calls[0][0].data.points_earned).toBe(0);
  });
});
