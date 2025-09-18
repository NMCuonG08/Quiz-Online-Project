export class ResponseDto<T> {
  success: boolean;
  error: boolean;
  statusCode: number;
  message: string;
  data?: T;
  constructor(statusCode: number, message: string, data?: T) {
    this.success = true;

    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

export class PaginationQueryDto {
  page?: number = 1;
  limit?: number = 10;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class PaginationDto {
  page: number;
  limit: number;
  total: number; // number of items in the current page
  totalItems: number; // overall number of items matching the query
  totalPages: number;
  hasNext: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  hasPrev: boolean;

  constructor(
    page: number,
    limit: number,
    totalItems: number,
    count: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ) {
    this.page = page;
    this.limit = limit;
    this.total = count;
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
    this.totalItems = totalItems;
    this.totalPages = Math.ceil(totalItems / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}

export class PaginatedResponseDto<T> {
  items: T[];
  pagination: PaginationDto;

  constructor(items: T[], page: number, limit: number, total: number) {
    this.items = items;
    this.pagination = new PaginationDto(page, limit, total, items.length);
  }
}

export type SafeUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  roles?: string[];
};
