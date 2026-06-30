"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import BookingHeader from "@/components/BookingHeader";

type Category = "fascia" | "sissel" | "golden";

interface Product {
  id: string;
  name: string;
  price: number;
  tag?: string;
  desc: string;
  highlight: string;
  url: string;
}

const FASCIA_PRODUCTS: Product[] = [
  {
    id: "F004",
    name: "消波塊",
    price: 1000,
    tag: "熱銷",
    desc: "多角度立體造型，可針對脊椎旁、肩胛、臀部等難以觸及的位置進行深層放鬆，躺壓效果佳。",
    highlight: "躺著就能放鬆難以觸及的深層部位",
    url: "https://fasciaworker.com/shop/",
  },
  {
    id: "F001",
    name: "Fascia四寶（含工具包）",
    price: 3800,
    desc: "法夏最暢銷的入門組合，包含筋膜球、筋膜錐、結締筆與工具包，涵蓋居家日常保養所需的核心工具。",
    highlight: "最多客人選購的居家入門組",
    url: "https://fasciaworker.com/shop/",
  },
  {
    id: "F002",
    name: "結締筆",
    price: 950,
    desc: "針對局部筋膜沾黏進行定點深壓，筆型設計方便施力，適合臉部、頸部、手部等精細部位。",
    highlight: "技師日常工具首選，精準定點放鬆",
    url: "https://fasciaworker.com/shop/",
  },
  {
    id: "F003",
    name: "鳥嘴筋膜刀",
    price: 1650,
    desc: "仿照傳統刮痧刀改良，特殊鳥嘴弧度貼合人體輪廓，適合肩頸、小腿、背部的大面積筋膜放鬆。",
    highlight: "深度放鬆，效果媲美調理現場",
    url: "https://fasciaworker.com/shop/",
  },
  {
    id: "F005",
    name: "筋膜球（大）",
    price: 720,
    desc: "直徑較大，適合背部、大腿、臀部等大肌群的大面積滾壓放鬆。",
    highlight: "大面積肌群放鬆，滾壓更省力",
    url: "https://fasciaworker.com/shop/",
  },
  {
    id: "F006",
    name: "筋膜球（中）",
    price: 650,
    desc: "最萬用的尺寸，適合肩頸、小腿、足底等各部位，使用頻率最高。",
    highlight: "最多人選擇的萬用球，居家必備",
    url: "https://fasciaworker.com/shop/",
  },
  {
    id: "F007",
    name: "筋膜球（小）",
    price: 580,
    desc: "小巧精準，適合足底穴位、手部、臉部等精細部位的定點放鬆。",
    highlight: "精細部位專用，攜帶方便",
    url: "https://fasciaworker.com/shop/",
  },
  {
    id: "F008",
    name: "筋膜圓錐",
    price: 400,
    desc: "圓錐造型，針對筋膜激痛點進行定點施壓，特別適合小腿、足底及手掌。",
    highlight: "精準施壓，解放激痛點",
    url: "https://fasciaworker.com/shop/",
  },
  {
    id: "F009",
    name: "筋膜錐",
    price: 450,
    desc: "錐狀設計，深度刺激筋膜層，比一般按摩球更能集中壓力於特定部位。",
    highlight: "比筋膜球更集中的深層刺激",
    url: "https://fasciaworker.com/shop/",
  },
  {
    id: "F010",
    name: "筋膜頸椎",
    price: 350,
    desc: "專為頸椎設計的放鬆工具，躺壓時可支撐頸椎弧度，同時放鬆後腦及頸部筋膜。",
    highlight: "低頭族、辦公族的頸部救星",
    url: "https://fasciaworker.com/shop/",
  },
  {
    id: "F011",
    name: "軟木足底滾筒",
    price: 880,
    desc: "天然軟木材質，足底滾壓時摩擦力適中，有效放鬆足底筋膜與足弓張力。",
    highlight: "久站族、足底筋膜炎患者必備",
    url: "https://fasciaworker.com/shop/",
  },
  {
    id: "F012",
    name: "軟式罐杯",
    price: 200,
    desc: "柔軟矽膠材質，居家自行拔罐放鬆使用，輕巧方便，適合背部及腿部大面積使用。",
    highlight: "最划算的居家放鬆工具",
    url: "https://fasciaworker.com/shop/",
  },
  {
    id: "F013",
    name: "工具包（單買）",
    price: 1500,
    desc: "法夏專業工具收納包，附贈基礎筋膜工具，方便攜帶外出或旅行時使用。",
    highlight: "出差旅行也能維持調理習慣",
    url: "https://fasciaworker.com/shop/",
  },
];

