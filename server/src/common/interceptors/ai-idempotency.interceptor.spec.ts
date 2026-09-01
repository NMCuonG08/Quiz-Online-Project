import { firstValueFrom, of } from 'rxjs';
import { AiIdempotencyInterceptor } from './ai-idempotency.interceptor';

function contextFor(request: any, operation = 'updateQuiz') {
  return {
    getHandler: () => ({ name: operation }),
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;
}

describe('AiIdempotencyInterceptor', () => {
  it('reserves and completes a keyed request', async () => {
    const prisma = {
      aiWriteIdempotency: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'reservation-1' }),
        update: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn(),
      },
    };
    const interceptor = new AiIdempotencyInterceptor(prisma as never);
    const request = {
      headers: { 'idempotency-key': 'key-1' },
      params: { id: 'quiz-1' },
      body: { title: 'Updated' },
      user: { user: { id: 'user-1' } },
    };

    const result = await firstValueFrom(interceptor.intercept(contextFor(request), {
      handle: () => of({ id: 'quiz-1', ok: true }),
    }));

    expect(result).toEqual({ id: 'quiz-1', ok: true });
    expect(prisma.aiWriteIdempotency.create).toHaveBeenCalled();
    expect(prisma.aiWriteIdempotency.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'reservation-1' },
      data: expect.objectContaining({ status: 'COMPLETED' }),
    }));
  });

  it('replays a completed request without invoking the handler', async () => {
    const prisma = {
      aiWriteIdempotency: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'reservation-1',
          operation: 'updateQuiz',
          request_hash: expect.any(String),
          status: 'COMPLETED',
          response: { id: 'quiz-1', ok: true },
          expires_at: new Date(Date.now() + 60_000),
        }),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const interceptor = new AiIdempotencyInterceptor(prisma as never);
    const request = {
      headers: { 'idempotency-key': 'key-1' },
      params: { id: 'quiz-1' },
      body: { title: 'Updated' },
      user: { user: { id: 'user-1' } },
    };
    const handler = jest.fn(() => of({ unexpected: true }));

    // Use the actual request hash from a first reservation-shaped record.
    const crypto = require('crypto');
    prisma.aiWriteIdempotency.findUnique.mockResolvedValueOnce({
      id: 'reservation-1', operation: 'updateQuiz',
      request_hash: crypto.createHash('sha256').update(JSON.stringify({
        params: request.params, body: request.body,
      })).digest('hex'),
      status: 'COMPLETED', response: { id: 'quiz-1', ok: true },
      expires_at: new Date(Date.now() + 60_000),
    });

    await expect(firstValueFrom(interceptor.intercept(contextFor(request), { handle: handler })))
      .resolves.toEqual({ id: 'quiz-1', ok: true });
    expect(handler).not.toHaveBeenCalled();
  });
});
