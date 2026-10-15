# Dự toán backend cho The Lost Sketchbook

> Cập nhật: 14/10/2026. Đã chọn Supabase; bản V1 có đăng nhập, lưu tiến độ cloud và thử thách bạn bè. Bảng giá bên dưới vẫn là dự toán, không phải báo giá.
> USD/tháng, chưa thuế, tên miền, email/SMS, công phát triển và vận hành.
> Số liệu tải là giả định để lập ngân sách, không phải benchmark hay báo giá cố định.
> 1 KiB = 1024 byte; 1 GiB = 1024^3 byte. Khi đối chiếu hóa đơn cần kiểm tra đơn vị GB/GiB của nhà cung cấp.

## 1. Kết luận

Backend cho việc người chơi tự giấu vật trên tranh có sẵn khá nhẹ. Đề chỉ lưu ID tranh và sprite, tọa độ,
kích thước, ngụy trang, gợi ý; không sao chép tranh vào từng đề. Game vẫn vẽ và chạy luật trên máy người chơi.
Mạng chỉ dùng lúc đăng nhập, xuất bản/tải đề, gửi kết quả và đồng bộ.

Backend đang dùng Supabase Auth + Postgres RPC; Cloudflare có thể phục vụ web tĩnh.
Thêm R2 khi cần ảnh xem trước hoặc nội dung ảnh. Firebase là một lựa chọn thay thế, không cần dùng đồng thời
Firebase và Supabase cho cùng tài khoản/dữ liệu.

## 2. Số liệu đo từ repo

| Hạng mục | Kết quả |
|---|---:|
| Trang ngày + đêm | 48 trang, 543 vật |
| Tổng JSON trang hiện có | 353.850 byte |
| JSON trung bình/trang | 7.372 byte |
| 37 tranh WebP | 8.462.026 byte; trung bình 228.703 byte/tranh |
| Đề mẫu 10 vật, có tọa độ và gợi ý | 2.095 byte JSON; 410 byte gzip |
| Web export toàn bộ | 22.551.409 byte, khoảng 21,5 MiB |
| JavaScript web hiện tại | 3.938.196 byte |
| CanvasKit WASM hiện tại | 8.076.553 byte |

Đề mẫu dùng gợi ý lặp nên gzip đặc biệt tốt; không lấy 410 byte làm dung lượng chuẩn của mọi đề.
Dự toán dành **5 KiB/đề** để có dư địa. Tải đề 5 KiB không đồng nghĩa tải lại 21,5 MiB bản web.
Dung lượng export là tổng file chưa nén, không phải lượng tải chính xác trong lần mở đầu tiên.
SDK đăng nhập có thể làm bundle tăng; phải đo build trước/sau khi chọn SDK, chưa đưa ra số tăng giả định.

## 3. Những phần cần thiết

| Phần | Bản đầu chia sẻ bạn bè | Khi mở cộng đồng/đồng bộ |
|---|---|---|
| Trình giấu vật trong app | Chọn trang đã chơi, chọn sprite, chạm tranh để đặt vật, đặt tên/ngụy trang/gợi ý, xuất bản mã | Thêm bộ lọc và quản lý nhiều đề |
| Danh tính người tạo/nhận | Tài khoản hoặc tài khoản khách có token xác thực | Liên kết tài khoản, khôi phục, nhiều thiết bị |
| Lịch sử đã chơi | Kiểm tra cùng ID màn ở cả hai người, ngày/đêm riêng | Đồng bộ lịch sử và nguồn bản lưu cũ |
| Lưu và xuất bản đề | ID, mã ngắn, tác giả, phiên bản nội dung, bố trí vật, trạng thái | Tìm kiếm, danh sách công khai, phân trang |
| API | Xuất bản, nhận mã, kiểm tra quyền, thu hồi đề | Gửi kết quả, đánh giá, báo cáo |
| Nháp/cache offline | Tiến độ vẫn lưu trên máy; khi đăng nhập được gộp với bản cloud; xuất bản/nhận đề cần mạng | Hàng đợi đồng bộ, xử lý xung đột |
| Kiểm tra dữ liệu/quyền | Chỉ sprite có sẵn; tọa độ trong giấy; giới hạn cỡ/độ dài/số vật; chỉ chủ đề được sửa | Chống spam và công cụ quản trị |
| Vận hành | Log lỗi, giới hạn tần suất, sao lưu và thử khôi phục | Chỉ số tải, cảnh báo ngân sách, lưu trữ dài hạn |
| File ảnh | Chưa cần upload khi dùng tranh có sẵn | R2/Storage cho thumbnail, avatar, tranh riêng |
| Realtime/chat | Chưa cần cho việc gửi đề rồi chơi sau | Chỉ tính thêm khi có thi đấu đồng thời/chat |

