# Kế hoạch hoàn thiện tính năng bạn bè

Ngày khảo sát: 2026-09-06. Trạng thái: đề xuất, chưa triển khai.

Kế hoạch tổng thể mới, gồm dashboard cá nhân, hồ sơ bạn bè và toàn bộ social: [social-dashboard-master-plan.vi.md](social-dashboard-master-plan.vi.md). Dùng tài liệu đó làm thứ tự triển khai chính; tài liệu này giữ khảo sát và chi tiết friend ban đầu.

## 1. Kết luận khảo sát

Dự án đã có nền tảng friend trong NestJS + Prisma/PostgreSQL và Next.js. Nên hoàn thiện module hiện tại. Mục tiêu sản phẩm: tìm người quen → kết bạn → mời nhau chơi quiz.

Đây là kết quả đọc mã nguồn trong workspace, chưa kiểm thử trên ứng dụng đang chạy và chưa xác minh database thực tế. Workspace đang có các thay đổi khác, trong đó có room gateway và giao diện; khi triển khai cần giữ nguyên và phối hợp với các thay đổi đó.

| Hạng mục | Hiện trạng | Bằng chứng trong repository |
| --- | --- | --- |
| Database | Có `Friendship`, trạng thái `PENDING`, `ACCEPTED`, `BLOCKED`; unique theo chiều `(userId, friendId)` | `server/prisma/schema.prisma:837` |
| Backend | Module đã đăng ký; có gửi, chấp nhận, xóa quan hệ/lời mời, danh sách bạn và lời mời nhận | `server/src/modules/friendships/`, `server/src/app.module.ts` |
| Tìm người dùng | Tìm theo tên/username, tối đa 20 người, loại chính mình nếu có current user hợp lệ | `server/src/modules/user/user.service.ts:50` |
| Trang cá nhân | Tab Bạn bè tại `/{locale}/user/profile`; đã gọi API tìm kiếm, gửi, chấp nhận, từ chối | `web/src/modules/client/user-profile/UserProfile.tsx`, `components/FriendsList.tsx` |
| Hủy kết bạn | Nút chỉ hiện lỗi demo; API danh sách không trả `friendshipId` để xóa | `web/src/modules/client/user-profile/components/FriendsList.tsx:197` |
| Dashboard | Carousel dùng `mockFriends`; nút See All chưa có hành động | `web/src/modules/client/user/components/FriendsCarousel.tsx` |
| Thông báo | Có model lưu trữ, API và sự kiện realtime, nhưng friendship chưa kết nối | `server/src/modules/notification/`, `web/src/lib/websocket.ts` |
| Mời vào phòng | Giao diện gửi `friend1`, `friend2`; gateway chỉ phát sự kiện, còn TODO; chưa thấy listener `room_invitation` phía web | `web/src/modules/client/pages/RoomQuizPage.tsx:107`, `server/src/modules/room-play/gateways/room-websocket.gateway.ts:897` |
| Migration/test | Chưa tìm thấy migration tạo friendships hoặc test riêng cho friendship trong các thư mục đã khảo sát | `server/prisma/migrations/`, `server/src/`, `server/test/`, `server-e2e/` |

### Các điểm cần sửa trước khi coi là hoàn chỉnh

- Chưa có danh sách lời mời đã gửi và UI thu hồi.
- Kết quả tìm kiếm chưa trả trạng thái quan hệ nên luôn hiện Kết bạn, kể cả người đã là bạn hoặc đang có lời mời.
- `findFirst` rồi `create` không ngăn được race condition: A gửi B và B gửi A đồng thời vẫn có thể tạo hai bản ghi vì unique hiện tại có hướng.
- Gửi lời mời chưa kiểm tra rõ người nhận tồn tại/chưa bị soft delete; DTO chưa kiểm tra UUID. Tìm kiếm chưa lọc `deletedAt`.
- Route tìm kiếm đang comment các decorator xác thực nhưng vẫn dùng `@Auth()`. Cần khôi phục luồng guard và kiểm tra với tài khoản thật; chưa kết luận endpoint chạy đúng chỉ từ service.
- Hàm xóa hiện cho cả hai bên xóa bất kỳ trạng thái nào. Không thể dùng nguyên logic này cho block vì bên bị chặn có thể xóa quan hệ `BLOCKED`.
- `Notification` trong Prisma dùng `is_read`, `data` và enum nghiệp vụ; DTO/service có `status`, `action_url` và enum `INFO/SUCCESS/...`. Cần thống nhất mapping trước khi lưu thông báo friend. Event realtime hiện sinh ID mới riêng, chưa gắn với notification đã lưu.
- Danh sách bạn và lời mời chưa phân trang; UI thiếu trạng thái lỗi có retry, khóa thao tác theo từng người, và thông báo không tìm thấy kết quả. Chuỗi giao diện đang hardcode tiếng Việt/Anh.

