# Kế hoạch hoàn thiện chơi realtime

Ngày rà soát: 06/09/2026. Phần triển khai đã được thực hiện trong các file server/web liệt kê bên dưới.

## 1. Hiện trạng theo code

| Yêu cầu | Đã có | Còn thiếu / chưa ổn |
| --- | --- | --- |
| Chủ phòng bắt đầu cho mọi người | `start_game` kiểm tra chủ phòng, broadcast `game_state`; trang phòng nghe trạng thái để mở màn chơi | Cần kiểm thử nhiều trình duyệt, tải câu hỏi chậm và reconnect đúng lúc start; cần chốt danh sách người chơi và nội dung câu hỏi của trận |
| Reload / mất mạng quay lại trận | Socket.IO tự reconnect; join lại; snapshot có câu hiện tại, deadline, điểm và cờ đã trả lời; người chơi cũ được vào lại trận đang chạy | Chưa khôi phục đáp án đã chọn và toàn bộ lịch sử; queue gửi lệnh trước khi rejoin; cần xác nhận resume xong mới gửi lại đáp án còn hợp lệ |
| Giữ người chơi khi rớt mạng | Grace period hiện tại 30 giây, kiểm tra socket khác của cùng user; join/leave chống tăng giảm số lượng trùng | Trạng thái kết nối đang gắn với trạng thái tham gia; chưa có roster cố định của trận để tính số người phải trả lời và tổng kết |
| Chấm điểm | Backend so đáp án đúng và chặn client tự cập nhật điểm; Redis chống nộp trùng theo user/câu | `timeSpent` bị bỏ qua; điểm hiện chỉ bằng `question.points` nếu đúng. Chưa kiểm tra phase, câu đang mở và deadline khi nộp |
| Mọi người trả lời xong thì xem kết quả câu | Có sự kiện cập nhật điểm tổng | Chưa đếm đủ câu trả lời; chưa có `REVEAL`, bảng tốc độ từng câu hoặc thời gian chờ 5 giây. Hiện hết giờ chuyển thẳng câu kế tiếp; chủ phòng còn có thể next thủ công |
| Tổng kết cuối trận | Có `FINISHED`, giao diện kết quả cá nhân, leaderboard và lưu `finalLeaderboard` vào JSON settings của phòng | Chi tiết trả lời ở client; thời gian tổng kết đang là 0; Redis chỉ có người từng nộp nên có thể thiếu người 0 lượt trả lời; đọc leaderboard chưa fallback dữ liệu cuối trận từ DB |

Điểm cần xử lý thêm: giao diện bật `showCorrectAnswers` ngay khi client đánh dấu đã nộp; backend trả đáp án đúng ngay qua `answer_result`. Cần chỉ công bố ở pha kết quả chung. Đồng hồ client hiện lấy deadline trừ `Date.now()` mà chưa hiệu chỉnh chênh lệch đồng hồ với server.

Tài liệu `docs/realtime-audit-and-plan.md` có cả mô tả cũ và phần đã triển khai; bảng trên đối chiếu trực tiếp code hiện tại, không coi các kết quả kiểm thử ghi trong tài liệu cũ là kết quả kiểm thử của lượt này.

## 2. Luồng đề xuất

`WAITING → STARTING → QUESTION → REVEAL (5 giây) → QUESTION tiếp theo → … → REVEAL câu cuối → FINISHED`

- Chủ phòng bấm bắt đầu một lần. Server tạo trận, chốt roster, thứ tự/nội dung câu hỏi và phát trạng thái chung. `STARTING` cho tải dữ liệu và đếm ngược ngắn; client chậm lấy snapshot mới nhất, không làm cả phòng chờ vô hạn.
- Mỗi câu có `questionStartedAt`, `questionDeadlineAt` và phiên bản trạng thái. Server quyết định mở/đóng câu; client chỉ hiển thị thời gian còn lại.
- Khi tất cả người trong roster đã nộp, hoặc deadline đến, server khóa câu và công bố kết quả cho cả phòng.
- Người mất mạng vẫn ở roster. Nếu chưa trả lời thì chờ tối đa đến deadline, ghi nhận không trả lời; không loại khỏi trận hay bảng tổng kết. Khi có mạng lại, tự về đúng pha đang diễn ra, không reset giờ và không trả lời bù câu đã đóng.
- Pha kết quả có `revealEndsAt`; sau đúng 5 giây server chuyển câu. Câu cuối cũng có đủ 5 giây trước tổng kết.
- Chủ phòng reload/mất mạng không làm dừng trận. Người hoàn toàn mới chưa thuộc roster không vào thi giữa trận.