“Đã chơi” theo yêu cầu hiện tại là đã vào chơi trong sổ, không yêu cầu thắng. Backend kiểm tra lịch sử
đã ghi cho tài khoản; mở Trang của ngày không tự cấp quyền cho cả màn. Bản lưu offline cũ không có bằng chứng
chống sửa: cần quyết định chấp nhận lịch sử nhập lên, hay yêu cầu một lượt vào chơi có kết nối để ghi nhận.
Không coi một chuỗi ID hoặc UUID do client gửi là bằng chứng danh tính.

Luồng: người tạo đăng nhập → kiểm tra lịch sử → dựng đề → API kiểm tra → lưu phiên bản đã xuất bản → cấp mã.
Người nhận đăng nhập → nhập mã → backend kiểm tra lịch sử → tải bố trí → chơi trên máy → gửi kết quả nếu cần.

Bố trí đã xuất bản nên bất biến; sửa tạo phiên bản mới để cùng mã/phiên bản luôn là cùng đề. Nếu lưu JSON trong
R2, bucket bố trí phải riêng tư và endpoint vẫn kiểm tra lịch sử trước khi trả dữ liệu; không dùng URL công khai
để vô tình bỏ qua điều kiện nhận thử thách. Thumbnail có thể công khai nhưng không lộ đáp án.

## 4. Dữ liệu và API đề xuất

| Bảng/collection | Nội dung | Khi nào cần |
|---|---|---|
| user_progress | user ID + bản lưu JSON; một bản cho mỗi tài khoản | V1 |
| page_visits | user ID + page ID đã vào chơi, ngày/đêm riêng | V1 |
| friend_challenges | mã, owner ID, page ID, content version, JSON vật, thời gian, trạng thái | V1 |
| challenge_attempts | user ID, challenge ID + revision, lần bắt đầu/kết thúc, kết quả | Nếu so thành tích/lưu lịch sử |
| reports | người báo cáo, đề, lý do, trạng thái xử lý | Nếu đề công khai |

Chỉ mục tối thiểu: mã thử thách duy nhất; (user_id, page_id) duy nhất; (owner_id, created_at);
(challenge_id, revision, user_id); (status, created_at) cho danh sách công khai. Tránh đánh chỉ mục mọi tọa độ
và toàn bộ JSON gợi ý trong Firestore. Đề xuất mã ngẫu nhiên 8–10 ký tự có kiểm tra trùng, không dùng ID tăng dần.

API V1: ghi nhận lượt vào màn; xuất bản đề; lấy đề theo mã; thu hồi đề; đọc/ghi bản lưu tiến độ.
Danh sách phân trang/báo cáo và lưu lượt thử thách là phần mở rộng cộng đồng. Các thao tác ghi cần khóa chống
ghi trùng khi retry. Gợi ý khởi đầu: 5–20 vật/đề, request tối đa 64 KiB, tạo tối đa 5 đề/ngày/tài khoản;
đây là giới hạn đề xuất, chưa phải luật được chốt.

Chỉ giữ một kết quả tốt nhất/người/đề và xóa log lượt chi tiết cũ để kiểm soát dung lượng. Không ghi từng frame,
vị trí kính lúp hoặc timer từng giây lên server. Game casual có thể so kết quả client gửi; nếu muốn xếp hạng
có chống gian lận thì cần thiết kế xác thực lượt riêng. Có backend không tự bảo đảm kết quả trung thực.