## 2. Phạm vi đề xuất

### Bản đầu: kết bạn đầy đủ

- Tìm người bằng username/tên hiển thị.
- Gửi, nhận, chấp nhận, từ chối, thu hồi lời mời; hủy kết bạn.
- Hiển thị đúng `NONE`, `OUTGOING_PENDING`, `INCOMING_PENDING`, `FRIENDS`, `SELF` theo người đang xem; đây là trạng thái trả cho UI, không phải thêm toàn bộ vào enum database.
- Có ba mục Bạn bè / Lời mời nhận / Lời mời đã gửi và ô tìm kiếm.
- Dashboard hiển thị dữ liệu thật, See All mở đúng tab Bạn bè.
- Thông báo lời mời mới và chấp nhận: lưu database, nhận realtime khi online, tải lại khi đăng nhập/reconnect.

### Bản tiếp theo: cùng chơi quiz

- Chọn bạn thật trong phòng chờ, gửi lời mời, mở phòng từ thông báo.
- Hiển thị lỗi có nghĩa khi phòng đầy, đã đóng hoặc không còn cho phép tham gia.
- Online/offline là phần bổ sung sau; trạng thái kết nối trong một phòng hiện tại chưa đủ để suy ra trạng thái online toàn ứng dụng.

Theo phạm vi mở rộng ngày 2026-09-06, chat riêng và bảng xếp hạng bạn bè trở thành các hạng mục chính của lộ trình, chi tiết tại mục 6. Bản nền friend vẫn bàn giao trước, sau đó bổ sung leaderboard, chat và mời chơi. Block/unblock cần đi cùng bản phát hành chat riêng. Nếu database thực tế đã có `BLOCKED`, bản nền phải giữ và tôn trọng dữ liệu đó, không cho xóa qua endpoint hủy kết bạn.

## 3. Quy tắc nghiệp vụ đề xuất

| Tình huống | Kết quả |
| --- | --- |
| A gửi B, chưa có quan hệ | Tạo một lời mời PENDING; A là người gửi |
| A bấm gửi lại/retry | Trả quan hệ đang có; không tạo bản ghi/thông báo thứ hai |
| B gửi A khi A đã gửi B | Trả trạng thái lời mời nhận; B phải bấm Chấp nhận rõ ràng |
| Người nhận chấp nhận PENDING | Chuyển ACCEPTED và cả hai thấy nhau |
| Người nhận từ chối / người gửi thu hồi | Xóa lời mời PENDING; quay về NONE |
| Một bên hủy quan hệ ACCEPTED | Xóa quan hệ; biến mất ở cả hai phía |
| Người ngoài sửa lời mời/quan hệ | Từ chối, không thay đổi dữ liệu |
| Gửi cho chính mình, ID sai, người không tồn tại/đã xóa | Lỗi nghiệp vụ rõ ràng, không để lộ lỗi Prisma |
| Hai yêu cầu đối nghịch chạy đồng thời | Chỉ một quan hệ tồn tại; response phản ánh trạng thái sau cùng |

Sau từ chối/hủy kết bạn có thể gửi lại, có giới hạn tần suất theo người gửi và cặp người dùng để tránh gửi lặp liên tục. Chốt ngưỡng trong cấu hình khi triển khai.

## 4. Các giai đoạn triển khai

### Giai đoạn 1 — Database và API

