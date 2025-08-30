# Hướng dẫn cấu hình Prisma và chạy Seed Data

## 📋 Mục lục
1. [Cài đặt Prisma](#cài-đặt-prisma)
2. [Cấu hình Database](#cấu-hình-database)
3. [Schema Prisma](#schema-prisma)
4. [Migration](#migration)
5. [Seed Data](#seed-data)
6. [Các lệnh hữu ích](#các-lệnh-hữu-ích)
7. [Troubleshooting](#troubleshooting)

## 🚀 Cài đặt Prisma

### 1. Cài đặt dependencies
```bash
npm install @prisma/client
npm install -D prisma
```

### 2. Khởi tạo Prisma
```bash
npx prisma init
```

## 🗄️ Cấu hình Database

### 1. Cấu hình DATABASE_URL
Tạo file `.env` trong thư mục gốc và thêm cấu hình database:

```env
# PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"

# MySQL
DATABASE_URL="mysql://username:password@localhost:3306/database_name"

# SQLite
DATABASE_URL="file:./dev.db"
```

### 2. Cấu hình trong schema.prisma
File `prisma/schema.prisma` đã được cấu hình sẵn:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // hoặc "mysql", "sqlite"
  url      = env("DATABASE_URL")
}
```

## 📊 Schema Prisma

### Các model hiện có:
- **User**: Quản lý người dùng
- **Role**: Quản lý vai trò
- **AppPermission**: Quản lý quyền hạn
- **UserRole**: Quan hệ nhiều-nhiều giữa User và Role
- **RolePermission**: Quan hệ nhiều-nhiều giữa Role và Permission

### Cấu trúc RBAC (Role-Based Access Control):
```
User ←→ UserRole ←→ Role ←→ RolePermission ←→ AppPermission
```

## 🔄 Migration

### 1. Tạo migration
```bash
npx prisma migrate dev --name init
```

### 2. Chạy migration trên production
```bash
npx prisma migrate deploy
```

### 3. Reset database (chỉ dùng cho development)
```bash
npx prisma migrate reset
```

### 4. Xem trạng thái migration
```bash
npx prisma migrate status
```

## 🌱 Seed Data

### 1. Cấu hình seed script
Trong `package.json` đã có sẵn script:
```json
{
  "scripts": {
    "prisma:seed": "ts-node prisma/seed.ts"
  }
}
```

### 2. Chạy seed data
```bash
# Cách 1: Sử dụng npm script
npm run prisma:seed

# Cách 2: Chạy trực tiếp
npx ts-node prisma/seed.ts

# Cách 3: Chạy sau khi reset database
npx prisma migrate reset
```

### 3. Nội dung seed data
File `prisma/seed.ts` sẽ tạo:
- **Permissions**: Tất cả các quyền hạn từ enum `Permission`
- **User Role**: Vai trò người dùng thường với các quyền cơ bản
- **Admin Role**: Vai trò admin với tất cả quyền hạn

### 4. Cấu hình seed trong schema.prisma
Thêm vào cuối file `schema.prisma`:
```prisma
/// @seed="ts-node prisma/seed.ts"
```

## 🛠️ Các lệnh hữu ích

### Prisma Client
```bash
# Generate Prisma Client
npx prisma generate

# Studio (GUI để xem database)
npx prisma studio

# Format schema
npx prisma format

# Validate schema
npx prisma validate
```

### Database
```bash
# Push schema trực tiếp (không tạo migration)
npx prisma db push

# Pull schema từ database
npx prisma db pull

# Introspect database
npx prisma db introspect
```

### Development
```bash
# Reset database và chạy seed
npx prisma migrate reset

# Chạy seed sau khi reset
npx prisma migrate reset --seed

# Xem logs
npx prisma migrate dev --create-only
```

## 🔧 Troubleshooting

### 1. Lỗi kết nối database
```bash
# Kiểm tra kết nối
npx prisma db pull

# Kiểm tra DATABASE_URL
echo $DATABASE_URL
```

### 2. Lỗi migration
```bash
# Reset migration history
npx prisma migrate reset

# Xóa thư mục migrations và tạo lại
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

### 3. Lỗi seed
```bash
# Kiểm tra TypeScript
npx tsc --noEmit

# Chạy seed với debug
DEBUG=* npm run prisma:seed
```

### 4. Lỗi Prisma Client
```bash
# Regenerate client
npx prisma generate

# Clear cache
rm -rf node_modules/.prisma
npm install
```

## 📝 Ví dụ sử dụng

### 1. Tạo user mới với role
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createUserWithRole() {
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      username: 'user123',
      password: 'hashedPassword',
      roles: {
        create: {
          role: {
            connect: {
              name: 'user'
            }
          }
        }
      }
    }
  });
  
  console.log('User created:', user);
}
```

### 2. Kiểm tra quyền hạn
```typescript
async function checkUserPermissions(userId: string, permissionKey: string) {
  const userPermissions = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  const hasPermission = userPermissions?.roles.some(userRole =>
    userRole.role.rolePermissions.some(rolePermission =>
      rolePermission.permission.key === permissionKey
    )
  );

  return hasPermission;
}
```

## 🎯 Best Practices

1. **Luôn backup database trước khi chạy migration**
2. **Test migration trên staging trước khi deploy production**
3. **Sử dụng transactions cho các operation phức tạp**
4. **Index các trường thường query**
5. **Sử dụng Prisma Studio để debug data**
6. **Log các operation quan trọng**

## 📚 Tài liệu tham khảo

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
- [Database Seeding](https://www.prisma.io/docs/guides/database/seed-database)
