# Kiểm tra tool và function calling — 08/09/2026

Baseline: commit `7b5433f` trên `main`. Kết luận: **chưa bao phủ mọi tính năng của website**. Các lỗi đăng ký graph và hàng rào P1 đã được sửa trong working tree sau audit.

## Phạm vi và bằng chứng

- Đối chiếu catalog, intent, scope, LangGraph, adapter Responses/Chat Completions, runtime policy, approval store, HTTP wrapper và MCP server với controller NestJS và các trang frontend.
- Chạy toàn bộ `python -m unittest discover -s tests` sau sửa: **204 test, 204 đạt**. Trước sửa, test `LangGraphContractTests.test_catalog_and_langgraph_tool_constraints_match` đã bắt thiếu 8 tool social trong graph.
- Chạy `python scripts/audit_tool_coverage.py`: kiểm tra đăng ký thật của LangGraph và tái hiện lỗi bằng mock backend; không gọi model, gửi lời mời hoặc thay đổi dữ liệu người dùng.
- Script kiểm tra: [audit_tool_coverage.py](../ai-agent/scripts/audit_tool_coverage.py). Chạy script để tạo kết quả JSON cục bộ khi cần.
- Đây là kiểm tra mã nguồn, contract và runtime với mock. Chưa phải kiểm thử toàn bộ hội thoại nhiều lượt trên model/provider thật, upload Cloudinary thật, hoặc mọi quyền với database thật. Không thể suy ra “mọi trường hợp đều chạy” từ test đơn vị.

## Số lượng thực tế

Catalog có **48 tool: 27 read/presentation/planning, 21 write**. Tất cả có runtime spec nhưng **0/48 có output schema**.

| Vai trò | Scope khai báo | Tool thực sự được LangGraph cung cấp |
|---|---:|---:|
| Learner | 25 | 17 |
| Creator | 42 | 34 |
| Admin | 48 | 40 |

Responses và Chat Completions dựng schema từ catalog; LangGraph dựng danh sách bằng các hàm viết tay. Đây là nguyên nhân các đường chạy lệch nhau. Cấu hình local hiện chọn `supervisor_v1`, mặc định orchestrator trong code là `langgraph`; `LLM_API_MODE=chat_completions` không đồng nghĩa bypass LangGraph.

MCP độc lập trong `ai-agent/mcp/quiz_api_server.py` chỉ export **5 tool đọc công khai**: tìm quiz, gợi ý quiz, xem quiz, danh mục, tìm knowledge. Đây là phạm vi chủ ý của MCP, không phải 48 tool của chat agent. `MCPToolWrapper` thực chất là HTTP adapter đến NestJS.

## Lỗi đã xác nhận

### Đã sửa — 8 tool social không được đưa cho model trong LangGraph

`ai-agent/services/langgraph_runner.py:754` dựng tool riêng, không có `search_users`, `get_friends`, `get_friend_requests`, `get_friendship_status`, `get_friends_leaderboard`, `send_friend_request`, `accept_friend_request`, `remove_friendship`.

Catalog, scope và `_execute_tool_legacy` đều có các tên này. Vì vậy gọi trực tiếp adapter/runtime trong test có thể thành công nhưng model chạy qua LangGraph không nhìn thấy chúng. Test hiện có đã phát hiện lỗi này; thông báo trước đây rằng bộ tool social đã hoàn chỉnh là quá mức bằng chứng.

Đã sửa: bổ sung binding cho cả 8 tool và kiểm tra equality theo từng scope. Audit hiện trả learner 25/25, creator 42/42, admin 48/48.

### Đã sửa — `delete_category` bị khóa bởi hai yêu cầu mâu thuẫn

Catalog và graph chỉ nhận `category_id`. `_execute_tool_legacy` (`agent_core.py:3904`) yêu cầu `confirmed=True` cho mọi tool destructive, bao gồm delete_category.

- Chỉ truyền `category_id`: `DELETE_CONFIRMATION_REQUIRED`.
- Thêm `confirmed=True`: schema từ chối `Additional properties are not allowed`.

Đã sửa catalog và graph để nhận `confirmed` bắt buộc. Không có `confirmed` vẫn bị từ chối đúng; có `confirmed=true` tạo được proposal.

### Đã sửa — Approval hỏng sau khi access token đổi

`agent_core.py:3913,3963` và `state_store.py:169` ràng buộc proposal với fingerprint của **nguyên chuỗi access token**. Tái hiện: cùng user/scope, proposal còn hạn, token đổi sau refresh → approval bị báo không hợp lệ; backend mutation không được gọi.

Đã sửa fingerprint chỉ ổn định theo credential scheme; proposal vẫn ràng buộc `user_id`, `scope`, arguments hash, TTL và backend tiếp tục xác minh access token mới khi execute. Probe đổi token cùng user gọi backend thành công.

### Đã sửa — Nhận diện xác nhận nhầm cả câu phủ định

`agent_core.py:3001` tìm substring `DONG_Y`/`CONFIRM`. Hai đầu vào “Tôi không đồng ý xóa” và “Do not confirm deletion” đều trả `True` trong probe.

