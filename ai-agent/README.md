README - AI Agent Integration Project
Tổng quan dự án
Dự án tích hợp AI Agent vào hệ thống website có sẵn (Frontend + Backend) với 2 luồng xử lý chính:

Action Intent: Gọi API Backend cho thao tác CRUD (thêm/sửa/xóa)
Query Intent: Truy vấn data bằng SQL được sinh tự động từ metadata trong OpenSearch

Kiến trúc tổng quan
User Input (Tiếng Việt)
    ↓
AI Agent (Claude/GPT-4)
    ↓
┌─────────────────────┐
│ Intent Classifier   │
└─────────────────────┘
    ↓
    ├─→ [Action Intent] → MCP Backend API Tool → Gọi API của bạn
    │
    └─→ [Query Intent] → MCP SQL Tool → OpenSearch lấy metadata → Sinh SQL → Query DB → Trả kết quả
Cấu trúc thư mục cần tạo thêm
your-project/                    # Project hiện tại của bạn
├── frontend/                    # Code FE của bạn (đã có)
├── backend/                     # Code BE của bạn (đã có)
├── database/                    # DB của bạn (đã có)
│
└── ai-agent/                    # [MỚI] Thêm thư mục này
    ├── mcp-servers/
    │   ├── backend-api/         # MCP server gọi API backend
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   └── src/
    │   │       └── index.ts
    │   │
    │   └── sql-query/           # MCP server query database
    │       ├── package.json
    │       ├── tsconfig.json
    │       └── src/
    │           └── index.ts
    │
    ├── services/                # Agent logic
    │   └── agent-service.py     # hoặc .ts tùy bạn
    │
    ├── config/
    │   ├── mcp-config.json      # Config cho MCP servers
    │   └── .env                 # Environment variables
    │
    ├── scripts/
    │   └── sync-metadata.py     # Script đồng bộ DB schema lên OpenSearch
    │
    └── README.md                # File này
Các bước triển khai
Bước 1: Chuẩn bị OpenSearch
Mục đích: Lưu metadata của database schema để AI Agent có thể tìm kiếm và sinh SQL
Cần làm:

Cài đặt OpenSearch (hoặc dùng OpenSearch cloud)
Tạo index table_metadata với mapping phù hợp
Viết script đồng bộ schema từ database của bạn lên OpenSearch

Cấu trúc metadata cần lưu:
json{
  "table_name": "tên_bảng",
  "table_description": "mô tả bảng",
  "keywords_vi": ["từ khóa", "tiếng Việt"],
  "columns": [
    {
      "column_name": "tên_cột",
      "column_type": "kiểu_dữ_liệu",
      "column_description": "mô tả cột",
      "keywords_vi": ["từ khóa cột"]
    }
  ],
  "relationships": [...],
  "sample_queries": [...]
}
Bước 2: Tạo MCP Servers
MCP Server 1: Backend API

Mục đích: Wrapper để AI Agent gọi được API backend của bạn
Input: HTTP method, endpoint, request body
Output: Response từ backend API của bạn

MCP Server 2: SQL Query

Mục đích:

Tool 1: Search metadata từ OpenSearch
Tool 2: Execute SQL SELECT (read-only)


Input: Keywords hoặc SQL query
Output: Metadata hoặc kết quả query

Bước 3: Cấu hình MCP trong Claude Desktop/VSCode
File: ai-agent/config/mcp-config.json
json{
  "mcpServers": {
    "backend-api": {
      "command": "node",
      "args": ["./ai-agent/mcp-servers/backend-api/dist/index.js"],
      "env": {
        "BACKEND_URL": "URL_BACKEND_CỦA_BẠN",
        "API_KEY": "API_KEY_CỦA_BẠN"
      }
    },
    "sql-query": {
      "command": "node",
      "args": ["./ai-agent/mcp-servers/sql-query/dist/index.js"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "TÊN_DATABASE_CỦA_BẠN",
        "DB_USER": "readonly_user",
        "DB_PASSWORD": "password",
        "OPENSEARCH_URL": "http://localhost:9200"
      }
    }
  }
}
```

### Bước 4: Tạo Agent Service

**Nhiệm vụ của Agent**:
1. Nhận input từ user (tiếng Việt)
2. Phân tích intent (query hay action)
3. Gọi MCP tool phù hợp
4. Format kết quả trả về user

**Flow xử lý**:

**Query Intent**:
```
User: "Doanh thu tháng 1 của Hà Nội là bao nhiêu?"
  ↓
Extract keywords: ["doanh thu", "tháng 1", "Hà Nội"]
  ↓
Gọi MCP: search_table_metadata(keywords)
  ↓
Nhận metadata về bảng orders, cột revenue, created_at, store_name
  ↓
AI sinh SQL: SELECT SUM(revenue) FROM orders WHERE...
  ↓
Gọi MCP: execute_sql(sql)
  ↓
Format kết quả: "Doanh thu là 150 triệu đồng"
```

**Action Intent**:
```
User: "Thêm sản phẩm iPhone 15 giá 25 triệu"
  ↓
Extract: {name: "iPhone 15", price: 25000000}
  ↓
Gọi MCP: call_backend_api(POST, /api/products, body)
  ↓
Backend xử lý
  ↓
Format: "Đã thêm sản phẩm thành công"
Bước 5: Tích hợp vào Frontend
Option 1: Chat widget riêng

Thêm component chat vào UI hiện tại
Gọi API endpoint của Agent service
Hiển thị kết quả

Option 2: Copilot-style

Tích hợp như assistant trong VSCode
User chat trực tiếp trong app

Environment Variables cần thiết
bash# Backend API
BACKEND_URL=http://localhost:3000
BACKEND_API_KEY=your_api_key

# Database (Read-only user)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_READONLY_USER=readonly_user
DB_READONLY_PASSWORD=password

# OpenSearch
OPENSEARCH_URL=http://localhost:9200

# AI Model
ANTHROPIC_API_KEY=your_claude_api_key
# hoặc
OPENAI_API_KEY=your_openai_api_key
Security Checklist

 Tạo database user READ-ONLY riêng cho SQL queries
 Validate SQL chỉ cho phép SELECT
 Rate limiting cho API calls
 Authentication cho Agent endpoints
 Log tất cả SQL queries được thực thi
 Không expose sensitive data trong responses

Workflow làm việc

Lập trình viên của bạn làm việc với codebase hiện tại bình thường
VSCode Copilot đọc file README này để hiểu context
Khi cần implement AI Agent, Copilot sẽ biết:

Cần tạo MCP servers ở đâu
Cần gọi API backend như thế nào
Cần query OpenSearch ra sao
Cần tạo database user read-only
Workflow xử lý intent



Lưu ý quan trọng
⚠️ File này chỉ là hướng dẫn kiến trúc, KHÔNG có code cụ thể
✅ Lập trình viên cần tự implement dựa trên:

Framework đang dùng (React/Vue/Angular)
Backend framework (Node/Python/Java/Go)
Database hiện tại (PostgreSQL/MySQL/MongoDB)
API structure hiện tại

✅ MCP servers có thể viết bằng TypeScript hoặc Python
✅ Agent service có thể dùng:

Anthropic Claude API
OpenAI GPT-4 API
Hoặc self-hosted LLM

Next Steps

Đọc kỹ kiến trúc
Quyết định dùng Claude hay GPT-4
Setup OpenSearch
Tạo MCP servers
Implement agent service
Tích hợp vào FE
Test và deplo