## 5. Giả định cho bản có thêm đồng bộ và danh sách cộng đồng

- N là người dùng hoạt động/tháng (MAU); giả sử N cũng là số tài khoản được lưu để tính dung lượng.
- Mỗi ngày có 20% N hoạt động (DAU); tháng 30 ngày; MAU không phải số người đang chơi đồng thời.
- Mỗi DAU chơi 3 thử thách/ngày, tạo trung bình 0,1 đề/ngày, mở 1 trang danh sách gồm 20 thẻ/ngày.
- Ngân sách 9 request, 32 lượt đọc logic, 6 lượt ghi logic/DAU/ngày, gồm kiểm tra quyền và đồng bộ.
- 5 KiB/đề; 1 KiB hồ sơ + 20 KiB tiến độ + tối đa 6 KiB lịch sử màn/tài khoản.
- Giữ đề 12 tháng, kết quả chi tiết 90 ngày; mỗi kết quả 0,5 KiB.
- Nhân đôi dữ liệu logic để dự phòng chỉ mục/metadata; chưa tính nền hệ thống Postgres và sao lưu riêng.
- Egress: 3 đề × 5 KiB + danh sách 4 KiB + tiến độ 20 KiB/DAU/ngày; cộng dự phòng 20%.
- Không có SMS, chat, video, ảnh upload, AI, push hay kết nối realtime liên tục trong mô hình này.

Nếu số tài khoản đăng ký lớn hơn N, phần hồ sơ/tiến độ tăng theo tổng tài khoản; Auth tính theo MAU.
Nếu lưu tất cả đề/kết quả mãi mãi, dung lượng tiếp tục tăng. Các thời hạn trên là giả định ngân sách;
cần chọn chính sách giữ dữ liệu trước khi triển khai, không tự xóa đề đang được người chơi sử dụng.

| Chỉ số | 1.000 MAU | 10.000 MAU | 100.000 MAU |
|---|---:|---:|---:|
| DAU | 200 | 2.000 | 20.000 |
| Đề mới/tháng | 600 | 6.000 | 60.000 |
| Lượt chơi thử thách/tháng | 18.000 | 180.000 | 1.800.000 |
| Request/tháng | 54.000 | 540.000 | 5.400.000 |
| Đọc logic/tháng | 192.000 | 1.920.000 | 19.200.000 |
| Ghi logic/tháng | 36.000 | 360.000 | 3.600.000 |
| DB sau thời gian giữ dữ liệu, có hệ số ×2 | 0,17 GiB | 1,72 GiB | 17,17 GiB |
| Egress JSON/tháng | 0,27 GiB | 2,68 GiB | 26,78 GiB |
| Request/giây trung bình | 0,021 | 0,208 | 2,083 |
| Đỉnh giả định gấp 20 trung bình | 0,42 | 4,17 | 41,67 |

Công thức: request = 54N; đọc = 192N; ghi = 36N; đề mới = 0,6N; lượt chơi = 18N.
DB byte = 2 × (27 + 0,6 × 12 × 5 + 18 × 3 × 0,5) × 1024 × N = 180 KiB × N.
Egress byte = 1,2 × (18 × 5 + 6 × 4 + 6 × 20) × 1024 × N = 280,8 KiB × N.

Đọc logic không đồng nghĩa đơn vị tính tiền: Firestore tính document và một số index/rule reads; D1 tính
rows quét và ghi cả chỉ mục; Postgres cần đo CPU, I/O, kế hoạch truy vấn. Đỉnh ×20 là giả định, không bao phủ
một đợt chia sẻ lan truyền. Cần thử tải trước khi khẳng định cấu hình compute cụ thể đủ.

Bản V1 hiện có cloud save và chia sẻ bạn bè, chưa có feed công khai; lượng đọc feed trong mô hình là phần mở rộng.
Không nên chọn server lớn chỉ dựa trên số MAU.

