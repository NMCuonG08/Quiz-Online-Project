# Kế hoạch tổng thể: dashboard, hồ sơ, bạn bè và chơi quiz cùng nhau

Ngày: 2026-09-06. Trạng thái: kế hoạch đề xuất, chưa triển khai tính năng.

## Tiến độ triển khai đợt hiện tại

Đã triển khai nền P0 và một phần P1–P5 trong workspace: migration Friendship + direct chat đã áp dụng trên database test; friend API/UI đã có lời mời đã gửi, friendship ID để hủy, relationship status và chống lỗi cạnh tranh ở mức business; dashboard tổng quan lấy dữ liệu thật; hồ sơ người khác; leaderboard bạn bè theo quiz; chat 1–1 lưu PostgreSQL + event realtime; endpoint mời bạn vào phòng có kiểm tra bạn bè/quyền/phòng. TypeScript server/web, Prisma validate, server build và các integration smoke test đã chạy qua.

Chưa hoàn tất: privacy settings/persistent block, thống kê dựng lại đầy đủ (streak/badges/chart), versioned leaderboard, UI chọn bạn trong phòng, notification owner/outbox nhất quán hoàn toàn, typing/read/presence/mute/report, thẻ quiz/kết quả, challenge, nhóm học và nghiệm thu browser toàn tuyến. Không coi checklist cuối tài liệu là đã đạt cho các phần này.

Tài liệu này là kế hoạch chính, thay thế thứ tự triển khai trong `docs/friend-feature-plan.vi.md`. Tài liệu cũ giữ vai trò khảo sát và chi tiết tham khảo. Các lựa chọn dưới đây là mặc định đề xuất để có thể bắt tay triển khai, không phải các quyết định người dùng đã xác nhận từng mục.

## 1. Mục tiêu và đích hoàn thành

Người dùng có một dashboard theo dõi học tập và hoạt động với bạn bè; có thể mở hồ sơ bạn, so thành tích trên từng quiz, trò chuyện, gửi quiz/mời phòng/thách đấu và xem kết quả cùng nhau.

Luồng nghiệm thu chính:

1. A đăng nhập, thấy dashboard với số liệu thật, quiz đang làm, bạn bè và lời mời.
2. A tìm B, mở hồ sơ được phép xem, gửi lời mời; B chấp nhận.
3. A/B xem hồ sơ nhau và bảng bạn bè của một quiz, với điểm đã xác nhận.
4. A nhắn tin, chia sẻ quiz và mời B vào phòng; B nhận ngay hoặc thấy lại khi đăng nhập.
5. Hai người chơi, chia sẻ kết quả, dashboard và bảng điểm cập nhật đúng.
6. A gửi thách đấu khác giờ; B chấp nhận và hoàn thành theo cùng luật, cả hai nhận kết quả.
7. Mất mạng, reload, nhiều tab hoặc retry không làm mất tin/nhân đôi quan hệ, điểm và lời mời.

Nhóm học và mục tiêu tuần có giai đoạn riêng trong cùng lộ trình. Không đưa voice/video, gửi file hoặc thuật toán gợi ý phức tạp vào phạm vi hiện tại.

## 2. Hiện trạng đã đọc trong repository

| Phần | Có thể tận dụng | Cần bổ sung/kiểm tra |
| --- | --- | --- |
| Dashboard user | `web/src/modules/client/user/UserPage.tsx`, lịch sử phân trang và tiếp tục quiz | Thống kê, biểu đồ, mục tiêu, dữ liệu bạn thật, các khối social |
| Hồ sơ của mình | Form tên/username/avatar trong `user-profile` | Luồng avatar còn TODO, bio, settings, preview hồ sơ, mapping tên/avatar nhất quán |
| Hồ sơ người khác | User có avatar/bio/username | Chưa thấy trang hồ sơ người khác và DTO theo quyền người xem |
| User API | Có tìm kiếm và CRUD | `findOne` trả model User nguyên; cần DTO select rõ trường. Guard của nhiều route user đang comment; không dùng nguyên API này cho hồ sơ xã hội |
| Thống kê | Schema `UserStatistics` | Chưa thấy code cập nhật model trong `server/src`; không mặc định số liệu có sẵn là chính xác |
| Kết quả | `QuizAttempt`, API history/in-progress/all-attempts, chấm solo từ responses | Chuẩn hóa kết quả solo/multiplayer, version đề, thời gian và xử lý xóa attempt |
| Friend | Schema, module, API và tab UI | Hủy bạn còn demo, danh sách đã gửi, trạng thái quan hệ, chống duplicate hai chiều, migration |
| Leaderboard | Model `Leaderboard`, leaderboard trận realtime | Bảng bạn theo quiz, nguồn ghi/đọc bền, quyền xem và scope phiên bản/chế độ |
| Chat | UI và websocket chat phòng | Chat riêng chưa có model; chat phòng hiện Redis 200 tin/TTL 24 giờ, fallback RAM |
| Notification | DB/API, event, UI dropdown | DTO/schema lệch, friendship chưa nối; đồng bộ ID, cache và owner |
| Mời bạn | Hook/service dự kiến, gateway event | Placeholder ID, thiếu nghiệp vụ hoàn chỉnh và UI nhận lời mời |

