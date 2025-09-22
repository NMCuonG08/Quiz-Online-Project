# Redis Configuration Guide

## Cách cấu hình Redis trong dự án này

### Option 1: Sử dụng REDIS_URL (Khuyến nghị cho production)

Thêm vào file `.env` hoặc `.env.local`:

```bash
REDIS_URL="redis://username:password@host:port/db"
```

**Ví dụ:**
- Local Redis: `REDIS_URL="redis://localhost:6379/0"`
- Redis Cloud: `REDIS_URL="rediss://username:password@host:port/db"`
- Redis với password: `REDIS_URL="redis://:password@localhost:6379/0"`

### Option 2: Sử dụng các biến riêng lẻ (Fallback)

```bash
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"
REDIS_USERNAME=""
REDIS_PASSWORD=""
REDIS_DB="0"
REDIS_TLS="false"
REDIS_TTL="60"
REDIS_KEY_PREFIX="app:"
```

## Cách Redis Service hoạt động

1. **Ưu tiên REDIS_URL**: Service sẽ kiểm tra biến `REDIS_URL` trước
2. **Fallback**: Nếu không có `REDIS_URL`, sẽ sử dụng cấu hình từ `redis.*` config
3. **TLS Support**: Tự động detect TLS từ URL (`rediss://`)
4. **Logging**: Có logging chi tiết để debug kết nối

## Debugging

Để debug vấn đề kết nối Redis:

1. Kiểm tra logs khi khởi động app
2. Xem console.log output để biết URL nào đang được sử dụng
3. Đảm bảo Redis server đang chạy và accessible
4. Kiểm tra firewall/network settings

## Lưu ý

- Redis Service và BullModule sử dụng cùng cấu hình từ `configuration.ts`
- Service sẽ tự động reconnect nếu mất kết nối
- TLS được hỗ trợ cho Redis Cloud và các Redis server có SSL