## 6. Giá và ngân sách

### Supabase

Free: 500 MB DB, 5 GB egress, 50.000 MAU. Pro từ $25/tháng, một project Micro được bù bởi compute credit;
gồm 8 GB DB, 250 GB egress, 100.000 MAU. Vượt DB: $0,125/GB; vượt MAU: $0,00325/MAU.
Free có thể pause sau một tuần không hoạt động. [Bảng giá Supabase](https://supabase.com/pricing).

Nếu mọi request chạy Edge Function, 5,4 triệu request ở 100.000 MAU vượt 2 triệu được gồm trong Pro;
dự phòng $8 cho 4 triệu invocation bổ sung. API/RPC trực tiếp không tự tính như Edge Function.
[Bảng giá Functions](https://supabase.com/docs/guides/functions/pricing).

Ở 100.000 MAU, mô hình danh nghĩa: $25 + khoảng $1–2 DB vượt + tối đa khoảng $8 Functions = khoảng $34–35,
trước thay đổi compute và các phụ phí khác. Dự phòng **$35–90/tháng**: nâng từ Micro lên Medium có thể cộng
khoảng $50. Đây là khoảng lập ngân sách, không xác nhận Micro xử lý được mọi đỉnh tải.
[Cách tính compute](https://supabase.com/docs/guides/platform/manage-your-usage/compute).

### Firebase

Firestore miễn phí 50.000 đọc và 20.000 ghi/ngày, 1 GiB DB, 10 GiB egress/tháng.
[Quota Firestore](https://firebase.google.com/docs/firestore/pricing).
Bảng mặc định đang hiển thị $0,03/100.000 đọc, $0,09/100.000 ghi; giá phụ thuộc region.
Ở 100.000 MAU: khoảng $5,31 đọc + $2,70 ghi + $2,42 lưu DB theo đơn giá mặc định, trước deletes,
backup, egress, Functions và Auth. Storage tính trung bình theo thời gian, không chỉ dung lượng cuối tháng.
[Giá Google Cloud](https://cloud.google.com/firestore/pricing).

Functions cần Blaze; miễn phí invocation không đồng nghĩa không cần liên kết billing. Chọn region/generation,
thời gian chạy và đường đi dữ liệu rồi mới tính chính xác compute/egress. Ngân sách hạ tầng JSON ở quy mô lớn:
**$15–40/tháng**, chưa Auth tính MAU. [Giá Firebase](https://firebase.google.com/pricing).

Nếu bật Firebase Authentication with Identity Platform, 100.000 MAU email/social:
(100.000 − 50.000) × $0,0055 = **$275/tháng riêng Auth**. Không áp mức này cho mọi cấu hình Firebase Auth;
Auth tiêu chuẩn và Identity Platform phải phân biệt. Không tính SMS vào bảng.
[Identity Platform](https://cloud.google.com/identity-platform/pricing).

### Cloudflare Workers + D1

Workers Paid nền $5/tháng gồm 10 triệu request và 30 triệu CPU-ms. Giả sử 5 ms CPU/request,
5,4 triệu request dùng 27 triệu CPU-ms; cả hai còn trong mức gồm.
[Giá Workers](https://developers.cloudflare.com/workers/platform/pricing/).

D1 Paid gồm 5 GB; vượt $0,75/GB-tháng. Khoảng 17,17 GiB tương đương 18,43 GB thập phân: tùy đơn vị hóa đơn,
phần vượt khoảng $9–11, tổng cùng Workers khoảng $14–16/tháng trước Auth và phụ phí. 3,6 triệu ghi logic/tháng có dư địa trong quota Paid, nhưng phải đo
ghi chỉ mục và quét truy vấn thực tế. [Giá D1](https://developers.cloudflare.com/d1/platform/pricing/).

D1 giới hạn mỗi DB: 500 MB Free, 10 GB Paid. Mô hình 17 GiB **không vừa một DB**: phải phân vùng,
hoặc đưa payload/tiến độ lưu trữ phù hợp sang R2 và giảm thời gian giữ dữ liệu. Free có quota tổng 5 GB
không có nghĩa một DB Free chứa được 5 GB. [Giới hạn D1](https://developers.cloudflare.com/d1/platform/limits/).

Ngân sách Workers+D1 **$15–25/tháng** ở 100.000 MAU chỉ là hạ tầng, chưa hệ thống đăng nhập.
Đăng nhập khách hoặc OAuth cần được triển khai/tích hợp riêng; nếu chọn Supabase Auth 100.000 MAU thì cộng
ít nhất gói Pro $25, thành khoảng $40–50. Như vậy rẻ hơn từng dịch vụ không bảo đảm rẻ hơn cả hệ thống.

### Bảng dự phòng chung

| Cấu hình | 1.000 MAU | 10.000 MAU | 100.000 MAU |
|---|---:|---:|---:|
| Supabase: Auth + DB + Functions theo mô hình | $0 thử nghiệm / $25 Pro | Khoảng $25 | $35–90 |
| Firebase: DB + API; chưa Auth tính MAU | $0–5 | $0–5 | $15–40 |
| Firebase với Identity Platform email/social | $0–5 | $0–5 | Khoảng $290–315 |
| Workers + D1; chưa Auth | $0 thử nghiệm / $5 Paid | Khoảng $5 Paid | $15–25, phải xử lý giới hạn DB |
| Workers + D1 + Supabase Auth | $0–5, giới hạn Free áp dụng | Khoảng $5, Auth Free | Khoảng $40–50 |

Các cấu hình không hoàn toàn ngang nhau: Cloudflare chưa có Auth người chơi tích hợp như Supabase/Firebase.
Những hàng $0 là khả năng dùng quota thử nghiệm, không bao gồm mọi yêu cầu production, backup hay hỗ trợ.

## 7. Ảnh xem trước và bản web

Nếu mỗi đề có thumbnail 100 KiB, giữ 12 tháng: 0,69 / 6,87 / 68,66 GiB ở ba quy mô.
Mỗi DAU xem 20 thumbnail/ngày, chưa cache: khoảng 11,44 / 114,44 / 1.144,41 GiB tải/tháng.
Điểm làm lưu lượng tăng mạnh là **lướt ảnh**, không phải gửi tọa độ vật.

R2 Standard có 10 GB storage, 1 triệu Class A, 10 triệu Class B/tháng miễn phí;
vượt lưu trữ $0,015/GB-tháng, Class B $0,36/triệu; không phí egress trực tiếp.
Ở 100.000 MAU, khoảng 69 GiB (74 GB thập phân) thumbnail + 12 triệu lượt đọc/tháng cho ra khoảng $1,6–2
cho R2 theo giả định này, trước các dịch vụ khác. Cache có thể giảm lượt đọc origin.
[Bảng giá R2](https://developers.cloudflare.com/r2/pricing/).

Đề thumbnail có thể dùng lại tranh có sẵn ở V1, tránh sinh/tải ảnh riêng cho mỗi đề.
Tranh riêng, video và AI là phạm vi khác: thêm chuyển đổi ảnh, kiểm duyệt, quota upload và dự toán riêng.

Web hiện khoảng 21,5 MiB export. Một lượt tải toàn bộ chưa nén/người/tháng tương ứng khoảng
21 / 210 / 2.100 GiB ở ba quy mô; đây là cận tính thô, không phải traffic đo được.
Cloudflare Workers Static Assets phục vụ file tĩnh không tính phí request và lưu trữ Asset;
route API mới tính Workers. [Static Assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).
Không đưa lượt tải WASM, JS và tranh qua endpoint trả JSON hoặc qua DB.

## 8. Các khoản và việc thường bị bỏ sót

| Hạng mục | Cách tính/điều cần làm |
|---|---|
| Email đăng nhập, xác nhận, quên mật khẩu | Chọn SMTP nếu dùng email; phí theo nhà cung cấp và lượng gửi |
| SMS OTP | Tính riêng theo số SMS/quốc gia; mô hình trên không dùng SMS |
| Tên miền | Phí năm theo tên miền cụ thể; chưa chọn nên không gắn giá cố định |
| Môi trường test | Project riêng có thể phát sinh compute; không mặc định thêm project là miễn phí |
| Backup | Chính sách riêng cho DB và object storage; diễn tập khôi phục |
| Log/analytics | Giới hạn retention; không log vị trí kính lúp từng frame |
| Giới hạn chi tiêu | Theo dõi quota, rate limit, CPU limit, ngân sách và hạn mức; cảnh báo không phải lúc nào cũng tự dừng hóa đơn |
| Nội dung cộng đồng | Công cụ báo cáo/ẩn đề và người vận hành; không chỉ chi phí server |
| Xóa tài khoản/thu hồi đề | Quản lý quyền sở hữu, đề đã tải xuống, thời gian giữ dữ liệu |
| Phiên bản game | Người nhận phải có page/sprite/content version phù hợp; lỗi rõ khi khác phiên bản |
| Offline/nhiều máy | Giữ bản lưu local, đồng bộ khi có mạng, gộp id/sao/điểm; xử lý revision và sticker |
| Secrets | Quyền người dùng/RLS; khóa quản trị chỉ ở backend, không đóng gói vào app |

SMTP mặc định Supabase chỉ phục vụ thử nghiệm, bị hạn chế người nhận và tần suất; email production cần SMTP
riêng. [Tài liệu SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
Nếu chọn Google/social login thì mô hình phí email sẽ khác; không giả định mọi lượt đăng nhập đều là email.

## 9. Áp dụng vào repo và khối lượng phát triển

- Tiến độ vẫn được ghi local; khi có tài khoản, `platform/cloudProgress` gộp với `user_progress` và đồng bộ các lượt vào trang.
- `ChallengeCreate` cho chọn sprite và đặt vị trí trên tranh; RPC lưu đề, kiểm tra trang đã chơi và giới hạn nội dung.
- `platform/friendChallenges` xuất bản/nhận mã; `useNavigation` dựng trang tùy biến theo mã đã tải.
- Không trộn kết quả màn người dùng tạo vào sceneResults của màn chính thức.
- Cache Board dùng layoutKey riêng theo challenge ID để không vẽ nhầm bố trí.
- Xuất bản/nhận đề cần đăng nhập và mạng; khách vẫn chơi bản chính bằng tiến độ lưu trên thiết bị.
- Bản lưu local và cloud được gộp theo quy tắc backup hiện có.
- Giữ giới hạn Expo Go; cài dependency bằng expo install và đo bundle sau lựa chọn.

Firebase JS SDK hỗ trợ Auth/Firestore trong Expo Go; React Native Firebase cần native code và không dùng được
trong Expo Go. [Hướng dẫn Expo](https://docs.expo.dev/guides/using-firebase/).
Supabase có [hướng dẫn Expo chính thức](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native).
Không mặc định persistence/offline SDK chạy giống nhau trên web và native; kiểm tra đúng nền tảng khi triển khai.

Ước lượng của mình cho một người đã quen repo:

| Công việc | Ngày công dự kiến |
|---|---:|
| Trình giấu vật, nháp, thử đề | 5–8 |
| API, DB, mã ngắn, quản lý phiên bản đề | 3–5 |
| Auth và lịch sử đã chơi ở hai phía | 2–4 |
| Kiểm tra web/native, quota, backup và phát hành | 3–5 |
| Tổng V1 chia sẻ bạn bè | 13–22 |
| Đồng bộ nhiều máy và xử lý bản lưu cũ | Thêm 5–10 |
| Feed công khai, báo cáo/quản trị | Thêm 4–8 |

Đây là khoảng lập kế hoạch, không cam kết thời gian. Cần tiếp tục đo payload/bundle/API thực tế và hoàn thiện
quản lý đề, chống lạm dụng, sao lưu/khôi phục và kiểm thử thiết bị trước khi mở feed công khai.

