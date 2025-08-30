# RBAC (Role-Based Access Control) System

## 🎯 Tổng quan

Hệ thống RBAC đã được thiết lập hoàn chỉnh với tất cả permissions từ enum `Permission` và 2 role cơ bản (user và admin). Hệ thống này cung cấp:

- ✅ **Tất cả permissions** từ enum `Permission` đã được thêm vào database
- ✅ **2 roles cơ bản**: `user` và `admin`
- ✅ **Service quản lý** role và permission
- ✅ **Guard kiểm tra** permission
- ✅ **API endpoints** để quản lý RBAC
- ✅ **Seeder** để khởi tạo dữ liệu
- ✅ **Tests** để kiểm tra functionality

## 🚀 Cài đặt nhanh

### 1. Chạy Migration
```bash
npx prisma migrate dev
```

### 2. Seed RBAC Data
```bash
npm run seed:rbac
```

### 3. Kiểm tra kết quả
Sau khi chạy seeder, bạn sẽ thấy:
- 🌱 Tất cả permissions được tạo trong database
- 👤 Role `user` với các permission cơ bản
- 👑 Role `admin` với tất cả permissions

## 📁 Cấu trúc Files

```
src/common/
├── enums/
│   └── permisson.ts              # Enum chứa tất cả permissions
├── services/
│   └── rbac.service.ts           # Service quản lý RBAC
├── guards/
│   └── permission.guard.ts       # Guard kiểm tra permission
├── decorators/
│   └── permissions.decorator.ts  # Decorator cho permission
├── controllers/
│   └── rbac.controller.ts        # API endpoints quản lý RBAC
├── seeders/
│   ├── rbac.seeder.ts            # Seeder cho RBAC
│   └── seed-rbac.command.ts      # Command line seeder
└── rbac/
    ├── rbac.module.ts            # Module tổ chức RBAC
    ├── index.ts                  # Export tất cả RBAC components
    └── rbac.test.ts              # Tests cho RBAC

prisma/
└── seed.ts                       # Prisma seed file

docs/
└── RBAC_SETUP.md                 # Hướng dẫn chi tiết
```

## 🔧 Sử dụng

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

## 📊 Roles và Permissions

### Role: `user` (67 permissions)
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

### Role: `admin` (Tất cả permissions - 188 permissions)
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

## 🌐 API Endpoints

### Quản lý Role:
- `GET /rbac/roles` - Lấy tất cả roles
- `GET /rbac/roles/:name` - Lấy role theo tên
- `POST /rbac/roles` - Tạo role mới
- `PUT /rbac/roles/:roleId` - Cập nhật role
- `DELETE /rbac/roles/:roleId` - Xóa role

### Quản lý Permission:
- `GET /rbac/permissions` - Lấy tất cả permissions
- `GET /rbac/permissions/:key` - Lấy permission theo key

### Quản lý User Role:
- `GET /rbac/users/:userId/roles` - Lấy roles của user
- `GET /rbac/users/:userId/permissions` - Lấy permissions của user
- `POST /rbac/users/:userId/roles/:roleId` - Gán role cho user
- `DELETE /rbac/users/:userId/roles/:roleId` - Xóa role của user

### Quản lý Role Permission:
- `POST /rbac/roles/:roleId/permissions/:permissionId` - Gán permission cho role
- `DELETE /rbac/roles/:roleId/permissions/:permissionId` - Xóa permission của role

### Thống kê:
- `GET /rbac/statistics` - Thống kê roles và permissions

## 🧪 Testing

Chạy tests:
```bash
npm test src/common/rbac/rbac.test.ts
```

## 🔄 Tùy chỉnh

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

## ⚠️ Lưu ý quan trọng

1. **Tất cả API endpoints của RBAC** đều yêu cầu admin permissions
2. **Permission `Permission.All`** cho phép truy cập tất cả
3. **Seeder sử dụng `upsert`** để tránh duplicate data
4. **Khi xóa role**, tất cả user roles và role permissions sẽ bị xóa theo
5. **Cần import `RbacModule`** vào `AppModule` để sử dụng

## 🐛 Troubleshooting

### Lỗi Permission Denied:
- Kiểm tra user có được gán role chưa
- Kiểm tra role có permission cần thiết không
- Sử dụng `getUserPermissions(userId)` để debug

### Lỗi Database:
- Chạy migration: `npx prisma migrate dev`
- Reset database: `npx prisma migrate reset`
- Chạy lại seeder: `npm run seed:rbac`

### Lỗi Import:
- Kiểm tra `RbacModule` đã được import vào `AppModule`
- Kiểm tra đường dẫn import có đúng không

## 📈 Kết quả

Sau khi hoàn thành setup, bạn sẽ có:

✅ **188 permissions** trong database  
✅ **2 roles** (user và admin)  
✅ **67 permissions** cho role user  
✅ **188 permissions** cho role admin  
✅ **API endpoints** để quản lý RBAC  
✅ **Guard và decorator** để bảo vệ routes  
✅ **Service** để quản lý role và permission  
✅ **Tests** để đảm bảo functionality  

Hệ thống RBAC đã sẵn sàng để sử dụng! 🎉 