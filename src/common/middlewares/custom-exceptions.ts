import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes.enum';

export class CustomHttpException extends HttpException {
  constructor(
    errorCode: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: Array<{
      field?: string;
      message: string;
      code?: string;
      value?: any;
      constraint?: any;
    }>,
  ) {
    const response = {
      error: {
        code: errorCode,
        message,
        ...(details && details.length > 0 && { details }),
      },
    };
    super(response, status);
  }
}

export class ValidationException extends CustomHttpException {
  constructor(
    message: string,
    details?: Array<{
      field?: string;
      message: string;
      code?: string;
      value?: any;
      constraint?: any;
    }>,
  ) {
    super(ErrorCode.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST, details);
  }
}
export class ConflictException extends CustomHttpException {
  constructor(message: string) {
    super(ErrorCode.CONFLICT_EXCEPTION, message, HttpStatus.CONFLICT);
  }
}

export class ResourceNotFoundException extends CustomHttpException {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(ErrorCode.RESOURCE_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

export class FileUploadException extends CustomHttpException {
  constructor(message: string) {
    super(ErrorCode.FILE_UPLOAD_FAILED, message, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidFileTypeException extends CustomHttpException {
  constructor(allowedTypes: string[]) {
    const message = `Invalid file type. Only ${allowedTypes.join(', ')} files are allowed`;
    super(ErrorCode.INVALID_FILE_TYPE, message, HttpStatus.BAD_REQUEST);
  }
}

export class NoFileProvidedException extends CustomHttpException {
  constructor() {
    super(
      ErrorCode.NO_FILE_PROVIDED,
      'No file provided',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ForbiddenException extends CustomHttpException {
  constructor(message: string) {
    super(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
  }
}

export class DatabaseOperationException extends CustomHttpException {
  constructor(operation: string, error?: Error) {
    const message = error
      ? `Failed to ${operation}: ${error.message}`
      : `Failed to ${operation}`;
    super(ErrorCode.DATABASE_ERROR, message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class ExternalServiceException extends CustomHttpException {
  constructor(service: string, operation: string, error?: Error) {
    const message = error
      ? `Failed to ${operation} on ${service}: ${error.message}`
      : `Failed to ${operation} on ${service}`;
    super(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
