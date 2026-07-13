# 🛒 RetroTrade — Nền tảng cho thuê đồ cũ trực tuyến

> **RetroTrade** là một nền tảng thương mại điện tử peer-to-peer cho phép người dùng đăng cho thuê và thuê các vật phẩm đồ cũ, vintage theo mô hình C2C (Customer to Customer). Hệ thống được xây dựng trên nền tảng **Next.js + Express.js**, với đầy đủ tính năng thanh toán, hợp đồng số, chat real-time, quản lý tranh chấp và gamification.

---

## 📑 Mục lục

- [Tính năng chính](#-tính-năng-chính)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Luồng hoạt động](#-luồng-hoạt-động)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cài đặt & Chạy dự án](#-cài-đặt--chạy-dự-án)
- [Biến môi trường](#-biến-môi-trường)
- [API Reference](#-api-reference)
- [Phân quyền người dùng](#-phân-quyền-người-dùng)
- [Cron Jobs tự động](#-cron-jobs-tự-động)
- [Docker Deployment](#-docker-deployment)

---

## ✨ Tính năng chính

| Module | Mô tả |
|--------|-------|
| 🔐 **Xác thực & Định danh** | Đăng ký/đăng nhập Email, Google OAuth, Facebook, OTP SMS/Email, xác minh CCCD bằng AI (OCR + Face API) |
| 🛍️ **Quản lý sản phẩm** | Đăng sản phẩm cho thuê, phê duyệt qua moderator, phân loại danh mục, trending items |
| 📦 **Đặt hàng & Thuê** | Giỏ hàng, đặt lịch thuê, gia hạn hợp đồng, theo dõi trạng thái đơn hàng |
| 💰 **Ví điện tử & Thanh toán** | Nạp tiền (PayOS/VNPay), rút tiền (bank transfer), hoàn tiền tự động khi hủy đơn |
| 📄 **Hợp đồng số** | Tạo hợp đồng PDF tự động bằng Puppeteer, ký hợp đồng điện tử (chữ ký số) |
| 💬 **Chat real-time** | Nhắn tin 1-1 giữa người thuê và chủ sở hữu qua Socket.io, hỗ trợ gửi ảnh |
| 🤖 **AI Assistant** | Tích hợp Gemini AI hỗ trợ tư vấn người dùng |
| 🛡️ **Tranh chấp & Khiếu nại** | Hệ thống xử lý tranh chấp có moderator giám sát, auto-assign |
| ⭐ **Đánh giá & Điểm uy tín** | Đánh giá 2 chiều (người thuê ↔ chủ sở hữu), điểm reputation |
| 🎮 **Gamification** | Life Tree game (chăm cây bằng điểm thưởng), hệ thống loyalty points |
| 📊 **Dashboard** | Thống kê cho Admin, Moderator và Owner riêng biệt |
| 🔔 **Thông báo** | SSE (Server-Sent Events) + Socket.io real-time notifications |
| 📰 **Blog & Cộng đồng** | Đăng bài viết, bình luận cộng đồng, quản lý nội dung |
| 🏷️ **Mã giảm giá** | Coupon/Discount code (public & private), áp dụng cho đơn thuê & gia hạn |

---

## 🏗️ Kiến trúc hệ thống

```
CLIENT SIDE: Next.js 15 (Port 3000)
  Pages | Components | Redux Store | Axios Services
       |                    |
  HTTP/REST API         Socket.io
       |                    |
SERVER SIDE: Express.js v5 (Port 9999)
  Routes /api/v1 | Controllers | Middleware (JWT) | CronJobs
  Socket.io Handler | Mongoose Models | Utils
       |
  MongoDB Atlas (Database)
       |
  External Services:
  - Cloudinary (Media)     - Nodemailer/Resend (Email)
  - Twilio (SMS OTP)       - PayOS/VNPay (Payment)
  - Gemini AI (Chatbot)    - Firebase (Auth)
  - VietQR (Banks)
```

---

## 🔄 Luồng hoạt động

### 1. Luồng Đăng ký & Xác thực người dùng

```
[Người dùng] -> Đăng ký (Email/Phone/Google/Facebook)
                     |
                     v
             Xác thực OTP (Email/SMS)
                     |
                     v
             Tài khoản được tạo (role: renter)
                     |
                     v
    [Muốn trở thành chủ sở hữu?]
      -> Gửi OwnerRequest
      -> Xác minh CCCD (OCR + FaceAPI)
      -> Moderator duyệt
      -> Nâng role: owner
```

### 2. Luồng Đăng sản phẩm cho thuê

```
[Owner] -> Tạo sản phẩm (Title, Ảnh, Giá, Mô tả, Danh mục)
               |
               v
        Upload ảnh lên Cloudinary
               |
               v
        Sản phẩm: PENDING (StatusId: 1)
               |
               v
        [Moderator] xem xét & duyệt
               |
          -----+-----
          |         |
          v         v
       Duyệt     Từ chối
    (StatusId:2) (StatusId:3)
          |
          v
   Sản phẩm xuất hiện trên sàn
```

### 3. Luồng Đặt thuê & Thanh toán

```
[Renter]
  |
  +-> Tìm kiếm sản phẩm -> Xem chi tiết -> Thêm vào giỏ hàng
  |
  +-> Chọn ngày bắt đầu/kết thúc + địa chỉ giao hàng
  |
  +-> Áp dụng mã giảm giá (nếu có)
  |
  +-> Xác nhận đặt hàng -> Thanh toán từ Ví điện tử
           |
           v
    [Order - status: pending]
           |
           v
    [Owner nhận thông báo]
           |
       ----+----
       |       |
       v       v
   Xác nhận  Từ chối -> Hoàn tiền tự động
  (confirmed)
       |
       v
   Giao hàng (delivery)
       |
       v
   Nhận hàng (received)
       |
       v
   Đang thuê (progress)
       |
       v
   Trả hàng (returned)
       |
       v
   Hoàn thành (completed) -> Owner nhận tiền

  [Gia hạn thuê] -> Gửi ExtensionRequest -> Owner duyệt -> Thanh toán thêm
```

Các trạng thái đơn hàng:

| Status | Mô tả |
|--------|-------|
| `pending` | Chờ chủ sở hữu xác nhận |
| `confirmed` | Đã xác nhận, chuẩn bị giao |
| `delivery` | Đang giao hàng |
| `received` | Người thuê đã nhận hàng |
| `progress` | Đang trong thời gian thuê |
| `returned` | Đã trả hàng, chờ xác nhận |
| `completed` | Hoàn thành, thanh toán cho owner |
| `cancelled` | Đã hủy |
| `disputed` | Đang có tranh chấp |

### 4. Luồng Ví điện tử

```
[Nạp tiền]
  User -> Chọn số tiền -> Chuyển hướng PayOS/VNPay
  -> Thanh toán -> Webhook callback -> Cộng vào Wallet -> Ghi WalletTransaction

[Thanh toán đơn hàng]
  Kiểm tra số dư Wallet -> Trừ tiền -> Tạo Order

[Hoàn tiền]
  Hủy đơn / Tranh chấp -> CronJob tự động -> Hoàn về Wallet

[Rút tiền]
  User -> Gửi yêu cầu rút (bank info) -> Admin duyệt -> Chuyển khoản -> Ghi log
```

### 5. Luồng Tranh chấp (Dispute)

```
[Renter/Owner] -> Tạo Dispute (báo cáo vấn đề)
                       |
                       v
             Dispute status: Pending
                       |
                       v (Moderator tự nhận hoặc auto-assign sau 48h)
             [Moderator] Xem xét bằng chứng
                       |
                  -----+-----
                  |         |
                  v         v
           Xử lý xong   Chuyển lên Admin
          (Resolved)
                  |
                  v
           Hành động: Hoàn tiền / Phạt / Bồi thường
```

### 6. Luồng Chat & Thông báo real-time

```
Client A -> Socket.io (connect) -> Server (socket.handler.js)
                                         |
                -------------------------+
                |                        |
                v                        v
        Emit "sendMessage"      Join room (chatRoomId)
                |
                v
     Lưu Message vào MongoDB
                |
                v
     Emit "receiveMessage" -> Client B (real-time)
                |
                v
     Tạo Notification -> SSE push -> Client B nhận thông báo
```

### 7. Luồng Hợp đồng số

```
[Đơn hàng Confirmed]
       |
       v
Tạo ContractTemplate
       |
       v
Render HTML -> Puppeteer -> PDF
       |
       v
Upload PDF lên Cloudinary
       |
       v
Owner ký (chữ ký điện tử canvas)
       |
       v
Renter ký (chữ ký điện tử canvas)
       |
       v
Hợp đồng có hiệu lực (isContractSigned: true)
```

### 8. Luồng Gia hạn thuê (Extension)

```
[Điều kiện]: Đơn hàng đang ở trạng thái "progress" (đang trong thời gian thuê)

[Renter] -> Gửi yêu cầu gia hạn (ExtensionRequest)
                  |
                  | Thông tin gửi đi:
                  |   - newEndAt    : Ngày kết thúc mới
                  |   - discountCode: Mã giảm giá (tuỳ chọn)
                  v
         [ExtensionRequest tạo ra]
           status: "pending"
           Tính toán:
             - extraDuration  = newEndAt - oldEndAt
             - extraAmount    = extraDuration * basePrice
             - discountApplied (nếu có mã hợp lệ)
             - finalExtraAmount = extraAmount - discountApplied
                  |
                  v
         [Owner nhận thông báo real-time (Socket.io + SSE)]
                  |
             -----+-----
             |         |
             v         v
          Chấp nhận  Từ chối
                  |         |
                  v         v
    [Thanh toán tự động]  [ExtensionRequest: rejected]
      Kiểm tra số dư Wallet   Thông báo đến Renter
      -> Trừ finalExtraAmount
      -> Ghi WalletTransaction
                  |
                  v
    [Cập nhật Order]
      - endAt     = newEndAt
      - totalAmount += extraAmount
      - finalAmount += finalExtraAmount
      - discount.extensions[] thêm bản ghi mới
                  |
                  v
    [ExtensionRequest: approved]
      Thông báo đến Renter (Socket.io + SSE)
                  |
                  v
    [Renter tiếp tục thuê đến ngày mới]
```

Bảng trạng thái `ExtensionRequest`:

| Status | Mô tả |
|--------|-------|
| `pending` | Chờ owner xem xét |
| `approved` | Owner đã chấp nhận, đã thanh toán |
| `rejected` | Owner từ chối gia hạn |
| `cancelled` | Renter tự hủy yêu cầu |

> **Lưu ý**: Mỗi lần gia hạn được lưu vào `order.discount.extensions[]` bao gồm thông tin mã giảm giá, số tiền giảm, thời điểm áp dụng để phục vụ đối soát và hợp đồng.

---

## 📁 Cấu trúc dự án

```
RetroTrade/
├── docker-compose.yml          # Production Docker config
├── docker-compose.dev.yml      # Development Docker config
├── DOCKER.md                   # Hướng dẫn Docker
├── README.md                   # Tài liệu này
│
├── backend/                    # Express.js API Server
│   ├── server.js               # Entry point
│   ├── package.json
│   ├── Dockerfile
│   └── src/
│       ├── config/db.js        # Kết nối MongoDB Atlas
│       ├── models/             # Mongoose Schemas
│       │   ├── User.model.js
│       │   ├── Wallet.model.js
│       │   ├── Notification.model.js
│       │   ├── Product/
│       │   │   ├── Item.model.js
│       │   │   ├── Categories.model.js
│       │   │   └── Favorites.model.js
│       │   ├── Order/
│       │   │   ├── Order.model.js
│       │   │   ├── CartItem.model.js
│       │   │   ├── ExtensionRequest.model.js
│       │   │   └── Reports.model.js
│       │   ├── Chat/
│       │   ├── Blog/
│       │   └── Discount/
│       ├── controller/         # Business Logic
│       │   ├── auth/           # Đăng ký, đăng nhập, OTP, CCCD
│       │   ├── products/       # CRUD sản phẩm, duyệt, trending
│       │   ├── order/          # Đơn hàng, tranh chấp, gia hạn
│       │   ├── wallet/         # Ví, thanh toán, hoàn tiền
│       │   ├── admin/
│       │   ├── moderator/
│       │   ├── games/          # Life Tree
│       │   └── loyalty/
│       ├── routes/index.js     # Route aggregator /api/v1
│       ├── middleware/         # JWT auth, pagination, upload
│       ├── socket/             # Socket.io handler
│       ├── cronJobs/           # Scheduled tasks
│       └── utils/              # Helpers, jobs
│
└── frontend/                   # Next.js 15 Application
    ├── next.config.ts
    ├── package.json
    ├── Dockerfile
    └── src/
        ├── pages/              # Next.js Pages Router
        │   ├── index.tsx       # Trang chủ
        │   ├── auth/           # Đăng nhập, đăng ký
        │   ├── products/       # Sản phẩm
        │   ├── store/          # Shop của owner
        │   ├── wallet/         # Ví điện tử
        │   ├── owner/          # Dashboard owner
        │   ├── admin/          # Dashboard admin
        │   ├── moderator/      # Dashboard moderator
        │   ├── blog/
        │   ├── games/
        │   └── dispute/
        ├── components/         # React Components
        ├── services/           # API calls (Axios)
        ├── store/              # Redux Toolkit
        └── utils/              # Helpers
```

---

## 🛠️ Công nghệ sử dụng

### Backend

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|---------|
| **Node.js** | 18+ | Runtime |
| **Express.js** | v5 | Web framework |
| **MongoDB Atlas** | Cloud | Database |
| **Mongoose** | v8 | ODM cho MongoDB |
| **Socket.io** | v4 | Real-time communication |
| **JWT** | v9 | Authentication |
| **Bcrypt** | v6 | Mã hóa mật khẩu |
| **Cloudinary** | v1 | Lưu trữ media |
| **Puppeteer** | v24 | Tạo PDF hợp đồng |
| **Tesseract.js** | v5 | OCR đọc CCCD |
| **@vladmandic/face-api** | v1 | Nhận dạng khuôn mặt |
| **Nodemailer / Resend** | — | Gửi email |
| **Twilio** | v5 | Gửi OTP SMS |
| **PayOS** | v2 | Cổng thanh toán |
| **VNPay** | v2 | Cổng thanh toán |
| **node-cron** | v4 | Scheduler |
| **Gemini AI** | v0.24 | AI chatbot |
| **Firebase Admin** | v13 | Firebase services |
| **Passport-Facebook** | v3 | Facebook OAuth |
| **Multer** | v2 | File upload |

### Frontend

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|---------|
| **Next.js** | 15.5 | React framework |
| **React** | 19 | UI library |
| **TypeScript** | v5 | Type safety |
| **Redux Toolkit** | v2 | State management |
| **Axios** | v1 | HTTP client |
| **Socket.io-client** | v4 | Real-time client |
| **Framer Motion** | v12 | Animations |
| **Tailwind CSS** | v4 | Styling |
| **Radix UI** | — | UI primitives |
| **React Hook Form** | v7 | Form management |
| **React Three Fiber** | v9 | 3D graphics |
| **Recharts** | v3 | Charts |
| **jsPDF** | v3 | PDF client-side |
| **React Signature Canvas** | — | Chữ ký điện tử |
| **Firebase** | v10 | Firebase client |
| **Sonner** | v2 | Toast notifications |

---

## 🚀 Cài đặt & Chạy dự án

### Yêu cầu hệ thống

- **Node.js** >= 18
- **npm** hoặc **pnpm**
- **MongoDB Atlas** account
- **Docker** (tuỳ chọn)

### 1. Clone dự án

```bash
git clone https://github.com/<your-org>/RetroTrade.git
cd RetroTrade
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
cp .env.example .env
npm start 
```

### 3. Cài đặt Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### 4. Chạy bằng Docker

```bash
# Development (hot-reload)
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up -d
```

---

## 📡 API Reference

Tất cả API được prefix với `/api/v1`

| Route | Method | Mô tả |
|-------|--------|-------|
| **Authentication** | | |
| `/auth/register` | POST | Đăng ký tài khoản |
| `/auth/login` | POST | Đăng nhập |
| `/auth/google` | POST | Google OAuth |
| `/auth/facebook` | POST | Facebook OAuth |
| `/auth/send-otp` | POST | Gửi OTP |
| `/auth/verify-otp` | POST | Xác nhận OTP |
| **Sản phẩm** | | |
| `/products` | GET | Danh sách sản phẩm (public) |
| `/products/:id` | GET | Chi tiết sản phẩm |
| `/products` | POST | Tạo sản phẩm (owner) |
| `/products/:id` | PUT | Cập nhật sản phẩm (owner) |
| `/categories` | GET | Danh sách danh mục |
| **Đơn hàng** | | |
| `/cart` | GET/POST/DELETE | Quản lý giỏ hàng |
| `/order` | POST | Tạo đơn thuê |
| `/order/:id/confirm` | PUT | Xác nhận đơn (owner) |
| `/order/:id/cancel` | PUT | Hủy đơn |
| `/order/:id/extend` | POST | Gia hạn thuê |
| **Ví điện tử** | | |
| `/wallet` | GET | Xem số dư ví |
| `/wallet/deposit` | POST | Nạp tiền |
| `/wallet/withdraw` | POST | Rút tiền |
| `/wallet/transactions` | GET | Lịch sử giao dịch |
| **Tranh chấp** | | |
| `/dispute` | POST | Tạo tranh chấp |
| `/dispute/:id` | GET | Chi tiết tranh chấp |
| `/dispute/:id/resolve` | PUT | Giải quyết (moderator) |
| **Hợp đồng** | | |
| `/contract/:orderId` | GET | Xem hợp đồng |
| `/signature` | POST | Ký hợp đồng điện tử |
| **Chat & Thông báo** | | |
| `/messages/:roomId` | GET | Lịch sử tin nhắn |
| `/ai-chat` | POST | Chat với Gemini AI |
| `/notifications` | GET | Danh sách thông báo |
| `/notifications/sse` | GET | SSE stream real-time |
| **Admin** | | |
| `/admin/dashboard` | GET | Thống kê hệ thống |
| `/admin/complaints` | GET | Quản lý khiếu nại |
| `/system-config` | GET/PUT | Cấu hình hệ thống |
| `/events` | GET/POST | Sự kiện hệ thống |
| **Moderator** | | |
| `/moderator/dashboard` | GET | Thống kê moderator |
| `/moderator/moderation` | GET | Hàng chờ duyệt |
| `/verification-request-moderator` | GET | Yêu cầu xác minh |
| **Owner & Loyalty** | | |
| `/owner/dashboard` | GET | Thống kê owner |
| `/owner-requests-user` | POST | Yêu cầu trở thành owner |
| `/loyalty` | GET | Điểm loyalty |
| `/tree` | GET/POST | Life Tree game |

---

## 👥 Phân quyền người dùng

| Role | Quyền hạn |
|------|-----------|
| **renter** (Người thuê) | Thuê sản phẩm, quản lý giỏ hàng/đơn hàng, nạp/rút tiền ví, chat với owner, đánh giá, tham gia Life Tree game, yêu cầu trở thành owner |
| **owner** (Chủ sở hữu) | Tất cả quyền của renter + Đăng sản phẩm cho thuê, quản lý đơn hàng shop, xem dashboard doanh thu, tạo mã giảm giá, cấu hình hợp đồng |
| **moderator** (Kiểm duyệt) | Duyệt/từ chối sản phẩm, xử lý tranh chấp, xét duyệt yêu cầu owner, kiểm duyệt nội dung cộng đồng, xem moderator dashboard |
| **admin** (Quản trị viên) | Toàn quyền hệ thống: quản lý người dùng, cấu hình phí dịch vụ, duyệt rút tiền, xem báo cáo tổng hợp, quản lý sự kiện & thông báo |

---

## ⏰ Cron Jobs tự động

| Cron Schedule | Tác vụ | Mô tả |
|--------------|--------|-------|
| `0 0 * * *` | `updateTrendingItems` | Cập nhật sản phẩm trending mỗi 0h |
| `0 * * * *` | `autoUpdateServiceFeeStatus` | Cập nhật phí dịch vụ mỗi giờ |
| `0 * * * *` | `checkPendingDisputes` | Nhắc moderator xử lý tranh chấp tồn đọng (>24h) |
| `0 */6 * * *` | `autoAssignOldDisputes` | Tự động gán tranh chấp cũ (>48h) cho moderator |
| `0 * * * *` | `checkPendingVerifications` | Nhắc moderator xử lý xác minh tồn đọng |
| `0 */6 * * *` | `autoAssignOldVerifications` | Tự động gán xác minh cũ cho moderator |
| `*/10 * * * *` | `unbanExpiredCommentBans` | Gỡ ban bình luận đã hết hạn |
| `setInterval 12h` | `fetchBanks` | Cập nhật danh sách ngân hàng từ VietQR |
| On startup | `refundJob` | Tự động hoàn tiền các đơn hàng đã hủy |
| On startup | `orderReminder.job` | Nhắc nhở đơn hàng sắp đến hạn |

---

## 🐳 Docker Deployment

> Xem hướng dẫn đầy đủ tại **[DOCKER.md](./DOCKER.md)**

```bash
# Production
docker-compose up -d

# Development (hot-reload)
docker-compose -f docker-compose.dev.yml up
```

| Service | URL |
|---------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| Backend (Express) | http://localhost:9999 |
| API Health Check | http://localhost:9999/api/v1/test-cors |

---

## 📊 Mô hình dữ liệu chính

```
User
 ├── Wallet (1:1) -> WalletTransaction (1:N)
 ├── Item (1:N) [as owner]
 │     ├── ItemImage (1:N)
 │     └── Favorites (N:M)
 └── Order (1:N) [as renter or owner]
       ├── CartItem
       ├── ExtensionRequest (1:N)
       ├── Contracts (1:1) -> ContractSignature (1:N)
       ├── Rating / OwnerRating / RenterRating
       ├── Reports/Dispute (1:1)
       └── Discount (N:M)

ChatRoom -> Message (1:N)
BlogPost -> BlogComment (1:N)
User -> LoyaltyPointTransaction (1:N) + LifeTree (1:1)
```

---

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/ten-tinh-nang`
3. Commit: `git commit -m "feat: thêm tính năng X"`
4. Push: `git push origin feature/ten-tinh-nang`
5. Tạo Pull Request

---

## 📝 License

MIT License — © 2025 RetroTrade Team