Khảo sát chỉ dựa trên mã nguồn, chưa xác minh schema database thực tế hoặc chạy thử end-to-end. Workspace có thay đổi đang làm ở UI và room gateway; triển khai theo các đợt nhỏ, không ghi đè phần việc đó.

## 3. Các màn hình và điều hướng

Các URL bên dưới đều có tiền tố `/{locale}`. Dùng UUID ổn định cho URL hồ sơ vì username hiện nullable và có thể đổi.

| URL đề xuất | Vai trò và nội dung |
| --- | --- |
| `/user` | Dashboard của mình: tổng quan, tiếp tục học, tiến bộ, bạn/lời mời/thách đấu |
| `/user/history` | Toàn bộ lịch sử, lọc trạng thái/chủ đề/khoảng thời gian, tiếp tục hoặc xem kết quả |
| `/user/profile` | Sửa thông tin cá nhân, avatar/bio; nút Xem hồ sơ của tôi |
| `/user/settings` | Quyền riêng tư, hoạt động online, thông báo, người bị chặn |
| `/user/friends` | Bạn bè, lời mời nhận, đã gửi, tìm kiếm |
| `/users/:userId` | Hồ sơ có thể xem theo quan hệ/quyền; dùng cho cả tự xem và xem người khác |
| `/user/messages` | Hộp thư và trạng thái chưa đọc |
| `/user/messages/:conversationId` | Chat riêng hoặc nhóm; desktop hỗ trợ mở trong ngăn chat |
| `/user/challenges` | Thách đấu nhận/đã gửi/đang chơi/kết quả |
| `/quiz/:slug` | Thêm Bạn bè đã chơi, bảng điểm, chia sẻ, mời chơi/thách đấu |
| Trang kết quả hiện có | Kỷ lục, thứ hạng bạn bè, chia sẻ/thử lại/đấu lại |
| `/user/groups`, `/groups/:groupId` | Nhóm học, thành viên, quiz chung, mục tiêu và leaderboard tuần |

Cập nhật `APP_ROUTES` và các link hiện có theo route thực tế; hiện `USER.PROFILE` còn là `/profile`. Link cũ `/user/profile?tab=friends` chuyển sang `/user/friends`; notification cũ vẫn mở được. Link chat trên desktop/mobile trỏ cùng một hội thoại.

Sidebar chính: Tổng quan, Lịch sử, Bạn bè, Tin nhắn, Thách đấu, Quiz của tôi; Nhóm học xuất hiện khi giai đoạn nhóm hoàn tất. Hồ sơ và Cài đặt ở menu tài khoản. Badge lấy dữ liệu server.

## 4. Dashboard của mình

### Thứ tự nội dung

