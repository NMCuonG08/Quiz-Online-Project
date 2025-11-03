import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { ErrorCode } from '@/common/middlewares/error-codes.enum';

@Catch(PrismaClientKnownRequestError, PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception: PrismaClientKnownRequestError | PrismaClientValidationError,
    host: ArgumentsHost,
  ) {
    const response = host.switchToHttp().getResponse<Response>();

    // Handle validation errors (e.g., wrong type: Expected String, received Int)
    if (exception instanceof PrismaClientValidationError) {
      const message = exception.message || '';
      // Try to extract argument name and expected/received types from message
      const argMatch = message.match(/Argument `([^`]+)`/);
      const expectedMatch = message.match(/Expected ([^,\n]+)/);
      const providedMatch = message.match(/provided ([^.\n]+)/);

      const field = argMatch ? argMatch[1] : undefined;
      const expected = expectedMatch ? expectedMatch[1] : undefined;
      const received = providedMatch ? providedMatch[1] : undefined;

      return response.status(400).json({
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message:
            field && expected && received
              ? `Trường "${field}" không hợp lệ: kỳ vọng ${expected}, nhưng nhận ${received}.`
              : 'Dữ liệu gửi lên không hợp lệ.',
          details: [
            field || expected || received
              ? {
                  field,
                  message:
                    field && expected && received
                      ? `Kỳ vọng ${expected}, nhận ${received}`
                      : 'Giá trị không hợp lệ',
                }
              : undefined,
          ].filter(Boolean),
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Handle known request errors by code
    if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          response.status(409).json({
            error: {
              code: ErrorCode.DUPLICATE_ENTRY,
              message: 'Dữ liệu đã tồn tại (trùng khóa)',
            },
            timestamp: new Date().toISOString(),
          });
          break;
        case 'P2003':
          response.status(400).json({
            error: {
              code: ErrorCode.CONSTRAINT_VIOLATION,
              message: 'Vi phạm khóa ngoại',
            },
            timestamp: new Date().toISOString(),
          });
          break;
        default:
          response.status(500).json({
            error: {
              code: ErrorCode.INTERNAL_SERVER_ERROR,
              message: 'Lỗi hệ thống không xác định',
            },
            timestamp: new Date().toISOString(),
          });
      }
    } else {
      response.status(500).json({
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Lỗi hệ thống không xác định',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