## 3. Thời gian, tính điểm và xếp hạng đề xuất

- Câu một đáp án: chọn đáp án là gửi ngay. Câu nhiều đáp án/nhập nội dung: thời điểm bấm xác nhận là lúc nộp cuối cùng.
- Ghi `receivedAt` ngay khi server nhận lệnh; `responseTimeMs = receivedAt - questionStartedAt`. Ghi cả thời điểm bấm phía client để phân tích, nhưng không dùng timestamp do client tự khai làm nguồn chấm điểm.
- Cách đo này có bao gồm độ trễ mạng. Hiệu chỉnh đồng hồ giúp hiển thị đồng bộ, không đồng nghĩa loại bỏ hoàn toàn ảnh hưởng mạng tới thứ hạng.
- Đề xuất điểm chuẩn tối đa 1.000/câu: trả lời đúng nhận `round(1000 × (1 - 0.5 × responseTimeMs / durationMs))`; thời gian được giới hạn trong khoảng hợp lệ. Đúng nhanh được gần 1.000, đúng sát hết giờ được gần 500; sai/không trả lời được 0. Đây là công thức đề xuất để duyệt, chưa áp dụng.
- Bảng từng câu xếp người đã trả lời theo thời gian tăng dần, ghi rõ đúng/sai, thời gian, điểm câu và điểm tổng. Người không trả lời nằm cuối. Đánh dấu riêng “trả lời đúng nhanh nhất” để không coi bấm sai nhanh là thắng.
- Bảng cuối trận: điểm tổng giảm dần, số câu đúng giảm dần, tổng thời gian trả lời đúng tăng dần. Nếu vẫn bằng nhau thì đồng hạng; dùng user ID để giữ thứ tự hiển thị ổn định.

## 4. Thứ tự triển khai

### Bước 1 — Trạng thái trận và dữ liệu bền vững

- Tách điều phối trận khỏi gateway vào service; gateway phụ trách nhận lệnh và phát sự kiện.
- Thêm dữ liệu trận, roster, câu trong trận và lượt trả lời ở PostgreSQL; liên kết với phòng hiện có, tránh tạo luồng trùng lặp không cần thiết với QuizSession.
- Mỗi trận có `gameId`; mỗi người chỉ có một đáp án được chấp nhận cho mỗi câu. Lưu lựa chọn, đúng/sai, thời gian nhận, thời gian trả lời và điểm.
- Snapshot có phase, version, serverTime, deadline, số đã nộp/tổng người, trạng thái cá nhân và kết quả phù hợp với phase. Không gửi đáp án đúng của câu chưa công bố.
- Đồng bộ việc nhận đáp án, cộng điểm và đóng câu để tránh tranh chấp khi đáp án cuối cùng tới cùng lúc timer hết hạn. Chuyển pha phải idempotent qua nhiều backend instance.
- Dùng cơ chế lịch chạy có phục hồi và đối soát các trận đang chạy khi backend khởi động; không chỉ dựa vào `setTimeout` trong RAM. Snapshot/đáp án trong DB là nguồn phục hồi khi Redis mất dữ liệu.

### Bước 2 — Start và resume ổn định

- Gom frontend về một nơi sở hữu trạng thái trận; giảm listener/join/get-state trùng giữa trang phòng và trang chơi.
- Resume theo user đã xác thực + room/game; nhận snapshot đầy đủ trước khi xử lý lệnh đang chờ. Lệnh nộp có ID ổn định để retry không nhân đôi điểm.
- UI phân biệt đang gửi, đã được nhận, bị từ chối và đang kết nối lại. Không tự khóa vĩnh viễn đáp án chỉ vì đã gọi gửi socket.
- Khôi phục lựa chọn đã được nhận, điểm, lịch sử và kết quả câu; loại sự kiện cũ bằng gameId/version/questionId.

### Bước 3 — Chấm theo tốc độ và kết quả câu 5 giây