1. **Thông tin đầu trang:** avatar, tên, câu chào; Xem hồ sơ / Chỉnh sửa; hành động Tiếp tục quiz nếu có.
2. **Tổng quan:** số quiz khác nhau đã hoàn thành, số lượt hoàn thành, điểm trung bình %, chuỗi ngày học. Mỗi số có nhãn và khoảng thời gian rõ ràng.
3. **Tiếp tục học:** tối đa 3 attempt đang làm; trạng thái đề đã đổi/đóng phải xử lý rõ, không ép resume sai đề.
4. **Tiến bộ:** biểu đồ lượt hoàn thành và điểm trung bình 7/30 ngày; chủ đề đã luyện, gợi ý luyện tiếp dựa trên lịch sử thật.
5. **Kết nối:** bạn đang online nếu được phép, lời mời nhận, thách đấu sắp hết hạn, hộp thư chưa đọc; mỗi khối có Xem tất cả.
6. **Thành tích gần đây:** kỷ lục mới, kết quả và huy hiệu có quy tắc cụ thể. Hoạt động bạn bè chỉ hiển thị dữ liệu đã được phép chia sẻ.
7. **Quiz của tôi:** quiz đã tạo, truy cập quản lý; khách xem hồ sơ chỉ thấy quiz được phép công khai.

Mobile đặt Tiếp tục học và lời mời/thách đấu trước biểu đồ dài. Người mới nhận trạng thái trống có hành động phù hợp; không dùng số giả để lấp dashboard. Mỗi khối có loading/error/retry riêng để một API lỗi không làm trống cả trang.

### Định nghĩa số liệu

| Chỉ số | Định nghĩa đề xuất |
| --- | --- |
| Quiz đã hoàn thành | Count distinct quiz_id từ attempt COMPLETED hợp lệ trong khoảng chọn |
| Lượt hoàn thành | Count attempt COMPLETED hợp lệ; tách solo/realtime khi chưa chuẩn hóa nguồn |
| Điểm trung bình | Trung bình `percentage` của attempt hợp lệ, `max_score > 0`; không cộng điểm thô giữa các quiz |
| Thời gian làm | Tổng thời gian server đã xác nhận; không tính thời gian tab bị bỏ quên là thời gian học chính xác |
| Chuỗi ngày học | Số ngày liên tiếp có ít nhất một lượt hoàn thành; còn giữ chuỗi của hôm qua khi hôm nay chưa học |
| Chủ đề mạnh | Xếp theo kết quả chuẩn hóa và số lượt; không gọi là mạnh khi chưa đủ dữ liệu (mặc định ít nhất 3 lượt) |
| Huy hiệu | Quy tắc đơn giản: quiz đầu tiên, 10 quiz khác nhau, chuỗi 7 ngày; trao idempotent |

Thêm timezone IANA cho người dùng, mặc định theo thiết lập ứng dụng (đề xuất Asia/Ho_Chi_Minh), lưu timestamp UTC. Khoảng 7 ngày tính từ đầu ngày địa phương 6 ngày trước tới hiện tại; dùng cùng định nghĩa cho chart/streak/mục tiêu. Thay timezone cần tính lại chỉ số; không trao lặp huy hiệu.

UserStatistics là dữ liệu tổng hợp có thể dựng lại từ nguồn hợp lệ. Ban đầu ưu tiên query có index; chỉ cache/tổng hợp khi đo thấy cần. Xóa/hủy hiệu lực attempt phải cập nhật dashboard, best score và card kết quả liên quan, không để số liệu cũ.

## 5. Hồ sơ bạn bè và quyền xem

Trang hồ sơ là dashboard thành tích được chia sẻ: ảnh/tên/bio, quan hệ, thống kê được phép xem, quiz công khai đã tạo, kỷ lục/huy hiệu, hoạt động gần đây và quiz chung. Có nút Kết bạn/Thu hồi/Chấp nhận, Nhắn tin, Mời chơi, Thách đấu theo quan hệ.

| Dữ liệu/hành động | Chính mình | Bạn bè | Người chưa kết bạn |
| --- | --- | --- | --- |
| Tên, avatar, username, bio | Xem/sửa | Xem nếu hồ sơ cho phép | Xem hồ sơ tối thiểu khi cho phép tìm kiếm |
| Dashboard đầy đủ, quiz đang làm, lịch sử chi tiết | Xem | Không | Không |
| Thống kê/huy hiệu/kết quả chia sẻ | Xem | Mặc định xem | Chỉ khi chủ hồ sơ bật công khai |
| Quiz đã tạo | Xem cả bản nháp theo quyền | Chỉ quiz có quyền truy cập | Chỉ quiz có quyền truy cập |
| Hoạt động, trạng thái online/đang chơi | Tự quản lý | Theo thiết lập | Mặc định không |
| Nhắn tin và mời chơi | Không tự gửi | Có nếu không block | Cần kết bạn |
| Email, thông tin đăng nhập, đáp án riêng tư | Theo API tài khoản phù hợp | Không | Không |