Đã thêm các mẫu phủ định trước khi xét mẫu đồng ý; probe cho “Tôi không đồng ý xóa” và “Do not confirm deletion” đều trả `False`. Bước Accept riêng vẫn tồn tại.

### Đã sửa — Nhánh Chat Completions legacy lỗi trước khi gọi model

`agent_core.py:3553` dùng `runtime_system_prompt(locale=locale, ...)`, nhưng `locale` không có trong tham số hay biến local của `_stream_chat_completions`. Probe trả `NameError: name 'locale' is not defined`.

Đã lấy locale từ context. Probe legacy với mock client hoàn tất; cần tiếp tục kiểm thử provider thật khi bật cấu hình legacy.

### Đã sửa — Social write chưa có idempotency thực sự ở backend

`tools.py:223` trở đi gửi `Idempotency-Key`. Tuy nhiên `FriendshipController` không gắn `AiIdempotencyInterceptor`; khai báo provider ở AppModule không biến interceptor thành global interceptor.

Đã gắn `AiIdempotencyInterceptor` vào FriendshipController và thêm provider/PrismaModule cho FriendshipModule. E2E xác nhận accept với cùng key có thể replay; cảnh báo Redis ECONNRESET trong Jest là teardown của Redis 5.0.14.

### Đã sửa — Intent chỉ đọc vẫn được cấp tool ghi

`intent_schema.py:188`: `friend_search` chứa `send_friend_request`; `friend_requests` chứa `accept_friend_request` và `remove_friendship`. `_tools_for_intent` trả intersection trước khi kiểm tra READ_ONLY_INTENTS nên không loại các write này. `quiz_resume` cũng chứa `start_quiz`, có thể là lựa chọn chủ ý nhưng cần đặt tên/risk nhất quán.

Đã tách write tools khỏi `friend_search` và `friend_requests`, đồng thời chuyển `quiz_resume` sang nhóm planner cần side effect. Audit không còn intent chỉ đọc chứa write tool.

### P2 — Không xem tiếp được dữ liệu ngoài giới hạn đầu

Tool tìm quiz, quiz của tôi và lịch sử cố định `page=1`. Danh sách bạn/lời mời cắt theo limit nhưng không có cursor/page hay total. Search user backend lấy tối đa 20 kết quả. Người dùng hỏi “xem tiếp”, “toàn bộ”, hoặc tên trùng nhiều kết quả sẽ không được bao phủ đầy đủ.

`_ensure_owned_quiz` (`tools.py:472`) còn tìm trong 1.000 quiz đầu của “me”, thay vì kiểm tra tài nguyên trực tiếp. Admin quản lý câu hỏi của creator khác cũng bị lớp này từ chối do chỉ xét quiz của mình.

### P2 — Thiếu context social và preview đủ để nhận diện người nhận

`ChatPageContext` (`protocol.py:8`) chỉ có route, selected_quiz_id, selected_knowledge_source_id; chưa có selected_user_id/conversation_id/room_id. “Nhắn cho người này”, “mời bạn này vào phòng này” chưa có định danh cấu trúc tương ứng.

Approval (`agent_core.py:4639`) rút gọn các trường `_id` còn 8 ký tự, không tra tên/avatar người nhận. Với social write, người dùng khó kiểm tra đúng người trước Accept. `get_friends_leaderboard` chỉ nhận quiz UUID; intent này chưa có search_quizzes để tìm quiz theo tên trong planner-scoped path.

### P2 — Chưa kiểm tra cấu trúc kết quả và phục hồi lỗi đủ sâu

Runtime hỗ trợ output validation nhưng mọi spec bỏ trống output_schema. HTTP wrapper giả định JSON, không có contract cho 204/file download/multipart; vì vậy không thể tái sử dụng nguyên trạng cho avatar/report.

`_approve` consume proposal trước khi thực thi. Nếu backend timeout sau khi ghi, proposal đã dùng và cần cơ chế đối soát/replay bằng cùng idempotency key để xác định kết quả. Các write chưa hỗ trợ idempotency backend càng dễ tạo thông báo thất bại không phản ánh trạng thái thật.

## Ma trận tính năng website → tool

“Có” dưới đây nghĩa là đã có khai báo và handler; không đồng nghĩa đã đạt E2E với mọi input.

