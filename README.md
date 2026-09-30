# 🔍 The Lost Sketchbook — Detective Hidden Object Adventure

Một trò chơi phiêu lưu tìm vật thể ẩn (Hidden Object Game) lấy cảm hứng từ phong cách mỹ thuật ký họa màu nước Singapore và tương tác vật lý 3D của ThreeUI / Meng To.

---

## 🌟 Tính Năng Phiên Bản 0.1 (MVP)

- **Cơ chế Kính Lúp Quang Học (Interactive Loupe):** Kéo rê kính lúp để soi các chi tiết màu nước, với hiệu ứng phóng đại thực tế, khúc xạ viền tròn và phản quang.
- **Quyển Sổ 3D Lật Trang (3D Physics Sketchbook):** Nghiêng theo chuột (Perspective Tilt), bóng đổ tiếp xúc và lật trang 3D mượt mà khi hoàn thành màn chơi.
- **Hệ Thống Màn Chơi Theo Dữ Liệu (Data-Driven JSON Levels):**
  - **Tọa độ chuẩn hóa ($0.0 \rightarrow 1.0$):** Chơi mượt mà trên mọi kích cỡ màn hình (Desktop, Laptop, Tablet, Mobile).
  - **Chapter 1:** Gồm 3 màn chơi (Marina Bay Sands, Gardens by the Bay, Merlion Park).
  - **Mỗi màn:** 5 manh mối chính + 1 cổ vật bí mật (Secret Object).
- **Hệ Thống Điểm & Combo:**
  - Nhân đôi, nhân ba điểm khi tìm liên tiếp trong vòng 6 giây ($\times 2, \times 3$).
  - Trừ điểm nhẹ khi click sai kèm hiệu ứng rung màn hình (Screen shake).
- **Hệ Thống Gợi Ý 3 Cấp Độ (Hint System):**
  - Cấp 1: Gợi ý văn bản mở rộng.
  - Cấp 2: Kính lúp rung nhẹ định hướng về phía vật thể.
  - Cấp 3: Vòng sóng radar phát sáng trực tiếp trên bản đồ.
- **Âm Thanh Tự Nhiên (Web Audio API):**
  - Tiếng chuông tìm trúng vật phẩm (TING!), âm click sai, âm thanh sột soạt lật trang giấy, và nhạc chiến thắng.
- **Lưu Tiến Độ Tự Động (localStorage):**
  - Lưu màn chơi đã mở khóa, xếp hạng sao ($\bigstar\bigstar\bigstar$), kỷ lục điểm số và thời gian.

---

## 🦎 Phiên Bản 0.2 — Sinh Vật & Đồ Vật Ngụy Trang

Đồ vật và con vật không còn "dán" nổi bật lên tranh nữa mà được **vẽ lẫn vào bức màu nước**:

- **4 kiểu ngụy trang:**
  - **Hòa vào nét vẽ (`ink`)** — màu mực nhạt, hòa (multiply) vào giấy như một phần của bản ký họa.
  - **Đổi màu theo nền (`chameleon`)** — game tự lấy mẫu màu tranh quanh vật và tô lại vật bằng đúng màu đó; chỉ còn lại đường viền mờ.
  - **Mực tàng hình (`invisible`)** — vô hình trên trang, chỉ phát sáng khi soi qua kính lúp.
  - **Nhút nhát (`shy`)** — con vật trốn đi, thỉnh thoảng mới ló ra/nhảy lên trong vài giây. Click lúc nó đang trốn không bị trừ điểm.
- **Nấp sau vật (`occluder`):** một mảnh tranh được vẽ đè lên con vật, nên nó như đang núp sau thân cây, cột nhà, giỏ xe đạp…
- **Dưới nước (`waterline`):** phần thân dưới mặt nước mờ dần vào tranh (rái cá, rùa, thuyền giấy…).
- **Mắt chớp chớp:** sinh vật ẩn thỉnh thoảng chớp mắt — dấu hiệu tinh ý để phát hiện.
- **Khi tìm thấy:** vật "nở" màu trở lại kèm quầng màu nước, cánh bướm vỗ, đuôi vẫy.
- **Sinh vật ẩn nấp (bonus):** mỗi trang có 3–4 sinh vật tí hon không bắt buộc (thạch sùng, cua, ốc sên, bọ rùa, nhện…) — cộng điểm, không có gợi ý, được lưu vào tiến độ và hiện ở mục lục.
- **17 hình vẽ mới:** thạch sùng, tắc kè hoa, ếch, ốc sên, bọ rùa, chuột, cá koi, cua, rái cá, bói cá, dơi, khỉ, bướm đêm, chuồn chuồn, nhện, hạc giấy, thuyền giấy.
- Bảng manh mối chỉ hiện **hình bóng** của vật cần tìm và nhãn kiểu ngụy trang của nó.

### Khai báo một vật ẩn trong file màn chơi (`src/levels/**.json`)

```jsonc
{
  "id": "wall-gecko",
  "name": "Thạch Sùng Tường Hồng",
  "clue": "Gợi ý hiển thị trên thẻ manh mối",
  "x": 0.138, "y": 0.628,        // tọa độ chuẩn hóa 0–1 trên trang sách
  "radius": 0.032,               // bán kính vùng click (theo bề ngang trang)
  "score": 150,
  "spriteType": "gecko",
  "scale": 0.55,                 // 1 = 4.4% bề ngang trang
  "rotation": 4, "flip": false,
  "camo": "chameleon",           // "ink" (mặc định) | "chameleon" | "invisible"
  "shy": { "period": 7, "offset": 1.5, "from": "below" }, // below | above | left | right | jump
  "occluder": [[0.25, 0.56], [0.28, 0.56], [0.29, 0.69], [0.25, 0.69]], // đa giác tranh vẽ đè lên
  "waterline": 0.55,             // phần dưới 55% chiều cao sprite chìm dưới nước
  "isBonus": true,               // sinh vật tùy chọn (không bắt buộc để qua màn)
  "foundText": "Lời thoại khi tìm thấy"
}
```

> Mẹo: bật nút **Soát Tọa Độ** trong game để xem tọa độ con trỏ và vùng click của từng vật.

---

## 🛠️ Cài Đặt & Chạy Game

```bash
# 1. Cài đặt thư viện (nếu chưa cài)
npm install

# 2. Khởi chạy máy chủ phát triển (Local Dev Server)
npm run dev

# 3. Biên dịch bản đóng gói triển khai (Build for Production)
npm run build
```

Sau khi chạy `npm run dev`, mở trình duyệt tại: `http://localhost:3000`

---

## 🚀 Hướng Dẫn Deploy Lên Vercel (Miễn Phí)

1. Khởi tạo Git và đẩy mã nguồn lên GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial detective sketchbook v0.1"
   git remote add origin https://github.com/<your-username>/hidden-object-game.git
   git push -u origin main
   ```
2. Đăng nhập vào [Vercel](https://vercel.com/), chọn **Add New Project** $\rightarrow$ **Import Git Repository**.
3. Chọn project `hidden-object-game`, nhấn **Deploy**.
4. Game của bạn sẽ trực tuyến tại: `https://hidden-object-game.vercel.app`!