Đề xuất settings tách `profileVisibility`, `statsVisibility`, `activityVisibility`, `showOnlineStatus`, `allowFriendRequests`, tham gia bảng điểm bạn bè và tùy chọn thông báo. Visibility dùng PUBLIC/FRIENDS/PRIVATE; mặc định phần social là FRIENDS, hồ sơ tối thiểu được tìm để kết bạn. Public mở rộng có thể bật trong settings.

Mọi endpoint trả DTO được select theo người xem; không trả User/QuizAttempt nguyên rồi ẩn trường bằng CSS. Cache hồ sơ/bảng điểm phải xét viewer/quyền; đổi privacy, unfriend hoặc block phải thu hồi quyền cả HTTP, websocket và dữ liệu cache. Block có hiệu lực hai chiều với khám phá hoạt động, chat/invite; không tự công khai ai đã chặn ai.

Kết quả share chỉ gồm tóm tắt đã được phép xem; không dùng link kết quả riêng của chủ attempt như một public link. Nếu bật chia sẻ rộng hơn, tạo quyền/link chia sẻ riêng có khả năng thu hồi.

## 6. Bạn bè, leaderboard và giao tiếp

### Bạn bè

Hoàn thiện đủ tìm → gửi → nhận → chấp nhận/từ chối/thu hồi → hủy bạn, pending incoming/outgoing và phân trang. Một cặp chỉ có một quan hệ dù gửi đồng thời; giữ hướng người gửi. Block dùng quan hệ riêng có owner, chặn bên bị block tự gỡ.

### Leaderboard theo quiz

- Bảng Bạn bè gồm chính mình và bạn ACCEPTED có quyền hiển thị kết quả; top 5–10, dòng bản thân, danh sách đầy đủ phân trang.
- Một best attempt mỗi người trong cùng quiz version, scoring mode và khoảng thời gian. Điểm giảm dần, thời gian tăng dần; bằng nhau đồng hạng.
- Người chưa làm tách riêng; rank nhóm bạn không lấy từ rank toàn cục lưu sẵn. Tuần/toàn thời gian truy vấn đúng khoảng của attempt.
- Server hoàn tất/chấm kết quả là nguồn chuẩn. Quy định chuẩn hóa solo/multiplayer và snapshot đề trước khi ghép thống kê; không cho client tự khai điểm để lên bảng.
- Có bảng realtime của trận như hiện tại; bảng thành tích bạn bè cập nhật khi kết quả trận được hoàn tất bền.

### Chat 1–1 và presence

- Text/emoji, history cursor, chưa đọc, gửi/thất bại/retry, mute/block/report; sau đó typing, đã xem, online/đang chơi, không làm phiền.
- PostgreSQL lưu tin; gửi thành công sau commit. Client tạo `clientMessageId` và server chống trùng; thứ tự/cursor ổn định bằng sequence hoặc timestamp+ID.
- Reconnect đọc phần thiếu; nhiều tab cập nhật cùng mốc đọc. Đã xem chỉ ghi khi hội thoại hiển thị và tin được xem. Typing tự hết hạn; không lưu như tin nhắn.
- User chỉ offline khi mọi kết nối hết hạn, có grace period. Presence toàn ứng dụng tách trạng thái tham gia phòng; không tiết lộ room riêng qua presence.
- Hủy bạn: còn lịch sử của mình, ngừng tin/mời mới. Block thu hồi quyền gửi và phát typing/presence ngay; danh sách báo cáo có quy trình xử lý cho admin.
- Desktop ngăn chat, mobile hộp thư; khi đang thi có tính giờ chỉ badge nhỏ, không tự bật ngăn chat hoặc thông báo che câu hỏi.

### Thẻ và mời chơi

Loại tin: TEXT, QUIZ_SHARE, RESULT_SHARE, ROOM_INVITE, CHALLENGE, SYSTEM. Server kiểm tra payload reference và quyền ở cả lúc gửi lẫn lúc đọc/thực hiện hành động.