| Nhóm tính năng | Đang có | Thiếu hoặc chưa hoàn chỉnh |
|---|---|---|
| Khám phá quiz | search_quizzes, recommend_quizzes, get_quiz, list_categories | Pagination; filter/sort theo mức khó, category, mới nhất, rating như website |
| Tạo/quản lý quiz | get_my_quizzes, create_quiz, create_quiz_with_questions, update_quiz, delete_quiz, publish_quiz, unpublish_quiz, get_quiz_build_status | Quản lý quiz người khác ở một số thao tác admin; thay/xóa media; kiểm tra readiness lại khi execute publish |
| Câu hỏi | list_questions, create_question, update_question, delete_question, duplicate_question, reorder_questions | Tool option riêng, thống kê option, bulk option; admin ownership; coverage chi tiết từng loại câu hỏi cần E2E |
| Làm quiz cá nhân | start_quiz, get_in_progress_quizzes, get_all_attempts, get_quiz_history, get_quiz_result | Submit/complete/delete attempt chưa có; cần quyết định sản phẩm rõ để AI không tự làm bài tính điểm thay người học |
| Phòng realtime | Không có domain tool | Tìm phòng/id/code, participants, tạo/join/mời, game state/reconnect, kết quả phòng; start_quiz hiện là lượt làm cá nhân |
| Bạn bè | 7 tool tìm/list/status/request/send/accept/remove | Cả 7 chưa được đăng ký LangGraph; phân trang, xử lý trùng tên, idempotency, preview người nhận |
| Leaderboard | get_friends_leaderboard cho một quiz | Chưa đăng ký LangGraph; leaderboard phòng realtime không được tool này bao phủ |
| Tin nhắn trực tiếp | Không có | Tạo/list conversation, lịch sử, gửi, mark-read; cần explicit send intent và preview nội dung/người nhận |
| Profile và avatar | get_current_user, get_my_permissions | Xem public profile, dashboard cá nhân, sửa profile, chọn/upload/xóa avatar qua agent |
| Thông báo | Không có | List/unread/mark-read/mark-all/archive/delete |
| Community | Không có | Posts/comments/likes; luồng đăng bài cần review nội dung |
| Đánh giá quiz | Không có | Đọc/gửi/xóa rating |
| Courses | Không có | List/detail/create/update/delete course; giao diện course categories cần đối chiếu backend riêng |
| Knowledge | search_knowledge, list_knowledge_sources, import_knowledge_url, submit_knowledge_review, review_knowledge | Get source detail, tạo source từ text, sửa source, import file; hiện chỉ search public/published |
| Danh mục | list/create/update/delete_category | delete_category đang lỗi contract; không có loại category course riêng trong catalog |
| Admin | get_admin_dashboard_stats, list_audit_events | User/roles/permissions management; weekly activity/category distribution/activity trend; export report |
| Hỗ trợ/presentation | get_current_time, web_search, search_images, plan_interaction, render_ui | Availability phụ thuộc cấu hình provider; schema form chưa có upload/file input |
| Auth và lịch sử AI | Identity, history persistence, refresh/proxy nằm trong hạ tầng | Không cần cho model cầm refresh token, đổi mật khẩu hoặc logout như tool tổng quát; run/review/history API cũng không tự động thành model tools |
| Trang nội dung/static | About, pricing, demo/calendar/form pages có trong frontend | Sự tồn tại của page không chứng minh có tính năng/backend tương ứng; không nên tính là đã hỗ trợ thanh toán/subscription |

## Điều kiện backend trước khi mở rộng quyền của AI

Trong lúc rà soát API chưa có tool, thấy `UserController` (`user.controller.ts:110` trở đi) còn các route findOne/update/updateRoles/remove không gắn AuthGuard; guard của updateRoles bị comment. `ReportsController` export cũng đang comment guard. AppModule chỉ có ThrottlerGuard global, không thay thế kiểm tra đăng nhập.

Đây là phát hiện từ mã nguồn, chưa khai thác thử các route đó. Cần chốt kiểm soát truy cập và DTO/output an toàn trước khi nối thêm admin/profile/report tools; không nên mở một tool gọi HTTP tùy ý để “cover hết”.

## Thứ tự hoàn thiện đề xuất

1. Sửa lỗi hiện hữu: đăng ký đủ 8 social tools, delete_category schema, locale legacy, confirmation phủ định, approval sau refresh và social idempotency. Bắt test catalog ↔ graph ↔ scope ↔ handler chạy bắt buộc.
2. Hoàn thiện luồng social thực tế: public profile, dashboard, conversation/message/read, room lookup/invite, pagination và context user/room/conversation. Việc gửi tin hoặc lời mời phải dựa trên ý định rõ ràng.
3. Mở rộng thông báo, rating, community, course, knowledge file upload và admin/report sau khi backend authorization được xác nhận.
4. Chạy ma trận E2E: learner/creator/admin × own/other resource × success/empty/invalid input × token refresh/401/403 × timeout/replay/concurrent requests × cả LangGraph và adapters legacy.
5. Bổ sung hội thoại nhiều lượt: trùng tên bạn, người dùng đổi người nhận, hủy trước Accept, nhiều proposal cùng lúc, reload khi chờ duyệt, mất response sau ghi, xem tiếp trang 2, không có bạn hoặc chưa có điểm.

Không đưa tỷ lệ “bao phủ website” phần trăm: 48 tool và 40 graph bindings là số đếm chính xác, nhưng số endpoint/page không tương đương số năng lực hay số trường hợp đã kiểm thử.

## Kết quả bàn giao

Đã sửa các lỗi P1 và hai lỗi P2 về idempotency social/intent scope, thêm test và script audit để tái hiện. Các mục P2 về phân trang, context social và output schema cùng phần coverage tính năng website vẫn chưa hoàn tất; cần thực hiện ở đợt tiếp theo.