- Kiểm tra roster, phase QUESTION, câu hiện tại, deadline và loại đáp án trước khi chấp nhận.
- Thực hiện công thức đã duyệt bằng thời gian server; trả ACK cá nhân, phát tiến độ đã nộp nhưng giữ kín đáp án đúng tới REVEAL.
- Thêm màn kết quả từng câu cho mọi người, countdown theo `revealEndsAt`, tự chuyển tiếp; bỏ phụ thuộc vào nút next thông thường của chủ phòng.
- Rà soát loại câu hỏi được hỗ trợ. Câu không có quy tắc chấm tự động (ví dụ tự luận) cần bị chặn khi tạo/bắt đầu trận realtime hoặc có quy tắc riêng; không âm thầm chấm sai.

### Bước 4 — Tổng kết đầy đủ

- Bảng mọi người: tên/avatar, hạng, điểm, đúng/sai/bỏ qua, độ chính xác và thời gian trả lời; gồm cả người mất mạng hoặc chưa nộp lần nào.
- Chi tiết từng câu lấy dữ liệu đã lưu trên server; reload và quay lại sau khi kết thúc vẫn xem được.
- Cập nhật màn chơi/kết quả phù hợp realtime, bỏ dữ liệu giả thời gian bằng 0 và thao tác “chơi lại” chỉ reload trang.

### Bước 5 — Kiểm thử nghiệm thu

- 3–5 người: bấm start một lần, tất cả vào cùng câu; client tải chậm bắt kịp đúng trạng thái.
- Reload trước/sau nộp, mất mạng dưới/trên 30 giây, reconnect lúc start/REVEAL/FINISHED; điểm và đáp án không mất/nhân đôi.
- Đáp án nhanh/chậm/sai, nộp trùng từ nhiều tab, gói tin đến trễ, nộp câu cũ/câu tương lai, chỉnh đồng hồ client.
- Người cuối nộp cùng lúc hết hạn: chỉ một lần REVEAL, một lần cộng điểm, một lần chuyển câu.
- Không ai trả lời hoặc một người offline: vẫn kết thúc câu đúng deadline; REVEAL đủ 5 giây, kể cả câu cuối.
- Chủ phòng mất mạng; backend restart; hai backend replica; sự kiện đến sai thứ tự; mất ACK sau khi đã ghi đáp án.
- Tổng kết đủ roster, phép cộng khớp chi tiết từng câu; reload sau khi cache hết hạn vẫn xem được kết quả.

## 5. Các vùng code chính

- `server/src/modules/room-play/gateways/room-websocket.gateway.ts`
- `server/src/modules/room-play/services/room.service.ts`
- `server/prisma/schema.prisma` và migration tương ứng
- `web/src/lib/websocket.ts`, `web/src/common/types/websocket-event.type.ts`
- `web/src/modules/client/pages/RoomQuizPage.tsx`
- `web/src/modules/client/game-quiz/` (hook, trang chơi và component kết quả)

## 6. Kiểm chứng ở lượt lập kế hoạch

- Đã đọc code backend, frontend, schema và hai bộ unit test realtime hiện có.
- Đã chạy hai bộ `room-game-state.gateway.spec.ts` và `room-presence.service.spec.ts`: 2/2 suite, 7/7 test pass. Jest có cảnh báo tác vụ bất đồng bộ chưa dọn ngay sau test; lệnh kết thúc với exit code 0. Các test này chưa chứng minh toàn bộ luồng nhiều client hoạt động đúng.
- Chưa thực hiện E2E nhiều trình duyệt hoặc kiểm thử mạng thật ở lượt này.

## 7. Trạng thái triển khai

- Đã triển khai: pha `QUESTION → REVEAL → QUESTION/FINISHED`, reveal 5 giây, tự chuyển câu, chấp nhận khi đủ người hoặc hết deadline.
- Đã triển khai: điểm đúng theo thời gian server nhận, chống nộp trùng, bảng tốc độ từng câu, roster gồm cả người chưa nộp, tie-break leaderboard và resume đáp án cá nhân.
- Đã triển khai: lưu snapshot, đáp án realtime và leaderboard cuối trận trong `QuizRoom.settings`, có fallback khi Redis mất dữ liệu.
- Đã triển khai: frontend nhận trạng thái/version, countdown reveal, hiển thị bảng kết quả câu và tổng kết toàn phòng; queue lệnh sau reconnect chờ rejoin phòng.
- Còn cần môi trường staging để nghiệm thu nhiều trình duyệt, mất mạng thật, restart backend và nhiều replica; các kiểm thử này không thể chứng minh chỉ bằng unit test hiện có.
