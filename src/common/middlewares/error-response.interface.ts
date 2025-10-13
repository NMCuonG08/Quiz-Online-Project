import { ErrorCode } from './error-codes.enum';

export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
  value?: any;
  constraint?: any; // Changed from string to any to support constraint objects
}

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  };
  timestamp: string;
  path?: string;
  method?: string;
}
