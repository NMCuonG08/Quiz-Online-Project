import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { ErrorCode } from '../exceptions/error-codes.enum';
import { ErrorResponse } from '../exceptions/error-response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as
      | string
      | {
          message?: string | string[];
          error?: string | { code: ErrorCode; message: string; details?: any };
          [key: string]: unknown;
        };

    // If the exception response already has our structured error object, pass through
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse?.error &&
      typeof exceptionResponse.error === 'object' &&
      this.isStructuredError(exceptionResponse.error)
    ) {
      const errorResponse: ErrorResponse = {
        error: exceptionResponse.error,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      };
      response.status(status).json(errorResponse);
      return;
    }

    // Map HTTP status to error code
    const errorCode = this.mapStatusToErrorCode(status);

    // Extract message
    const message = this.extractMessage(exceptionResponse, exception);

    // Extract details if available
    const details = this.extractDetails(exceptionResponse);

    const errorResponse: ErrorResponse = {
      error: {
        code: errorCode,
        message,
        ...(details.length > 0 && { details }),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    response.status(status).json(errorResponse);
  }

  private mapStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case 400: // HttpStatus.BAD_REQUEST
        return ErrorCode.VALIDATION_ERROR;
      case 401: // HttpStatus.UNAUTHORIZED
        return ErrorCode.UNAUTHORIZED;
      case 403: // HttpStatus.FORBIDDEN
        return ErrorCode.FORBIDDEN;
      case 404: // HttpStatus.NOT_FOUND
        return ErrorCode.RESOURCE_NOT_FOUND;
      case 409: // HttpStatus.CONFLICT
        return ErrorCode.DUPLICATE_ENTRY;
      case 422: // HttpStatus.UNPROCESSABLE_ENTITY
        return ErrorCode.VALIDATION_ERROR;
      case 500: // HttpStatus.INTERNAL_SERVER_ERROR
        return ErrorCode.INTERNAL_SERVER_ERROR;
      default:
        return ErrorCode.UNKNOWN_ERROR;
    }
  }

  private extractMessage(
    exceptionResponse:
      | string
      | {
          message?: string | string[];
          error?: string | { code: ErrorCode; message: string; details?: any };
          [key: string]: unknown;
        },
    exception: HttpException,
  ): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (exceptionResponse?.message) {
      const message = exceptionResponse.message;
      if (Array.isArray(message)) {
        return message[0] || exception.message;
      }
      return message;
    }

    if (exceptionResponse?.error) {
      const err = exceptionResponse.error;
      if (typeof err === 'string') return err;
      if (err && typeof err === 'object' && this.isStructuredError(err)) {
        return err.message;
      }
    }

    return exception.message;
  }

  private extractDetails(
    exceptionResponse:
      | string
      | {
          message?: string | string[];
          error?: string | { code: ErrorCode; message: string; details?: any };
          [key: string]: unknown;
        },
  ): Array<{
    field?: string;
    message: string;
    code?: string;
    value?: any;
    constraint?: any;
  }> {
    if (typeof exceptionResponse === 'string') {
      return [];
    }

    const details: Array<{
      field?: string;
      message: string;
      code?: string;
      value?: any;
      constraint?: any;
    }> = [];

    // Handle validation errors from ValidationPipe
    if (exceptionResponse?.errors && Array.isArray(exceptionResponse.errors)) {
      exceptionResponse.errors.forEach((error: Record<string, unknown>) => {
        details.push({
          field: error.field as string | undefined,
          message: error.message as string,
          code: error.code as string | undefined,
          value: error.value,
          constraint: error.constraint,
        });
      });
      return details;
    }

    // Handle validation errors from class-validator (legacy format)
    if (
      exceptionResponse?.message &&
      Array.isArray(exceptionResponse.message)
    ) {
      exceptionResponse.message.forEach((msg: string) => {
        details.push({ message: msg });
      });
    }

    // If structured error contains details, pass them through
    if (
      exceptionResponse?.error &&
      typeof exceptionResponse.error === 'object' &&
      this.isStructuredError(exceptionResponse.error) &&
      Array.isArray(exceptionResponse.error.details)
    ) {
      return exceptionResponse.error.details ?? [];
    }

    return details;
  }

  private isStructuredError(value: unknown): value is {
    code: ErrorCode;
    message: string;
    details?: Array<{
      field?: string;
      message: string;
      code?: string;
      value?: any;
      constraint?: any;
    }>;
  } {
    if (!value || typeof value !== 'object') return false;
    const maybe = value as { [k: string]: unknown };
    return typeof maybe.code === 'string' && typeof maybe.message === 'string';
  }
}