Lời mời dùng cùng bản ghi/reference cho chat, notification và dashboard. Kiểm tra người mời/quan hệ/trạng thái phòng/rate limit. Thẻ hiển thị phòng đóng/đầy/hết hạn; bấm vào vẫn đi qua kiểm tra join hiện có, không bỏ mật khẩu. Người nhận offline đọc lại được. Rematch tạo phòng/lời mời mới có xác nhận chủ động của người chơi.

### Thách đấu khác giờ

- Thẻ Thử vượt điểm có thể xuất hiện sớm như chia sẻ thành tích luyện tập.
- Challenge chính thức: PENDING → ACCEPTED → COMPLETED; nhánh DECLINED/CANCELLED/EXPIRED. Lưu người tham gia, phiên bản đề, luật chấm, hạn, attempt hợp lệ của từng người.
- Một lượt tính điểm cho mỗi người; hòa khi cùng tiêu chí. Không cho hủy sau khi đối phương đã bắt đầu để tránh thay đổi kết quả bất lợi; thay đổi policy này cần thể hiện rõ ở UI.
- Server tạo/khóa attempt hợp lệ, kiểm tra deadline ở thao tác chấp nhận/nộp kết quả; job hết hạn có retry và idempotency. Không phụ thuộc chỉ vào timer trình duyệt.
- Không xóa attempt đang được challenge sử dụng; có thể ẩn khỏi lịch sử cá nhân. Kết quả có thể bị vô hiệu nếu attempt bị xác định không hợp lệ, đồng bộ card và bảng điểm.

### Nhóm học, mục tiêu tuần và gợi ý

- Nhóm private do owner tạo; mời bạn, quyền owner/admin/member, nhận/từ chối, rời/xóa thành viên; xử lý chuyển owner trước khi owner rời.
- Chat nhóm dùng ConversationMember; server thu hồi subscription khi rời nhóm. Mặc định rời/bị xóa sẽ không còn quyền đọc lịch sử nhóm qua API.
- Danh sách quiz chung chỉ gồm quiz mỗi người được quyền xem; thêm quiz không tự cấp quyền xem đề riêng.
- Mục tiêu tuần (số quiz hoặc chủ đề) tính từ completed attempt hợp lệ; mỗi nhóm có timezone cố định cho tuần. Bảng nhóm so số quiz/điểm chuẩn hóa theo luật đã ghi rõ, không cộng điểm thô tùy đề.
- Gợi ý ban đầu theo quy tắc: tiếp tục quiz, chủ đề ít luyện, quiz bạn bè chia sẻ mà mình chưa làm. Tránh spam và không tự nhắn thay người dùng.

## 7. Thiết kế dữ liệu và API dự kiến

### Dữ liệu

| Model/nhóm | Thay đổi |
| --- | --- |
| User + UserPrivacySettings | bio/avatar hoạt động, timezone, các quyền social; DTO public/self riêng |
| Friendship + UserBlock | unique cặp không hướng cho friendship; block có blocker/blocked, cùng quyền gửi request |
| QuizVersion/attempt snapshot | Chốt version/chế độ chấm, câu hỏi/thang điểm của attempt; dữ liệu cũ chưa chứng minh được version gắn legacy, không ghép bảng mới tùy tiện |
| UserStatistics + achievement | Aggregate dựng lại; định nghĩa chỉ số; unique user+achievement cho trao huy hiệu |
| Leaderboard | Mở key hiện `(quiz_id,user_id)` để chứa version/mode nếu materialize; best của tuần lấy từ attempt hoặc aggregate riêng |
| Conversation/ConversationMember/Message | Cặp direct unique, membership/mốc đọc/mute, tin có loại/reference/dedupe ID |
| RoomInvitation | Người mời/nhận, room, hạn/trạng thái, chống retry và notification/chat reference |
| Challenge/ChallengeParticipant | Luật, deadline, trạng thái; mỗi user tối đa một attempt tính điểm/challenge |
| Notification + event delivery | Map DB/realtime về ID chung, data kind/reference, lưu trước phát; dùng job/outbox có retry khi cần bảo đảm delivery |
| MessageReport | Message reference, người báo cáo, lý do, trạng thái xử lý và quyền admin |
| StudyGroup/GroupMember/GroupQuiz/WeeklyGoal | Nhóm, vai trò, bộ quiz và mục tiêu tuần; gắn conversation nhóm |