const SISSEL_PRODUCTS: Product[] = [
  {
    id: "S001",
    name: "SISSEL® Sitfit 坐姿矯正墊（經典款 36cm）",
    price: 1980,
    desc: "充氣式平衡坐墊，坐在上面自動啟動核心肌群與骨盆穩定，改善久坐姿勢與腰痠問題。直徑 36cm，適合一般辦公椅。",
    highlight: "辦公族入門首選，改善腰痠駝背",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
  {
    id: "S002",
    name: "SISSEL® Sitfit-plus 坐姿矯正墊（進階款 37cm）",
    price: 2380,
    tag: "熱銷",
    desc: "比經典款更穩定，進階的雙面設計，一面平滑、一面顆粒，可依個人需求調整刺激強度。",
    highlight: "雙面設計，自由調整刺激強度",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
  {
    id: "S003",
    name: "SISSEL® Sitpro Offichef 坐姿矯正椅（辦公款）",
    price: 7980,
    tag: "專業級",
    desc: "符合人體工學的辦公室專用坐姿矯正椅，無椅背設計，促進主動坐姿，適合長時間辦公使用。",
    highlight: "長時間辦公的最佳投資",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
  {
    id: "S004",
    name: "SISSEL® Sitpro Zener 坐姿矯正椅（經典款）",
    price: 5980,
    desc: "人體工學坐姿矯正椅，讓脊椎保持自然S型弧度，減少腰部壓力，提升工作效率。",
    highlight: "維持脊椎S型弧度，預防腰痛",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
  {
    id: "S005",
    name: "SISSEL® Sitpro Butterfly 坐姿矯正椅（學生款）",
    price: 9800,
    desc: "學生專用坐姿矯正椅，輕量化設計方便移動，有效改善青少年因長時間讀書造成的駝背問題。",
    highlight: "改善學生駝背，從小養成好姿勢",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
  {
    id: "S006",
    name: "SISSEL® Soft-plus 舒柔進階款矯形枕",
    price: 4980,
    desc: "人體工學頸枕，提供頸椎精確支撐，改善睡眠中的頸椎壓力，適合習慣側睡或仰睡的人。",
    highlight: "睡一覺醒來，頸椎不再緊繃",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
  {
    id: "S007",
    name: "SISSEL® Deluxe 舒柔豪華款枕頭",
    price: 5480,
    desc: "頂級材質的人體工學枕頭，有效支撐頸椎，減少睡眠中的翻身次數，深度改善睡眠品質。",
    highlight: "頂級工藝，給頸椎最好的夜晚呵護",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
  {
    id: "S008",
    name: "SISSEL® Myofascia 筋膜球（大單球 12cm）",
    price: 880,
    tag: "暢銷",
    desc: "瑞士SISSEL品牌筋膜球，直徑12cm，高品質橡膠材質，適合背部、臀部大面積筋膜放鬆。",
    highlight: "瑞士品質，耐用度超出預期",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
  {
    id: "S009",
    name: "SISSEL® Myofascia 筋膜球（小單球 8cm）",
    price: 580,
    desc: "直徑8cm的精準筋膜球，適合足底、手部、臉部、頸部等精細部位的定點放鬆。",
    highlight: "小巧精準，隨身攜帶也方便",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
  {
    id: "S010",
    name: "SISSEL® Myofascia 大花生雙球",
    price: 1280,
    desc: "花生形雙球設計，夾住脊椎兩側同步放鬆，特別適合脊椎旁的豎脊肌及胸椎活動度改善。",
    highlight: "脊椎兩側同步放鬆，效率加倍",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
  {
    id: "S011",
    name: "SISSEL® Myofascia 小花生雙球",
    price: 980,
    desc: "攜帶便利的小型花生雙球，出差旅行也能使用，適合頸椎、腰椎定點放鬆。",
    highlight: "旅行必帶，讓身體隨時保持狀態",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
  {
    id: "S012",
    name: "SISSEL® Myofascia 筋絡按摩健身滾輪",
    price: 1680,
    desc: "高密度泡沫滾輪，結合筋膜放鬆與肌肉按摩功能，適合運動前暖身及運動後恢復。",
    highlight: "運動前後必備，加速恢復",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
  {
    id: "S013",
    name: "SISSEL® SPINEFITTER 脊給力健身按摩器",
    price: 4880,
    desc: "多功能脊椎矯正按摩器，可進行脊椎伸展、激痛點按壓、核心訓練等多種用途，瑞士工藝品質。",
    highlight: "一器多用，居家脊椎保健神器",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
  {
    id: "S014",
    name: "SISSEL® Balancefit Pad 專業平衡訓練墊",
    price: 2880,
    desc: "充氣式平衡訓練墊，進行單腳站立、深蹲等訓練時增加不穩定性，強化核心與本體感覺。",
    highlight: "強化核心穩定，預防運動傷害",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
  {
    id: "S015",
    name: "SISSEL® Pilates Roller Pro 普拉提專業滾輪",
    price: 1980,
    desc: "半圓柱設計的普拉提滾輪，適合脊椎延展、核心訓練及平衡練習，瑜珈教室與復健廣泛使用。",
    highlight: "脊椎延展與核心訓練的黃金組合",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
  {
    id: "S016",
    name: "SISSEL® Fitband Essential 加寬超長彈力帶",
    price: 350,
    desc: "加寬加長設計，適合各種阻力訓練、伸展及普拉提練習，不同顏色代表不同阻力等級。",
    highlight: "最經濟實惠的訓練輔具",
    url: "https://fasciaworker.com/product-category/sissel%e7%94%a2%e5%93%81/",
  },
];

const GOLDEN_PRODUCTS: Product[] = [
  {
    id: "G004",
    name: "葉黃素果凍",
    price: 1380,
    tag: "熱銷",
    desc: "護眼必備的葉黃素果凍，果凍劑型吸收率高，適合長時間使用3C產品、用眼過度的現代人。方便攜帶，每日一包輕鬆護眼。",
    highlight: "3C重度使用者的每日護眼必備",
    url: "https://fasciaworker.com/product-category/%e9%bb%83%e9%87%91%e7%94%b2/",
  },
  {
    id: "G001",
    name: "GABA睿智膏",
    price: 1680,
    tag: "人氣第二",
    desc: "專利咖啡莓果 × GABA × 羅布麻 10:2:1 黃金配方，舌下吸收劑型快速見效。三效合一：助眠、清晰思緒、增強專注力。適合高壓上班族、備考學生、銀髮族。",
    highlight: "舌下快速吸收，助眠又提神",
    url: "https://fasciaworker.com/product-category/%e9%bb%83%e9%87%91%e7%94%b2/",
  },
  {
    id: "G002",
    name: "冰晶膠原凍",
    price: 2180,
    desc: "台灣荔枝風味，7大王牌成份倍數濃縮，好吃無腥味的膠原蛋白果凍。防止膠原蛋白流失，維持肌膚光澤彈性，適合長時間吹冷氣、容易乾燥的辦公族。",
    highlight: "好吃不腥，補膠原最簡單的方式",
    url: "https://fasciaworker.com/product-category/%e9%bb%83%e9%87%91%e7%94%b2/",
  },
  {
    id: "G003",
    name: "白藜蘆醇飲",
    price: 2180,
    tag: "抗老首選",
    desc: "高濃度NMN × 98%白藜蘆醇協同配方，一包多酚含量相當於599杯紅酒。含酸櫻桃幫助運動後恢復，適合注重抗老、維持代謝活力的族群。",
    highlight: "一包 = 599杯紅酒的多酚含量",
    url: "https://fasciaworker.com/product-category/%e9%bb%83%e9%87%91%e7%94%b2/",
  },
  {
    id: "G005",
    name: "維生素果凍",
    price: 990,
    desc: "綜合維生素果凍，包含每日所需多種維生素及礦物質，果凍形式吸收效果優於傳統錠劑，口感好且適合各年齡層。",
    highlight: "全家都適合，每日補充最輕鬆",
    url: "https://fasciaworker.com/product-category/%e9%bb%83%e9%87%91%e7%94%b2/",
  },
];

const CATEGORIES = [
  { id: "fascia" as Category, label: "法夏嚴選", emoji: "✦", sub: "自家研發工具" },
  { id: "sissel" as Category, label: "Sissel 國際", emoji: "🇨🇭", sub: "瑞士品牌" },
  { id: "golden" as Category, label: "黃金甲", emoji: "⭑", sub: "保健食品" },
];

const PRODUCTS_MAP: Record<Category, Product[]> = {
  fascia: FASCIA_PRODUCTS,
  sissel: SISSEL_PRODUCTS,
  golden: GOLDEN_PRODUCTS,
};

export default function ProductsPage() {
  const router = useRouter();
  const { state } = useBooking();
  const [activeCategory, setActiveCategory] = useState<Category>("fascia");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [inquiredIds, setInquiredIds] = useState<Set<string>>(new Set());

  // 儲值滿 $15,000 享 9.5 折
  const storedValue = state.user?.storedValue ?? 0;
  const totalSpent = state.user?.totalSpent ?? 0;
  const hasMemberDiscount = storedValue >= 15000 || totalSpent >= 15000;
  const discountedPrice = (p: number) => Math.round(p * 0.95);

  const products = PRODUCTS_MAP[activeCategory];

  const handleInquire = async (product: Product) => {
    setInquiredIds((prev) => new Set(prev).add(product.id));
    // 存入 Supabase product_inquiries
    if (state.user?.id) {
      const { getCustomerByLineId } = await import("@/lib/customerApi");
      const customer = await getCustomerByLineId(state.user.id);
      if (customer) {
        const { supabase } = await import("@/lib/supabase");
        await supabase.from("product_inquiries").insert({
          customer_id: customer.id,
          product_id: product.id,
          product_name: product.name,
        });
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      <BookingHeader
        title="法夏嚴選"
        subtitle="技師推薦 · 居家保養好物"
        onBack={() => router.back()}
        step={0}
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#b8956a] to-[#8b6748] px-6 pt-5 pb-6">
        <p className="text-xs tracking-[0.2em] text-white/60 uppercase font-medium mb-1.5">FASCIA SELECT</p>
        <p className="text-sm font-light leading-relaxed text-white/90">
          每件商品皆經技師試用評估，<br />幫助您在兩次調理之間維持身體狀態。
        </p>
        {hasMemberDiscount && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 border border-white/30 rounded-full px-3 py-1">
            <span className="text-xs text-white font-medium">✓ 您享有儲值會員 9.5 折優惠</span>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="bg-white border-b border-gray-100 px-5 pt-3 pb-0 flex gap-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setExpandedId(null); }}
            className={`flex-1 flex flex-col items-center pb-3 pt-1 border-b-2 transition-colors ${
              activeCategory === cat.id
                ? "border-[#b8956a] text-[#b8956a]"
                : "border-transparent text-gray-400"
            }`}
          >
            <span className="text-base mb-0.5">{cat.emoji}</span>
            <span className="text-xs font-medium leading-tight">{cat.label}</span>
            <span className="text-[10px] text-gray-400 leading-tight">{cat.sub}</span>
          </button>
        ))}
      </div>

      {/* Product list */}
      <div className="flex-1 px-5 py-4 space-y-3">
        {products.map((product) => {
          const isExpanded = expandedId === product.id;
          const isInquired = inquiredIds.has(product.id);
          const memberPrice = discountedPrice(product.price);

          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : product.id)}
                className="w-full text-left px-5 py-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      {product.tag && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f5f0e8] text-[#b8956a] font-medium flex-shrink-0">
                          {product.tag}
                        </span>
                      )}
                      <h3 className="text-sm font-semibold text-[#1a1a1a] leading-snug">{product.name}</h3>
                    </div>
                    <p className="text-xs text-gray-400">{product.highlight}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {hasMemberDiscount ? (
                      <>
                        <p className="text-base font-bold text-[#b8956a]">NT${memberPrice.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400 line-through">NT${product.price.toLocaleString()}</p>
                      </>
                    ) : (
                      <p className="text-base font-bold text-[#1a1a1a]">NT${product.price.toLocaleString()}</p>
                    )}
                    <svg
                      width="16" height="16" viewBox="0 0 16 16" fill="none"
                      stroke="#b8956a" strokeWidth="1.5" className="ml-auto mt-1"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                    >
                      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-50 pt-3 space-y-3">
                  <p className="text-sm text-gray-600 leading-relaxed">{product.desc}</p>
                  {hasMemberDiscount && (
                    <div className="bg-[#f5f0e8] rounded-lg px-3 py-2">
                      <p className="text-xs text-[#8b6748]">✓ 儲值會員優惠價 NT${memberPrice.toLocaleString()}（原價 NT${product.price.toLocaleString()}）</p>
                    </div>
                  )}
                  {isInquired ? (
                    <div className="w-full py-3.5 rounded-xl bg-[#f5f0e8] text-center px-4">
                      <p className="text-sm text-[#8b6748] font-medium">✓ 已記錄您的興趣</p>
                      <p className="text-xs text-[#b8956a] mt-0.5">下次調理時，技師將為您現場介紹</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleInquire(product)}
                          className="flex-1 py-3 bg-[#b8956a] text-white text-sm rounded-xl font-medium hover:bg-[#a07d58] transition-colors"
                        >
                          調理時了解此商品
                        </button>
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-3 border border-gray-200 text-gray-500 text-sm rounded-xl font-medium hover:bg-gray-50 transition-colors whitespace-nowrap"
                        >
                          直接下單
                        </a>
                      </div>
                      <p className="text-[10px] text-gray-400 text-center">「直接下單」將前往官網，可自行結帳</p>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <p className="text-xs text-center text-gray-400 pb-6 pt-2">
          所有商品可於調理結束後向技師購買，或點「詢問購買」由技師透過 LINE 為您服務
        </p>
      </div>
    </div>
  );
}
