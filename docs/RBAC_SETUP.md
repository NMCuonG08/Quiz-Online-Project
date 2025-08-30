# RBAC (Role-Based Access Control) Setup Guide

## Tổng quan

Hệ thống RBAC đã được thiết lập với các thành phần sau:

- **Permissions**: Tất cả các permission từ enum `Permission`
- **Roles**: 2 role cơ bản (user và admin)
- **Services**: Quản lý role và permission
- **Guards**: Kiểm tra permission
- **Controllers**: API quản lý RBAC

## Cấu trúc Database

### Bảng chính:
- `users`: Thông tin người dùng
- `roles`: Các vai trò trong hệ thống
- `permissions`: Các quyền hạn
- `user_roles`: Liên kết user với role
- `role_permissions`: Liên kết role với permission

## Cài đặt và Chạy

### 1. Chạy Migration
```bash
npx prisma migrate dev
```

### 2. Seed RBAC Data
```bash
npm run seed:rbac
```

Hoặc chạy trực tiếp:
```bash
ts-node src/seed-rbac.ts
```

### 3. Kiểm tra kết quả
Sau khi chạy seeder, bạn sẽ thấy:
- Tất cả permissions được tạo trong database
- 2 roles: `user` và `admin`
- Role `admin` có tất cả permissions
- Role `user` có các permission cơ bản

## Sử dụng

### 1. Kiểm tra Permission trong Controller

```typescript
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { Permission } from '@/common/enums/permisson';

@Controller('example')
export class ExampleController {
  @Get()
  @RequirePermissions(Permission.UserRead)
  async getUsers() {
    // Chỉ user có permission UserRead mới có thể truy cập
  }

  @Post()
  @RequirePermissions(Permission.UserCreate, Permission.AdminUserCreate)
  async createUser() {
    // User cần có ít nhất một trong hai permission
  }
}
```

### 2. Sử dụng RBAC Service

```typescript
import { RbacService } from '@/common/services/rbac.service';

@Injectable()
export class SomeService {
  constructor(private rbacService: RbacService) {}

  async someMethod(userId: string) {
    // Kiểm tra permission
    const hasPermission = await this.rbacService.hasPermission(
      userId, 
      Permission.UserRead
    );

    // Lấy tất cả permission của user
    const userPermissions = await this.rbacService.getUserPermissions(userId);

    // Gán role cho user
    await this.rbacService.assignRoleToUser(userId, roleId);
  }
}
```

### 3. API Endpoints

#### Quản lý Role:
- `GET /rbac/roles` - Lấy tất cả roles
- `GET /rbac/roles/:name` - Lấy role theo tên
- `POST /rbac/roles` - Tạo role mới
- `PUT /rbac/roles/:roleId` - Cập nhật role
- `DELETE /rbac/roles/:roleId` - Xóa role

#### Quản lý Permission:
- `GET /rbac/permissions` - Lấy tất cả permissions
- `GET /rbac/permissions/:key` - Lấy permission theo key

#### Quản lý User Role:
- `GET /rbac/users/:userId/roles` - Lấy roles của user
- `GET /rbac/users/:userId/permissions` - Lấy permissions của user
- `POST /rbac/users/:userId/roles/:roleId` - Gán role cho user
- `DELETE /rbac/users/:userId/roles/:roleId` - Xóa role của user

#### Quản lý Role Permission:
- `POST /rbac/roles/:roleId/permissions/:permissionId` - Gán permission cho role
- `DELETE /rbac/roles/:roleId/permissions/:permissionId` - Xóa permission của role

#### Thống kê:
- `GET /rbac/statistics` - Thống kê roles và permissions

## Roles và Permissions

### Role: `user`
Có các permission cơ bản:
- Asset management (read, upload, download, share)
- Album management (create, read, update, delete, share)
- Face recognition
- Library management
- Memory management
- Person management
- Session management
- Tag management
- User profile management
- Timeline access
- Duplicate detection
- Archive access

### Role: `admin`
Có tất cả permissions trong hệ thống, bao gồm:
- Tất cả permissions của role `user`
- Activity management
- API Key management
- Server management
- System configuration
- Admin user management
- Partner management
- Notification management
- Job management
- Sync management
- License management

## Tùy chỉnh

### Thêm Permission mới:
1. Thêm vào enum `Permission` trong `src/common/enums/permisson.ts`
2. Chạy lại seeder: `npm run seed:rbac`

### Tạo Role mới:
```typescript
const newRole = await rbacService.createRole('moderator', 'Moderator role');
await rbacService.assignPermissionToRole(newRole.id, permissionId);
```

### Gán Role cho User:
```typescript
await rbacService.assignRoleToUser(userId, roleId);
```

## Lưu ý

1. Tất cả API endpoints của RBAC đều yêu cầu admin permissions
2. Permission `Permission.All` cho phép truy cập tất cả
3. Seeder sử dụng `upsert` để tránh duplicate data
4. Khi xóa role, tất cả user roles và role permissions sẽ bị xóa theo

## Troubleshooting

### Lỗi Permission Denied:
- Kiểm tra user có được gán role chưa
- Kiểm tra role có permission cần thiết không
- Sử dụng `getUserPermissions(userId)` để debug

### Lỗi Database:
- Chạy migration: `npx prisma migrate dev`
- Reset database: `npx prisma migrate reset`
- Chạy lại seeder: `npm run seed:rbac` 