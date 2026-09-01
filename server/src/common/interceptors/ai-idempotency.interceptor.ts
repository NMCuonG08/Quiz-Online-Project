import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { catchError, from, mergeMap, Observable, throwError } from 'rxjs';
import { PrismaService } from '@/infrastructure/database/prisma.service';

type RequestWithAuth = {
  headers: Record<string, string | string[] | undefined>;
  params?: Record<string, unknown>;
  body?: unknown;
  user?: { user?: { id?: string } };
};

@Injectable()
export class AiIdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const operation = context.getHandler().name;
    if (operation === 'createQuizWithQuestions') return next.handle();

    const rawKey = request.headers['idempotency-key'];
    const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
    const userId = request.user?.user?.id;
    if (!key || !userId) return next.handle();
    if (key.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(key)) {
      throw new BadRequestException('Idempotency-Key is invalid');
    }

    const requestHash = createHash('sha256')
      .update(JSON.stringify({ params: request.params || {}, body: request.body || null }))
      .digest('hex');

    return from(this.reserve(userId, key, operation, requestHash)).pipe(
      mergeMap((reservation) => {
        if (reservation.replay) return from([reservation.response]);
        return next.handle().pipe(
          mergeMap((response) => from(this.complete(reservation.id, response)).pipe(mergeMap(() => from([response])))),
          catchError((error: unknown) => from(this.release(reservation.id)).pipe(
            mergeMap(() => throwError(() => error)),
          )),
        );
      }),
    );
  }

  private async reserve(userId: string, key: string, operation: string, requestHash: string) {
    const existing = await this.prisma.aiWriteIdempotency.findUnique({
      where: { user_id_idempotency_key: { user_id: userId, idempotency_key: key } },
    });
    if (existing && existing.expires_at <= new Date()) {
      await this.prisma.aiWriteIdempotency.delete({ where: { id: existing.id } });
    } else if (existing) {
      if (existing.request_hash !== requestHash || existing.operation !== operation) {
        throw new ConflictException('IDEMPOTENCY_KEY_REUSED: payload khác với request trước đó');
      }
      if (existing.status === 'COMPLETED' && existing.response !== null) {
        return { id: existing.id, replay: true, response: existing.response };
      }
      throw new ConflictException('IDEMPOTENCY_REQUEST_IN_PROGRESS: request đang được xử lý');
    }

    try {
      const reservation = await this.prisma.aiWriteIdempotency.create({
        data: {
          user_id: userId,
          idempotency_key: key,
          operation,
          request_hash: requestHash,
          status: 'PROCESSING',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      return { id: reservation.id, replay: false, response: null };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const committed = await this.prisma.aiWriteIdempotency.findUnique({
          where: { user_id_idempotency_key: { user_id: userId, idempotency_key: key } },
        });
        if (committed?.request_hash === requestHash && committed.operation === operation
          && committed.status === 'COMPLETED' && committed.response !== null) {
          return { id: committed.id, replay: true, response: committed.response };
        }
        throw new ConflictException('IDEMPOTENCY_REQUEST_IN_PROGRESS: request đang được xử lý');
      }
      throw error;
    }
  }

  private async complete(id: string, response: unknown) {
    const safeResponse = JSON.parse(JSON.stringify(response ?? null)) as Prisma.InputJsonValue;
    await this.prisma.aiWriteIdempotency.update({
      where: { id },
      data: { status: 'COMPLETED', response: safeResponse },
    });
  }

  private async release(id: string) {
    await this.prisma.aiWriteIdempotency.delete({ where: { id } }).catch(() => undefined);
  }
}
