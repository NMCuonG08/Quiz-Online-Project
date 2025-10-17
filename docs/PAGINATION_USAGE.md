# Pagination Usage Guide

## Overview
The quiz endpoints now support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Field to sort by (optional)
- `sortOrder`: Sort order - 'asc' or 'desc' (optional)

## API Endpoints

### Get All Quizzes with Pagination
```
GET /api/quizzes?page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

### Get Quizzes by Category with Pagination
```
GET /api/quizzes/category/{categoryId}?page=1&limit=5&sortBy=title&sortOrder=asc
```

## Response Format

The API returns a `PaginatedResponseDto` with the following structure:

```json
{
  "items": [
    {
      "id": "quiz-id",
      "title": "Quiz Title",
      "description": "Quiz Description",
      "categoryId": "category-id",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalItems": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false,
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

## Validation Rules

- `page`: Must be a positive integer (minimum 1)
- `limit`: Must be a positive integer (minimum 1)
- `sortBy`: Must be a valid field name (string)
- `sortOrder`: Must be either 'asc' or 'desc'

## Examples

### Basic Pagination
```bash
curl "http://localhost:3000/api/quizzes?page=2&limit=5"
```

### With Sorting
```bash
curl "http://localhost:3000/api/quizzes?page=1&limit=10&sortBy=title&sortOrder=asc"
```

### Get Quizzes by Category
```bash
curl "http://localhost:3000/api/quizzes/category/category-id?page=1&limit=20"
```

## Error Handling

If invalid parameters are provided, the API will return a validation error:

```json
{
  "success": false,
  "error": true,
  "statusCode": 400,
  "message": "Validation failed",
  "data": {
    "errors": [
      {
        "field": "page",
        "message": "page must be a positive number",
        "value": -1
      }
    ]
  }
}
```
