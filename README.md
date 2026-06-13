# FASCIA 法夏・筋膜結構美學 預約系統

專業筋膜調理工作室的完整線上預約系統前端原型。

## 快速開始

```bash
# 安裝依賴套件
npm install

# 啟動開發伺服器
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 即可查看。

## 專案結構

```
fascia-booking/
├── app/
│   ├── page.tsx                  # 首頁（品牌頁）
│   ├── layout.tsx                # 根佈局
│   ├── globals.css               # 全域樣式
│   ├── booking/
│   │   ├── layout.tsx            # 預約流程佈局（共享 BookingContext）
│   │   ├── login/page.tsx        # Step 1: LINE 登入
│   │   ├── register/page.tsx     # Step 2: 新用戶基本資料
│   │   ├── consent/page.tsx      # Step 3: 療程同意書
│   │   ├── store/page.tsx        # Step 4: 選擇門市
│   │   ├── teacher/page.tsx      # Step 5: 選擇技師
│   │   ├── service/page.tsx      # Step 6: 選擇服務
│   │   ├── datetime/page.tsx     # Step 7: 選擇日期時間
│   │   ├── notes/page.tsx        # Step 8: 備註
│   │   ├── confirm/page.tsx      # Step 9: 確認
│   │   └── success/page.tsx      # 預約成功頁
│   └── dashboard/
│       └── page.tsx              # 會員中心
├── components/
│   ├── BookingHeader.tsx         # 頁面頂部（含進度條）
│   └── ui/
│       ├── Button.tsx            # 按鈕元件
│       └── Card.tsx              # 卡片元件
└── lib/
    ├── mockData.ts               # 所有 Mock 資料（門市、技師、服務）
    └── bookingContext.tsx        # 全域預約狀態管理
```

## 預約流程

1. **LINE 登入** → 模擬現有用戶或新用戶
2. **基本資料** → 僅新用戶需填寫（姓名、電話、生日）
3. **同意書** → 首次使用必須閱讀並同意
4. **選擇門市** → 小巨蛋店 / 大安店（含地址、Google Maps 連結）
5. **選擇技師** → 技師卡片 + 詳細介紹彈窗
6. **選擇服務** → 顯示對應技師的服務與價格（會員/非會員/首次優惠）
7. **選擇日期時間** → 自製行事曆 + 10分鐘間隔時段
8. **備註** → 快速標籤 + 自由輸入
9. **確認頁** → 完整預約摘要
10. **成功頁** → 美觀確認單 + LINE 通知模擬

## Demo 帳號說明

### 現有會員 (mockUser)
- 姓名：王小明
- 儲值餘額：$32,000（金卡會員）
- 同意書：已簽署
- 享有會員優惠價

### 模擬新用戶
- 點擊「模擬新用戶登入」
- 需填寫基本資料並簽署同意書
- 首次預約可享一次性會員優惠價

## 部署到 Vercel

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel
```

或直接在 [vercel.com](https://vercel.com) 匯入此 GitHub repo。

## 技術規格

- **框架**：Next.js 16 + App Router
- **語言**：TypeScript
- **樣式**：Tailwind CSS v4
- **狀態管理**：React Context (BookingContext)
- **字型**：Noto Serif TC（Google Fonts）
- **設計風格**：深色金 × 白底，premium 養生美學
- **裝置優先**：Mobile-first，大尺寸點擊區域

## 待後端整合的功能

- [ ] 真實 LINE Login OAuth 串接
- [ ] 時段即時可用性 API
- [ ] 預約資料寫入資料庫
- [ ] LINE Messaging API 確認通知
- [ ] 儲值扣款系統
- [ ] 後台管理介面