1. Kiểm tra migration status và bảng thực tế bằng truy vấn đọc. Làm rõ schema drift trước khi viết migration; không reset database. Nếu có cặp trùng ngược chiều, thống kê và chuẩn bị phương án xử lý dữ liệu có thể xem xét trước khi áp dụng.
2. Giữ `userId` là người gửi, `friendId` là người nhận. Thêm unique index PostgreSQL trên cặp chuẩn hóa `LEAST(userId, friendId), GREATEST(userId, friendId)` qua migration SQL, cùng check không tự kết bạn. Bắt lỗi unique và đọc lại quan hệ để xử lý concurrent requests.
3. Kiểm tra quyền và status ngay trong thao tác cập nhật/xóa có điều kiện để tránh accept/cancel chạy đua. Kiểm tra UUID và người nhận còn hoạt động.
4. Giữ các endpoint hiện có; bổ sung `GET /api/friendships/requests/sent`. Danh sách bạn trả profile hiện tại cộng `friendshipId`, `friendsSince`; danh sách lời mời trả ID, hướng, profile đối phương và thời gian. `friendsSince` dùng thời điểm accept hiện tại hoặc bổ sung `accepted_at` nếu cần lưu bền qua các cập nhật sau.
5. Bổ sung phân trang với response nhất quán theo quy ước repository: `items`, `pagination`. Cập nhật đồng thời web service để không còn giả định mọi response là mảng.
6. Kết quả `/api/user/search` bổ sung `relationshipStatus`, `friendshipId`; lấy quan hệ theo batch để tránh một query cho mỗi kết quả. Chỉ trả dữ liệu hồ sơ công khai; lọc soft delete, trim query, giới hạn độ dài và số kết quả.

Nghiệm thu: qua API, hai tài khoản hoàn thành đầy đủ vòng đời quan hệ; gửi đồng thời không tạo duplicate; người thứ ba không sửa được quan hệ.

### Giai đoạn 2 — Giao diện và dữ liệu thật

1. Giữ điểm vào ở trang cá nhân; thêm URL `/{locale}/user/profile?tab=friends` để mở trực tiếp từ dashboard/thông báo. Tab đọc và cập nhật query parameter.
2. Tách hook tải/cập nhật friend và các component tìm kiếm, lời mời, danh sách để dùng lại cho carousel và hộp mời chơi.
3. Bổ sung lời mời đã gửi, thu hồi, hủy kết bạn thật; nút tìm kiếm đổi theo trạng thái quan hệ.
4. Dùng `friendshipId` cho thao tác quan hệ, `user.id` cho hồ sơ/mời vào phòng; sửa type profile hỗ trợ các trường nullable đúng Prisma.
5. Bổ sung loading/empty/error/retry, phân trang, trạng thái đang xử lý theo từng dòng, xử lý kết quả tìm kiếm cũ trả về muộn, xác nhận hủy kết bạn và nhãn accessibility.
6. Thay `mockFriends`, nối See All; chuyển chuỗi sang hệ thống i18n hiện có, kiểm tra mobile và hai theme.

Nghiệm thu: làm được mọi thao tác bằng UI và reload vẫn giữ đúng dữ liệu; không còn mock/demo trong luồng friend.

### Giai đoạn 3 — Thông báo và đồng bộ hai tài khoản

1. Chuẩn hóa DTO ↔ Prisma ↔ payload web cho thông báo cần dùng. Có thể dùng `SYSTEM` + `data.kind` cho friend, `QUIZ_INVITE` cho mời chơi; mức hiển thị `info/success` được map riêng.
2. Lưu thay đổi quan hệ và notification liên quan trong cùng transaction; phát realtime sau commit với đúng ID notification đã lưu. Retry phải không tạo thông báo trùng.
3. Dùng kênh realtime theo user đã xác thực đang có. Cả hai phía nhận sự kiện thay đổi quan hệ và refetch danh sách/count; không dựa vào toast để lưu trạng thái.
4. Khi reconnect/đăng nhập/focus lại, đồng bộ qua HTTP. Notification click mở đúng tab, xử lý được lời mời đã thu hồi hoặc đã chấp nhận.
5. API thông báo cá nhân lấy owner từ phiên đăng nhập; kiểm tra ownership khi đọc/đánh dấu đã đọc. Invalidate cả cache phân trang liên quan; dùng cùng ID để chống trùng giữa HTTP và websocket.

Nghiệm thu: B online thấy lời mời không cần reload; B offline đăng nhập lại vẫn thấy; accept/cancel cập nhật cả hai tab/tài khoản. Websocket lỗi không làm mất thay đổi đã commit.

### Giai đoạn 4 — Mời bạn vào phòng quiz

