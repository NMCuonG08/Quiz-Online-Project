# Demo: Hệ thống Exception Mới

## Test Validation Errors

### 1. Test với CreateUserDto

Gửi request POST đến `/api/users/test-validation` với data không hợp lệ:

```json
{
  "email": "invalid-email",
  "password": "123",
  "age": 15,
  "username": "ab"
}
```

### 2. Expected Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "email must be an email",
        "code": "INVALID_EMAIL",
        "value": "invalid-email"
      },
      {
        "field": "password",
        "message": "password must be longer than or equal to 8 characters",
        "code": "MIN_LENGTH",
        "value": "123",
        "constraint": {
          "min": 8
        }
      },
      {
        "field": "age",
        "message": "age must not be less than 18",
        "code": "OUT_OF_RANGE",
        "value": 15,
        "constraint": {
          "min": 18
        }
      },
      {
        "field": "username",
        "message": "username must be longer than or equal to 3 characters",
        "code": "MIN_LENGTH",
        "value": "ab",
        "constraint": {
          "min": 3
        }
      }
    ]
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "path": "/api/users/test-validation",
  "method": "POST"
}
```

## Test Custom Exceptions

### 1. ValidationException với Details

```typescript
import { ValidationException } from '@/common/exceptions';

throw new ValidationException('Custom validation failed', [
  {
    field: 'email',
    message: 'Email is already taken',
    code: 'DUPLICATE_EMAIL',
    value: 'user@example.com'
  },
  {
    field: 'age',
    message: 'Age must be at least 18',
    code: 'MIN_AGE',
    value: 16,
    constraint: { min: 18 }
  }
]);
```

### 2. ResourceNotFoundException

```typescript
import { ResourceNotFoundException } from '@/common/exceptions';

throw new ResourceNotFoundException('User', 'user-123');
```

Response:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User with id user-123 not found"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Các Error Codes Mới

### Validation Error Codes
- `REQUIRED` - Field bắt buộc
- `INVALID_EMAIL` - Email không hợp lệ
- `MIN_LENGTH` - Độ dài tối thiểu
- `MAX_LENGTH` - Độ dài tối đa
- `OUT_OF_RANGE` - Giá trị nằm ngoài phạm vi
- `INVALID_VALUE` - Giá trị không hợp lệ
- `INVALID_FORMAT` - Format không đúng

### Constraint Objects
Hệ thống tự động extract constraint information:

```typescript
// @MinLength(8)
constraint: { min: 8 }

// @Max(100)
constraint: { max: 100 }

// @Min(18) @Max(100)
constraint: { min: 18, max: 100 }

// @Matches(/^[A-Za-z]+$/)
constraint: { pattern: "/^[A-Za-z]+$/" }
```

## Lợi ích của Hệ thống Mới

1. **Format chuẩn**: Tất cả lỗi đều có format giống nhau
2. **Error codes chi tiết**: Dễ dàng xử lý ở frontend
3. **Constraint objects**: Thông tin chi tiết về validation rules
4. **Field mapping**: Dễ dàng map lỗi với UI fields
5. **Value tracking**: Biết được giá trị gây lỗi
6. **Consistent**: Nhất quán trong toàn bộ application

## Frontend Integration

```typescript
// Frontend có thể dễ dàng xử lý errors
const handleError = (error: any) => {
  if (error.error?.details) {
    error.error.details.forEach((detail: any) => {
      // Map field với UI element
      const fieldElement = document.querySelector(`[name="${detail.field}"]`);
      if (fieldElement) {
        // Hiển thị error message
        showFieldError(detail.field, detail.message);
        
        // Highlight field có lỗi
        highlightErrorField(detail.field);
      }
    });
  }
};
``` 