Không dùng ActivityLog kỹ thuật chứa IP/user-agent làm feed bạn bè. Feed social chỉ dựng từ các sự kiện được phép hiển thị, kiểm tra quyền hiện tại lúc đọc.

### API

Tên endpoint là hợp đồng đề xuất. Giữ API cũ đang có người dùng cho tới khi UI chuyển xong; thống nhất envelope/mapping trong apiClient, không thay global response format trong cùng đợt.

| Nhóm | Endpoint chính đề xuất |
| --- | --- |
| Self | `GET /api/me/dashboard?range=7d`, `GET /api/me/activity`, `PATCH /api/me/profile`, `GET/PATCH /api/me/privacy` |
| Profile | `GET /api/users/:id/profile`, `/stats`, `/activity`, `/quizzes`; xử lý quyền theo viewer |
| Friend | Giữ `/api/friendships/*`, thêm requests/sent, danh sách phân trang; search trả relationshipStatus |
| Block | `GET/POST /api/me/blocks`, `DELETE /api/me/blocks/:userId` |
| Leaderboard | `GET /api/quizzes/:id/leaderboard?scope=friends&mode=solo&version=...&period=all` |
| Chat | `GET/POST /api/conversations`, `GET/POST /api/conversations/:id/messages`, `PATCH /api/conversations/:id/read`, `/preferences` |
| Invitation | `POST /api/rooms/:id/invite`, `GET /api/me/invitations`; accept/join dùng nghiệp vụ phòng có kiểm tra lại |
| Challenge | `GET/POST /api/challenges`, `POST /api/challenges/:id/accept`, `/decline`, `/cancel`; kết quả do luồng hoàn tất attempt ghi |
| Notification | `/api/me/notifications`, `/unread-count`, mark-read/mark-all-read theo owner |
| Group | `/api/groups`, `/:id/members`, `/:id/invitations`, `/:id/quizzes`, `/:id/goals`, `/:id/leaderboard` |

Self API lấy ID từ phiên đăng nhập; endpoint theo target ID vẫn kiểm tra người xem. Pagination mặc định 20, tối đa 50; message dùng cursor. Dashboard trả tổng hợp gọn có `generatedAt`; các list dài lấy riêng và lỗi khối social không chặn số liệu học tập.

### Realtime và nhất quán

Event đề xuất: `friendship.changed`, `message.created`, `conversation.read`, `typing.changed`, `presence.changed`, `invitation.changed`, `challenge.changed`, `notification.created`, `quiz.leaderboard.changed`. Bổ sung có kiểm soát vào event types và websocket manager hiện có, không tạo socket riêng cho mỗi component.

HTTP làm lệnh bền cho gửi tin/mời/challenge; websocket phát ngay sau commit và ACK phản ánh trạng thái đã lưu. Nếu giữ command websocket tương đương, cả hai gọi cùng service với cùng idempotency key. Event có ID/version/reference để client bỏ sự kiện trùng/cũ. Reconnect HTTP đồng bộ lại trạng thái và phần lịch sử thiếu.

DB là nguồn chuẩn; Redis là cache/presence/pubsub. Notification đồng bộ với unread tin nhắn nhưng không sinh thêm toast/dropdown cho từng tin trong hội thoại đang mở. Transaction cùng outbox/job bền cho các thay đổi cần phát sự kiện có retry; xác minh cơ chế event/queue sẵn có trước khi thêm hạ tầng mới.

## 8. Thứ tự triển khai và tiêu chí bàn giao

Mỗi giai đoạn hoàn tất cả API/UI liên quan và kiểm thử cần thiết trước khi chuyển bước. Phạm vi sau phụ thuộc nền trước; không coi giao diện mock là bàn giao tính năng.