1. Thay `friend1/friend2` bằng hộp chọn bạn ACCEPTED, loại người đã trong phòng.
2. Hoàn thiện endpoint HTTP `/api/rooms/:roomId/invite` đang được web service dự kiến gọi, sau khi xác minh prefix controller. Dùng HTTP làm thao tác gửi chuẩn, websocket để nhận; nếu giữ `invite_friends`, cho cả hai đi qua cùng service và chống gửi trùng.
3. Server xác minh người mời được phép mời trong phòng, người nhận là bạn, phòng còn nhận người, giới hạn batch/tần suất; không tin danh sách friendIds từ client.
4. Lưu notification `QUIZ_INVITE` kèm người mời, roomId và thời hạn. Tận dụng luồng notification hiện có để không bỏ sót listener `room_invitation` như hiện tại.
5. Click mở trang vào phòng và kiểm tra lại điều kiện trên server. Lời mời không tự vượt qua mật khẩu/quyền truy cập hay tự join người nhận; phòng đầy/đóng/hết hạn có phản hồi rõ ràng.

Nghiệm thu: A và B kết bạn, A mời B từ phòng chờ, B nhận và vào chơi bằng luồng thật; dữ liệu giả hoặc người không có quyền không gửi được lời mời.

## 5. Kiểm thử và thứ tự bàn giao

- Unit/service: self request, UUID/target không hợp lệ, hai chiều, quyền người nhận/người gửi, thu hồi/từ chối/hủy, trạng thái BLOCKED có sẵn.
- Integration PostgreSQL: unique không hướng, hai request đồng thời, accept-vs-cancel, retry không nhân đôi notification; kiểm tra migration trên database tạm và dữ liệu mẫu có trùng.
- API auth: chưa đăng nhập, tài khoản A cố xử lý quan hệ/notification không thuộc mình, tìm kiếm loại chính mình và soft-deleted user.
- UI hai tài khoản: tìm → gửi → nhận → chấp nhận → hủy; từ chối; thu hồi; reload; disconnect/reconnect; trạng thái rỗng/lỗi; mobile/i18n/theme.
- Room: người không phải bạn, người mời không có quyền, phòng đầy/đóng, invitation hết hạn, retry, người nhận offline.

Thứ tự bàn giao: **database/API → UI thật → notification/realtime → mời chơi**. Giai đoạn 1–3 tạo bản friend đầu tiên hoàn chỉnh; giai đoạn 4 nối tính năng với trải nghiệm quiz. Chỉ ước lượng lịch triển khai sau khi xác minh migration drift và chạy được smoke test đăng nhập/tìm kiếm hiện tại.

## 6. Mở rộng: trò chuyện, thành tích và cùng chơi

Phần này mở rộng định hướng ban đầu theo trao đổi với người dùng. Đây là các đề xuất để thiết kế, chưa phải các tính năng đã triển khai hoặc mọi chi tiết đã được chốt. Thứ tự ưu tiên mới ở cuối mục này thay cho thứ tự tổng thể ở mục 5; các công việc nền vẫn giữ nguyên.

### Trải nghiệm xuyên suốt

Người dùng mở một quiz → thấy bạn mình đã chơi và điểm tốt nhất → mở hồ sơ nhanh hoặc nhắn tin → gửi thẻ quiz/thách đấu/mời phòng → cùng chơi hoặc chơi khác giờ → chia sẻ kết quả → quay lại so thành tích.

| Vị trí | Trải nghiệm đề xuất |
| --- | --- |
| Trang chi tiết quiz | Avatar bạn đã chơi, top bạn bè, thứ hạng của mình, nút thách đấu hoặc rủ chơi |
| Trang kết quả | Thành tích mới, vị trí trong nhóm bạn, nút chia sẻ kết quả vào chat |
| Danh sách bạn | Online/đang chơi khi được phép hiển thị, nhắn tin, mời chơi, mở hồ sơ |
| Hồ sơ nhanh của bạn | Tên/avatar, thống kê công khai, thành tích ở quiz đang xem, nhắn tin/thách đấu |
| Hộp thư | Danh sách cuộc trò chuyện, chưa đọc, chat riêng có lưu lịch sử, thẻ quiz và lời mời |
| Phòng chờ | Chọn bạn thật để mời; tiếp tục dùng chat phòng cho những người tham gia |

Desktop có thể dùng ngăn chat bên phải để không mất trang quiz đang xem; mobile dùng trang hộp thư riêng. Khi đang trả lời câu hỏi có tính giờ, chỉ hiện badge gọn, không tự mở chat hoặc toast che câu hỏi.

### A. Leaderboard bạn bè trong từng quiz

