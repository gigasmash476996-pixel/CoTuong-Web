# 🏮 Xiangqi AI - Cờ Tướng Người vs Máy (React + Vite)

Chào mừng bạn đến với **Xiangqi AI**, một ứng dụng game Cờ Tướng tương tác hiện đại được xây dựng trên nền tảng **React** và **Vite**. Trò chơi cho phép bạn đấu trí với động cơ AI tích hợp sẵn, hỗ trợ nhiều mức độ khó khác nhau cùng giao diện tối giản, hiện đại và vô cùng mượt mà.

---

## ✨ Các Tính Năng Nổi Bật

- 🤖 **Đối thủ AI Đa Dạng**: 
  - **Gà mờ (Depth 2)**: Phù hợp cho người mới bắt đầu.
  - **Trung bình (Depth 3 + Khai cuộc)**: Tích hợp thư viện khai cuộc cơ bản, phù hợp với người chơi có kinh nghiệm trung bình.
  - **Thông minh (Depth 4)**: Đòi hỏi tư duy sâu sắc hơn nhờ tìm kiếm nước đi tối ưu sâu tới 4 nước.
- 🔄 **Xoay Bàn Cờ Tự Động**: Bàn cờ tự động đảo hướng dựa theo màu quân bạn chọn (Đỏ hoặc Đen) để quân của bạn luôn nằm ở phía dưới, giúp nâng cao trải nghiệm quan sát.
- 🛡️ **Hướng Dẫn Nước Đi Hợp Lệ**: Nhấp chọn một quân cờ để xem tất cả các ô có thể di chuyển (có chỉ thị riêng khi ăn quân đối phương).
- ⏱️ **Ghi nhận & Highlight Nước Đi**: Đánh dấu trực quan nước đi gần nhất của cả bạn và AI để dễ dàng theo dõi nhịp độ trận đấu.
- 📊 **Bảng Phân Tích Kỹ Thuật**: Hiển thị nhật ký đánh giá của AI (bao gồm điểm số vị thế và các biến thể nước đi khả dĩ tiếp theo) trong thời gian thực.
- 💾 **Lưu & Tải Trạng Thái Trận Đấu**:
  - Xuất dữ liệu trận đấu hiện tại hoặc trận đấu đã kết thúc ra file định dạng `.json` để lưu trữ.
  - Nhập file `.json` đã lưu để tiếp tục chơi ván cờ dang dở bất cứ lúc nào.