| Giai đoạn | Việc chính | Điều kiện hoàn tất |
| --- | --- | --- |
| P0 — Xác minh nền | Smoke test auth/history/chat phòng, schema/migration drift, nguồn điểm, route/DTO/owner, quyết định version và privacy | Có baseline chạy được và migration/contract có thể review; không reset dữ liệu |
| P1 — Friend và hồ sơ | Friend đủ vòng đời, UserBlock/privacy, profile read/write/avatar, trang bạn bè và hồ sơ người khác, notification lời mời | A/B kết bạn/xem đúng hồ sơ; C không đọc/sửa dữ liệu riêng; bỏ mock/demo friend |
| P2 — Dashboard và tiến bộ | Self API, số liệu thật, lịch sử riêng, continue, chart 7/30 ngày, streak, huy hiệu, preview hồ sơ | Chỉ số khớp fixture nguồn, reload đúng, trạng thái mới/rỗng/lỗi rõ; privacy có hiệu lực |
| P3 — Leaderboard và hồ sơ thành tích | Chốt kết quả/version, best score, bảng bạn ở quiz/kết quả/hồ sơ, so sánh theo quiz | Solo/realtime không ghép sai luật; tie/privacy/delete/retry đúng; cập nhật sau hoàn tất |
| P4 — Chat và presence | Chat 1–1 bền, unread, retry, mute/block/report; typing/read/presence có privacy | Hai tài khoản/nhiều tab/offline hoạt động; không trùng/mất tin đã ACK; block có hiệu lực |
| P5 — Mời chơi và chia sẻ | Quiz/result cards, room invitation, dashboard entry, deep link, rematch | Từ chat mời vào phòng thật; thẻ hết hạn/đóng/không quyền phản hồi đúng; người offline nhận lại |
| P6 — Thách đấu | State machine, snapshot/attempt hợp lệ, deadline/job, trang challenge, card/kết quả | Một lượt hợp lệ/người; hòa/hết hạn/retry/concurrency đúng; dashboard/chat đồng bộ |
| P7 — Nhóm học và mục tiêu | Nhóm/vai trò/chat nhóm, quiz chung, mục tiêu tuần, bảng nhóm, gợi ý theo quy tắc | Quyền thành viên/owner và timezone đúng; rời nhóm mất quyền realtime/HTTP; không lộ quiz riêng |
| P8 — Nghiệm thu toàn bộ | E2E xuyên suốt, hiệu năng, mobile/i18n/themes/accessibility, migration rehearsal và tài liệu vận hành | Toàn bộ phạm vi P1–P7 chạy bằng dữ liệu thật, các lỗi chặn đã xử lý |

Điểm phát hành có thể dùng độc lập: P1–P3 cho dashboard + friend + thành tích; P4–P5 cho trò chuyện/rủ chơi; P6 cho thách đấu; P7 cho nhóm. Đây là cách bàn giao từng phần của toàn bộ phạm vi, không loại các phần sau khỏi kế hoạch.

Chưa gán lịch cố định vì P0 chưa xác minh database và baseline. Sau P0 ước lượng effort theo từng giai đoạn, ghi riêng thời gian phát triển, kiểm thử và migration; không dùng số lượng màn hình để suy ra thời gian chat/realtime.

## 9. Bản đồ công việc trong repository

- **Web dashboard/history:** `web/src/modules/client/user/`, `web/app/[locale]/user/`; tách component tổng quan/tiến bộ/tiếp tục/social để tái sử dụng.
- **Web profile/friends:** `web/src/modules/client/user-profile/`; thêm module social-profile và route `users/[userId]`. Chuyển tab friend cũ sang route chính, giữ redirect.
- **Web chat/challenge/group:** thêm module riêng theo cấu trúc client hiện có; state dùng Redux/hooks hiện có, tránh thêm thư viện state chỉ cho social.
- **Web quiz:** `web/src/modules/client/quiz/QuizDetail.tsx`, trang kết quả solo và `game-quiz`, `room-quiz` cho selector mời, cards và rematch.
- **Shared web:** `apiRoutes.ts`, `appRoutes.ts`, DTO/types, websocket manager, notification và i18n; subscriber có cleanup, logout xóa cache theo user.
- **Server identity/social:** `modules/user`, `friendships`, các module mới user-dashboard/profiles/messaging/challenges/study-groups; authorization đặt trong service để HTTP/socket dùng chung.
- **Server quiz:** `modules/quizz` và `room-play`; hoàn tất attempt phát thay đổi thống kê/bảng điểm một lần, không ghi nhận thêm theo mỗi lần render client.
- **Server infra:** `notification`, common event repository, Redis/queue hiện có; không trộn chat người dùng vào `ai-chat-history`.
- **Database:** `server/prisma/schema.prisma`, migration SQL theo từng giai đoạn, script dựng lại aggregate có dry run và idempotency.
- **Tests:** Jest service + PostgreSQL integration cho race/permission, API E2E trong vị trí hiện có; browser smoke cho luồng hai tài khoản và responsive.