- Hiển thị top 5–10 và luôn có dòng của bản thân; Xem tất cả có phân trang. Bạn chưa chơi có trạng thái riêng, không đưa vào bảng với điểm 0.
- Mỗi người một thành tích tốt nhất: điểm giảm dần, thời gian hoàn thành tăng dần; nếu vẫn bằng nhau thì đồng hạng, dùng thời điểm/ID để giữ thứ tự hiển thị ổn định.
- Chỉ nhận attempt hoàn thành được server xác nhận. Phải khảo sát đường chấm điểm và ghi kết quả của solo lẫn multiplayer trước khi dùng làm nguồn; không lấy điểm client gửi lên làm chuẩn.
- Tách thành tích solo và trận realtime nếu luật tính điểm khác nhau. Chỉ so sánh cùng phiên bản nội dung và luật chấm; schema hiện chưa thể hiện rõ version quiz gắn vào attempt nên cần bổ sung version/snapshot hoặc cơ chế tách bảng khi đề thay đổi.
- Bảng nhóm bạn gồm bản thân và quan hệ ACCEPTED hiện tại. Tôn trọng quyền xem quiz/kết quả, không tiết lộ đáp án hoặc dữ liệu quiz riêng tư qua bảng điểm.
- Bộ lọc tuần/toàn thời gian là bước sau. Với theo tuần, phải lấy thành tích tốt nhất trong tuần từ attempt; bảng best-all-time không đủ dữ liệu.
- Có thể thêm câu dẫn như “Bạn còn cách Minh 2 điểm” và badge “Kỷ lục mới” khi có dữ liệu tương ứng; không phát thông báo mỗi lần đổi thứ hạng.

Khảo sát bổ sung: `QuizAttempt` đã có điểm, phần trăm, thời gian, trạng thái và session; `Leaderboard` có unique `(quiz_id, user_id)` nhưng chưa tìm thấy luồng ghi/đọc leaderboard bền tương ứng trong modules đã khảo sát. Leaderboard game hiện tại và tab community chưa phải leaderboard bạn bè theo quiz hoàn chỉnh.

### B. Chat riêng realtime

- Bản đầu hỗ trợ chat 1–1 giữa bạn bè, text/emoji, lịch sử phân trang, số tin chưa đọc, trạng thái đang gửi/đã gửi/thất bại và thử lại.
- Bổ sung đang nhập và đã xem sau khi gửi/lưu/reconnect ổn định. “Đã xem” chỉ cập nhật khi người nhận thật sự mở cuộc trò chuyện và xem tin; không suy ra từ việc socket nhận được dữ liệu.
- Lưu tin vào PostgreSQL trước khi xác nhận thành công; Socket.IO chuyển tin và thay đổi trạng thái, Redis phục vụ presence/typing và phân phối sự kiện. Reconnect tải phần bị thiếu từ database.
- Model đề xuất: `Conversation`, `ConversationMember` có mốc đọc/tắt thông báo, `Message` có người gửi, loại, nội dung, thời gian và `clientMessageId`. Unique cặp người dùng cho direct conversation và unique `(senderId, clientMessageId)` chống gửi trùng khi retry.
- Kiểm tra membership ở cả HTTP và websocket, ở thao tác join hội thoại, gửi, đọc lịch sử, đánh dấu đã xem. Xử lý đúng nhiều tab/thiết bị; mở lại cuộc trò chuyện không tạo bản mới.
- Đề xuất khi hủy kết bạn: vẫn xem lịch sử, ngừng gửi tin mới và mời chơi. Khi block: chặn gửi/typing/presence/invite phía server, không cho bên bị chặn xóa block. Quyền block nên lưu riêng theo người chặn/người bị chặn thay vì tái sử dụng thao tác xóa Friendship.
- Có tắt thông báo hội thoại và block ngay trong bản chat; có thao tác báo cáo tin nhắn với nơi tiếp nhận/quyền xử lý rõ ràng trước khi mở rộng cho cộng đồng.
- Chat nhóm, ảnh/file, voice/video, sửa/thu hồi tin là các phần sau, không đưa vào bản chat đầu.

Chat phòng hiện tại: `send_message` → `room_message`; lưu Redis tối đa 200 tin, TTL 86.400 giây, fallback RAM. Cần kiểm tra quyền thành viên khi gửi/đọc lịch sử phòng. Tái sử dụng kinh nghiệm websocket/UI, nhưng không dùng lịch sử tạm này làm nguồn bền cho chat riêng.