- ↩️ **Hoàn Tác (Undo)**: Cho phép đi lại nếu đi nhầm (tự động hoàn tác cả nước đi của bạn và nước đi tương ứng của AI).
- 🎨 **Giao Diện Đậm Chất Hiện Đại**: Thiết kế theo phong cách tối giản cao cấp, sử dụng bảng màu HSL hài hòa, các hiệu ứng hover mượt mà cùng bố cục chia vùng trực quan.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: [React 18](https://react.dev/) & [Vite](https://vite.dev/) (cho tốc độ khởi động và HMR cực nhanh).
- **Ngôn ngữ**: ES6+ Javascript (Xử lý toàn bộ logic bàn cờ và bộ não AI).
- **Styling**: Vanilla CSS (Tối ưu hóa hiệu năng, giao diện responsive, thiết kế hiệu ứng đổ bóng và bo góc cao cấp).

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
Cotuong/
├── src/
│   ├── engine/
│   │   ├── Game.js      # Định nghĩa luật cờ tướng, nước đi hợp lệ, kiểm tra chiếu tướng/bí đường
│   │   └── AI.js        # Động cơ AI (Thuật toán Minimax kết hợp cắt tỉa Alpha-Beta, Bảng lượng giá vị thế)
│   ├── App.jsx          # Giao diện chính của ứng dụng (Setup Screen, Game Screen, Side Panel)
│   ├── index.css        # Hệ thống styling thủ công (Themes, Grid, Chessboard styles)
│   └── main.jsx         # Điểm khởi đầu của ứng dụng React
├── index.html           # Khung HTML cơ bản
├── package.json         # Danh sách thư viện phụ thuộc và các câu lệnh script
└── vite.config.js       # Cấu hình môi trường Vite
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Môi Trường Phát Triển

Làm theo các bước dưới đây để cài đặt dự án trên máy tính cá nhân của bạn:

### 1. Yêu Cầu Hệ Thống
Đảm bảo bạn đã cài đặt **Node.js** (Phiên bản khuyến nghị: `>= 18.0.0`) trên máy tính. Bạn có thể kiểm tra bằng cách mở Terminal/Command Prompt và chạy:
```bash
node -v
```

### 2. Tải Mã Nguồn
Tải mã nguồn về máy hoặc clone trực tiếp từ repository của bạn:
```bash
git clone <URL_KHO_LƯU_TRỮ_CỦA_BẠN>
cd Cotuong
```

### 3. Cài Đặt Các Thư Viện Phụ Thuộc (Dependencies)
Cài đặt toàn bộ các thư viện cần thiết đã được khai báo trong `package.json`:
```bash
npm install
```
*(Hoặc dùng `yarn install` / `pnpm install` tùy thuộc vào package manager bạn ưa thích)*

### 4. Khởi Chạy Server Phát Triển (Development Server)
Khởi động máy chủ thử nghiệm cục bộ:
```bash
npm run dev
```

Sau khi chạy lệnh thành công, Terminal sẽ hiển thị một đường dẫn cục bộ (thường là `http://localhost:5173`). Hãy mở trình duyệt và truy cập địa chỉ này để bắt đầu trải nghiệm trò chơi!

### 5. Biên Dịch Dự Án Cho Production (Build)
Để đóng gói ứng dụng tối ưu hóa nhất chuẩn bị đưa lên các dịch vụ hosting trực tuyến (Vercel, Netlify, GitHub Pages...):
```bash
npm run build
```
Thư mục `/dist` sẽ được tạo ra chứa toàn bộ mã nguồn HTML, JS và CSS đã được minify cực kỳ gọn nhẹ.

---

## 🎮 Hướng Dẫn Chơi

1. **Thiết Lập Ván Đấu**: Tại màn hình Setup, bạn chọn màu quân mình muốn cầm (Đỏ đi trước, Đen đi sau) và điều chỉnh cấp độ thông minh của AI. Bạn cũng có thể nhấn **Tải ván từ file** nếu có tệp tin JSON đã lưu từ trước.
2. **Di chuyển quân cờ**:
   - Nhấp vào một quân cờ thuộc phe của bạn để chọn. Các ô di chuyển hợp lệ sẽ sáng lên các chấm tròn nhỏ.
   - Nhấp vào một trong các chấm tròn đó để di chuyển hoặc ăn quân địch tại ô đó.
3. **Phân tích chiến thuật**: Quan sát ô bên phải bàn cờ để theo dõi AI đang đánh giá thế cờ hiện tại như thế nào. Điểm số dương thể hiện lợi thế cho Đỏ, điểm số âm thể hiện lợi thế cho Đen.
4. **Hoàn tác & Lưu trữ**:
   - Nút **Hoàn tác lượt** giúp bạn quay lại lượt trước nếu lỡ đi sai.
   - Nút **Lưu ván đang chơi/đã xong** cho phép bạn tải về máy một tệp tin `.json` chứa chính xác trạng thái trận đấu hiện tại.

---

## 💡 Đề Xuất Phát Triển Tương Lai

- 🔊 Tích hợp hiệu ứng âm thanh sống động khi đi quân, ăn quân hoặc khi chiếu tướng.
- 🌐 Hỗ trợ chế độ chơi online 2 người qua giao thức WebSocket (Socket.io).
- 🧠 Tối ưu hóa tính toán của AI bằng cách chuyển phần thuật toán Minimax sang **Web Workers** để tránh gây nghẽn luồng giao diện (UI main thread) khi chạy ở độ sâu tính toán cao (Depth >= 5).