## 10. Kiểm thử, migration và điều kiện phát hành

### Kiểm thử bắt buộc theo rủi ro thực tế

- Friend: gửi chéo cùng lúc, retry, accept/cancel cùng lúc, self/soft-delete/block; người ngoài không sửa được.
- Profile/privacy: self/friend/stranger/blocked, private quiz, đổi privacy khi tab đang mở; payload không chứa email/password/token/đáp án nội bộ.
- Metrics: dữ liệu trống, nhiều lượt cùng quiz, quiz điểm tối đa khác nhau, thời gian null, ranh giới ngày/tuần/timezone, duplicate finish, delete/invalidated attempt.
- Leaderboard: version/mode/period, best và đồng hạng, dòng bản thân, người chưa làm, quyền bị thu hồi, đồng thời finish nhiều người.
- Chat: ACK rồi reload/restart vẫn có tin, retry không trùng, phân trang không sót, reconnect/multi-tab/read đúng, membership và block áp dụng cả socket.
- Invitations/challenges/groups: payload giả, expired/full/closed/private room, accept deadline race, unfriend/block, owner rời nhóm, bị xóa khỏi nhóm khi socket đang mở.
- UI: keyboard/focus/label, mobile và desktop, light/dark, ngôn ngữ hiện có; chart có số liệu/văn bản thay thế, không tự bật chat giữa câu hỏi tính giờ.

### Migration và vận hành

1. P0 kiểm kê schema/migration thực tế bằng thao tác đọc; ghi nhận drift và duplicate, chuẩn bị script xử lý có dry run. Không reset hoặc tự xóa dữ liệu mâu thuẫn.
2. Thêm schema theo kiểu mở rộng tương thích trước, migrate/backfill theo batch, validate dữ liệu, rồi chuyển API/UI. Unique/index chỉ thêm sau khi kiểm tra dữ liệu hiện có.
3. Dựng lại thống kê và leaderboard từ attempt hợp lệ. Legacy thiếu version có nhãn/scope riêng; không tự suy ra đề lịch sử từ đề hiện tại.
4. Thử migration trên DB tạm với dữ liệu mẫu đại diện; chuẩn bị backup và rollback ứng dụng/feature flag, không rollback bằng xóa bảng chứa tin đã gửi.
5. Theo dõi lỗi API, queue retry, độ trễ nhận tin, query leaderboard/dashboard và số kết nối; log ID kỹ thuật, không log nội dung tin nhắn/token.
6. Đặt mục tiêu kiểm thử sau P0: dashboard API p95 dưới 500 ms và tin realtime dưới 1 giây trong môi trường/stress fixture đã ghi rõ; đo rồi quyết định cache/index, chưa coi đây là số đo hiện tại.

### Checklist hoàn thành toàn bộ kế hoạch

- [ ] Dashboard hiển thị số liệu thật, continue/history/chart/streak/huy hiệu và các khối social.
- [ ] Hồ sơ bản thân/bạn bè/người lạ có quyền đúng và các nút tương tác đúng trạng thái.
- [ ] Friend đầy đủ vòng đời, notification và block hoạt động.
- [ ] Leaderboard bạn bè theo từng quiz có version/mode và nguồn điểm server.
- [ ] Chat riêng bền, unread/read/typing/presence, mute/block/report, multi-tab/reconnect.
- [ ] Chia sẻ quiz/kết quả, mời phòng/rematch hoạt động từ chat, dashboard và phòng chờ.
- [ ] Thách đấu khác giờ đủ vòng đời và chấm kết quả theo luật.
- [ ] Nhóm học/chat nhóm/quiz chung/mục tiêu/bảng điểm tuần và gợi ý theo quy tắc.
- [ ] Migration, test liên quan, responsive/i18n/theme/accessibility, quan sát vận hành và tài liệu đã kiểm tra.

Bước triển khai đầu tiên: **P0, tiếp theo P1**. P0 giải quyết những điều chưa biết về dữ liệu và quyền; P1 tạo nền để mọi màn hình sau sử dụng cùng một hồ sơ và quan hệ đúng.