### C. Thẻ tương tác trong chat

| Loại thẻ | Nội dung | Hành động |
| --- | --- | --- |
| Chia sẻ quiz | Tên, ảnh, số câu, chủ đề | Xem quiz / Chơi |
| Mời phòng | Người mời, tên quiz, trạng thái phòng | Vào phòng nếu còn đủ điều kiện |
| Chia sẻ kết quả | Điểm, thời gian, quiz, người chơi | Xem kết quả được phép xem / Thử sức |
| Thách đấu | Quiz, mục tiêu, thời hạn, trạng thái | Chấp nhận / Từ chối / Xem kết quả |

Payload lưu reference có kiểm tra quyền, không chấp nhận điểm hoặc quyền vào phòng do client tự khai. Thẻ kết quả gắn attempt cụ thể; thẻ mời phòng phản ánh trạng thái hiện tại. Quiz bị ẩn/xóa hoặc lời mời hết hạn hiển thị trạng thái không còn dùng được.

Ưu tiên text + chia sẻ quiz + mời phòng trước. Một lời mời xuất hiện trong chat và notification dùng cùng reference, tránh tạo hai lời mời độc lập.

### D. Thách đấu khác giờ — điểm nhấn đề xuất

Ví dụ: A đạt 850 điểm ở quiz X → gửi “Thử vượt điểm mình nhé” → B chơi khi rảnh → cả hai thấy kết quả trong chat.

- Phân biệt thẻ chia sẻ điểm để thử sức với trận thách đấu chính thức. Thẻ chia sẻ có thể làm sớm; thách đấu chính thức cần bản ghi `Challenge` riêng.
- Một challenge cần người mời/người nhận, phiên bản quiz/luật chơi, hạn, trạng thái và attempt hợp lệ của mỗi bên. Đề xuất một lượt tính điểm cho mỗi người, cùng đề/cấu hình; hòa thì báo hòa.
- Gửi/chấp nhận/hết hạn/kết thúc phải có kiểm tra trạng thái, chống thao tác lặp. Với đề cho xem đáp án hoặc đã luyện nhiều lần, chỉ gọi là thách đấu luyện tập; muốn thi đấu công bằng cần chế độ đề/câu hỏi riêng.

### E. Các ý tưởng bổ sung sau khi luồng chính ổn định

- Presence tự nguyện: online, đang chơi, không làm phiền; hỗ trợ ẩn hoạt động. Một user chỉ offline khi mọi kết nối hết hạn, có khoảng chờ để tránh nhấp nháy khi mạng chập chờn.
- Nhóm học nhỏ: nhóm bạn có chat, bộ quiz chung và lịch chơi; tái sử dụng mô hình ConversationMember.
- Mục tiêu nhóm theo tuần: cùng hoàn thành số quiz hoặc luyện một chủ đề; ưu tiên tiến bộ học tập và khả năng tắt nhắc nhở.
- Gợi ý hành động từ dữ liệu có thật: quiz bạn bè đã chơi nhưng mình chưa thử, chủ đề cả hai cùng quan tâm.
- Rematch sau một trận và chia sẻ thành tích do người dùng chủ động; tránh tự gửi tin thay người dùng.

### Lộ trình mở rộng đề xuất

1. **Nền friend:** các giai đoạn 1–3 bên trên, bảo đảm danh tính, quan hệ và thông báo hoạt động.
2. **Leaderboard bạn bè theo quiz + hồ sơ nhanh:** chốt nguồn điểm/phiên bản trước, thêm bảng ở chi tiết và kết quả quiz.
3. **Chat 1–1 có lưu lịch sử:** gửi/nhận/chưa đọc/reconnect, tắt thông báo và block; sau đó typing/read receipt/presence.
4. **Rủ chơi từ chat:** thẻ quiz, mời phòng, chia sẻ kết quả; dùng cùng nghiệp vụ mời với phòng chờ.
5. **Thách đấu khác giờ**, sau đó mới cân nhắc nhóm học và mục tiêu tuần.

Đích demo xuyên suốt: hai tài khoản kết bạn → thấy nhau trong leaderboard một quiz → nhắn tin → gửi thẻ mời phòng → vào chơi → chia sẻ kết quả; đóng tab/mở lại vẫn còn tin và lời mời. Đây là tiêu chí của cả lộ trình, không phải phạm vi một bước triển khai.
