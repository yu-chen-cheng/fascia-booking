export type StaffLevel = "技師職人" | "技術長" | "準技師" | "實習技師";

export interface Store {
  id: string;
  name: string;
  address: string;
  mapEmbedUrl: string;
  phone: string;
  hours: string;
  comingSoon?: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  level: StaffLevel;
  gender: "male" | "female";
  storeIds: string[];
  photoPlaceholder: string;
  tagline: string;
  bio: string;
  specialties: string[];
  certifications: string[];
  yearsExp: number;
  allowedServiceIds: string[]; // service IDs this teacher can perform
  staffOnly?: boolean; // hidden from regular client booking flow
}

export interface Service {
  id: string;
  name: string;
  duration: number; // minutes
  priceRegular: Record<string, number>; // keyed by StaffLevel
  priceMember: Record<string, number>;
  description: string;
  category: "fascia" | "training" | "addon";
  isAddon?: boolean;
  onlineBookable: boolean; // whether shown in online booking
}

export interface TimeSlot {
  time: string; // "HH:mm"
  available: boolean;
}

// ─── Stores ────────────────────────────────────────────────────────────────
export const stores: Store[] = [
  {
    id: "xiaoJudan",
    name: "小巨蛋店",
    address: "台北市松山區南京東路四段133巷4弄15號1樓",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.2!2d121.5538!3d25.0521!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z5piO5YyX5biC5p6X5bGx5Y2A5Y2X5Lqs5p2x6KGX5ZCI5q615Lu95ZCI5L2N5q615Lu9MTMz5Y2X4bm05byg77yR5Lu95qC55Y-w!5e0!3m2!1szh-TW!2stw!4v1234567890",
    phone: "02-XXXX-XXXX",
    hours: "每週一至週日 10:00–22:00",
  },
  {
    id: "daan",
    name: "大安店",
    address: "台北市大安區信義路四段30巷7弄1號1樓",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3615.0!2d121.5433!3d25.0330!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z5piO5YyX5biC5aSn5a6J5Y2A5L-h5YqJ6Lev5ZubDTMw5Y2X77yH5byg77yR5Lu95Y-w!5e0!3m2!1szh-TW!2stw!4v1234567891",
    phone: "02-XXXX-XXXX",
    hours: "每週一至週日 10:00–22:00",
  },
  {
    id: "banqiao",
    name: "板橋店",
    address: "新北市板橋區（即將開幕）",
    mapEmbedUrl: "",
    phone: "",
    hours: "",
    comingSoon: true,
  },
];

// ─── Teachers ──────────────────────────────────────────────────────────────
export const teachers: Teacher[] = [
  // ── 小巨蛋店 ──────────────────────────────
  {
    id: "youtong",
    name: "宥彤老師",
    level: "技術長",
    gender: "female",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "國考合格物理治療師，從根源改善痠痛、預防慢性傷害",
    bio: "我是國考合格的物理治療師，曾任台北市立聯合醫院陽明院區的實習治療師，在物理治療領域已深耕超過九年。\n\n我的理念是：結合專業的徒手治療與動作訓練，從源頭改善痠痛、提升動作表現，並預防慢性傷害，讓身體回到自然又有效率的狀態！",
    specialties: ["物理治療", "動態神經穩定", "足部核心", "徒手治療"],
    certifications: [
      "DNS 動態神經穩定術 國際認證（Basic A/B）",
      "Petr 布拉格內臟肌骨療法 國際認證",
      "LTA 系列：足部核心、下肢系統",
      "Strain Counterstrain 拮抗鬆弛術 國際認證（上肢/下肢/顱骨高階）",
      "BOMT 系列（頸椎、上肢）",
      "德國 SISSEL® SPINEFITTER",
      "孕期產後徒手治療與運動實務",
      "足部輔具 Level 1/2",
    ],
    yearsExp: 9,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "training-50", "frequency-40", "addon-20"],
  },
  {
    id: "jimbo",
    name: "Jimbo老師",
    level: "技師職人",
    gender: "female",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "劇場與服務業的細膩感知，轉化為對身體最專注的陪伴",
    bio: "從事服務業與劇場工作10年左右，長期透過排練與演出培養出對身體細膩的感知，與專注當下的力量，透過服務業長期與人接觸，使我能細膩感受他人的狀態變化，並依其當下需求調整服務方式。\n\n現今從事身體調理工作，結合運動經驗與身體覺察，透過雙手評估與調整身體狀態，協助身體逐步放鬆、恢復平衡與穩定。\n\n期待以專業與細心的服務，陪伴你更靠近自己的身體。",
    specialties: ["解剖列車", "筋膜手法", "身體覺察", "整體評估"],
    certifications: [
      "解剖列車（Anatomy Trains）徒手應用",
      "義大利筋膜手法（FM）徒手應用",
      "全身軟組織肌肉放鬆 徒手應用",
      "系統性身體功能評估（SFMA）研習",
    ],
    yearsExp: 4,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-20"],
  },
  {
    id: "hanhan",
    name: "韓韓老師",
    level: "技師職人",
    gender: "female",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "每一次調理都是與身體的對話，傾聽、陪伴、找回平衡",
    bio: "一路走來，我在不同的研習與實務經驗中不斷累積，持續流動、持續改變。\n\n在服務的過程中，我發現每一個身體都有它獨特的語言，提醒我：沒有唯一的方法，只有適合當下的方式。因此，我珍惜每一次的調理，把它當作與身體的對話：傾聽、陪伴，並一起找到平衡。\n\n這些經驗帶給我的收穫，總比我想像得更多。過去的摸索，讓我更期待未來的探索。",
    specialties: ["解剖列車", "筋膜手法", "拮抗鬆弛術", "整體評估"],
    certifications: [
      "解剖列車（Anatomy Trains）徒手應用",
      "義大利筋膜手法（FM）徒手應用",
      "全身軟組織肌肉放鬆 徒手應用",
      "系統性身體功能評估（SFMA）研習",
      "Counterstrain 拮抗鬆弛術 基礎班",
      "SISSEL SPINEFITTER® 認證指導員",
    ],
    yearsExp: 3,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-20"],
  },
  {
    id: "shuoyuan",
    name: "溯源老師",
    level: "技師職人",
    gender: "male",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "以如水的溫柔與韌性，引導您連結生命的源頭能量",
    bio: "自行創業當老闆，多年的餐飲工作，讓我深刻理解長年勞損與痠痛的糾纏，也因此更懂得「健康」的可貴。\n\n我以如水般的溫柔與韌性，化解身體的緊繃，更以真誠的心，引導您連結生命的源頭能量。\n\n如今我踏入了健康產業，帶著無比堅定的信念，走上筋膜調理的道路。在法夏，我希望能藉由調理，帶給您不只肌肉的放鬆，更是內在的勇氣與平靜。讓我們一起，以帥氣、開心的姿態，迎向每一天！",
    specialties: ["解剖列車", "筋膜手法", "整體評估", "能量平衡"],
    certifications: [
      "系統性身體功能評估（SFMA）概念研習",
      "解剖列車（Anatomy Trains）徒手應用",
      "義大利筋膜手法（FM）徒手應用",
    ],
    yearsExp: 3,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-20"],
  },
  {
    id: "daji",
    name: "大吉老師",
    level: "技師職人",
    gender: "male",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "對人的狀態敏銳感知，從源頭導正讓身體找回平衡順暢",
    bio: "從精緻餐旅服務到高壓的公共事務，過往的工作經驗讓我變成對「人的狀態」非常敏銳。現在，我把這份敏銳度用在你的身心上。\n\n擁有三年以上的徒手調理經驗，不間斷地學習相關知識與手法，透過筋膜張力與動作評估，循線索發現問題來源，並從源頭導正，指導需要強化的肌群。\n\n我喜愛幫助人恢復身體功能、重拾笑顏，讓我們一起讓離家出走的平衡與順暢重新回到你的身體。",
    specialties: ["解剖列車", "筋膜手法", "動作評估", "體適能訓練"],
    certifications: [
      "系統性身體功能評估（SFMA）概念研習",
      "解剖列車（Anatomy Trains）徒手應用",
      "義大利筋膜手法（FM）徒手應用",
      "體適能健身 C 級指導員",
    ],
    yearsExp: 3,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-20"],
  },
  {
    id: "lily",
    name: "Lily老師",
    level: "準技師",
    gender: "female",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "用心學習，全力為您提供舒適調理體驗",
    bio: "準技師，持續精進筋膜調理技術，用心陪伴每一位客人。",
    specialties: ["基礎筋膜放鬆", "全身調理"],
    certifications: [],
    yearsExp: 1,
    allowedServiceIds: ["basic-60", "addon-20"],
  },
  {
    id: "jojo",
    name: "Jojo老師",
    level: "實習技師",
    gender: "female",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "曾是上班族的我，用親身經歷陪伴每一個身體不適的你",
    bio: "以前的我，也是個朝九晚五的上班族。長期久坐、高壓工作，加上運動後缺乏正確放鬆，讓身體累積了大量的緊繃與痠痛。直到發現自己的肩胛骨越來越突出，肩背不僅頻繁痠痛，嚴重時甚至還會出現麻感。\n\n在接觸徒手調整後，那些長期困擾我的不適逐漸獲得改善。那是我第一次感受到——原來，身體是可以慢慢還給自己的。\n\n因為這段經歷，讓我能更理解身體不適時的無力與無助。如果你也正與自己的身體拉鋸，我希望能用我的專業與陪伴，和你一起找到問題的原因，幫助身體慢慢回到更自在的狀態。",
    specialties: ["解剖列車", "筋膜手法", "整體評估"],
    certifications: [
      "解剖列車（Anatomy Trains）徒手應用",
      "義大利筋膜手法（FM）徒手應用",
      "系統性身體功能評估（SFMA）研習",
    ],
    yearsExp: 0,
    allowedServiceIds: ["basic-60"],
  },
  {
    id: "r3",
    name: "R3老師",
    level: "實習技師",
    gender: "male",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "用雙手的溫度傾聽身體訊號，帶著利他之心與您共鳴",
    bio: "過去，我習慣用大腦的邏輯，專注於冷冰冰的產品品質；而現在，我選擇用雙手的溫度，去傾聽每一個生命背後的故事。\n\n經歷過高壓身心的洗禮，我深刻明白技術只是「方法」，能真正聽懂身體發出的訊號，才是「初心」。對我而言，筋膜調理不只是解開肌肉的緊繃，更是一場關於能量與平衡的修煉。\n\n當我的雙手觸碰，我會帶著純粹的利他之心，與您的身體頻率共鳴，陪伴您放下累積的緊繃與焦慮，找回久違的平衡與舒坦。",
    specialties: ["解剖列車", "筋膜手法", "軟組織放鬆", "經絡手技"],
    certifications: [
      "解剖列車（Anatomy Trains）徒手應用研習",
      "義大利筋膜技術（Fascial Manipulation）徒手應用研習",
      "全身軟組織肌肉放鬆 徒手應用",
      "系統性身體功能評估 研習",
      "經絡十八子手技 200式",
    ],
    yearsExp: 0,
    allowedServiceIds: ["basic-60"],
  },
  // ── 大安店 ──────────────────────────────
  {
    id: "atai",
    name: "阿鐵老師",
    level: "技術長",
    gender: "male",
    storeIds: ["daan"],
    photoPlaceholder: "",
    tagline: "結合臨床醫學與徒手調理，幫您解決痠痛、找回穩定狀態",
    bio: "我投入身體工作約 5–6 年，目前就讀物理治療，並於各大醫院復健科臨床實習。\n\n一路以來，我結合臨床醫學與徒手調理，幫助大家解決痠痛、提升身體功能，甚至在運動與生活中找回更穩定的狀態。現在是大安店的技術長、FASCIA工具應用講師。",
    specialties: ["臨床醫學整合", "整脊調理", "顱薦骨療法", "運動步態分析"],
    certifications: [
      "EMT-1 初級救護員",
      "AMCT 整脊師（台灣自然醫學協會）",
      "CST-1 & 2 顱薦骨療法 國際認證（台灣物理治療協會）",
      "X 光骨骼影像研習",
      "上下肢評估應用研習",
      "當代筋膜運動學研習（台灣物理治療協會）",
      "結構調理研習",
      "情緒解剖研習",
      "跑步步態研習",
      "FP 動作控制研習",
      "CETI 癌症訓練專家",
      "NASM-CPT 美國運動醫學協會",
    ],
    yearsExp: 6,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "training-50", "frequency-40", "addon-20"],
  },
  {
    id: "miffy",
    name: "Miffy老師",
    level: "技師職人",
    gender: "female",
    storeIds: ["daan"],
    photoPlaceholder: "",
    tagline: "推崇自然療法，陪伴您傾聽身體訊息、釋放緊繃、回歸平衡",
    bio: "我推崇自然療法理念，認同透過調節生活型態（行為習慣/生活作息/運動冥想等）與自然元素來平衡身心。\n\n我有五年文創產業的背景，學會了如何覺察與共鳴；也在九年的女性生活領域中，持續探索「以人為本」的生活方式。\n\n我相信，身體的每一個緊繃與痠痛，都透露出訊息。讓我們一起傾聽、釋放、再一次回歸平衡與自由。",
    specialties: ["筋膜徒手應用", "芳香調理", "自然療法", "整體評估"],
    certifications: [
      "系統性身體功能評估（SFMA）研習",
      "解剖列車（Anatomy Trains）徒手應用",
      "義大利筋膜手法（FM）徒手應用",
      "全身軟組織肌肉放鬆 徒手應用",
      "ICap 芳香調理師 證照",
      "美容師丙級 證照",
    ],
    yearsExp: 5,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-20"],
  },
  {
    id: "cindy",
    name: "Cindy老師",
    level: "技師職人",
    gender: "female",
    storeIds: ["daan"],
    photoPlaceholder: "",
    tagline: "細心傾聽、即時回應，讓每一位客人都感受到被理解與照顧",
    bio: "我一直很喜歡「照顧與支持他人」。一路走來的服務經驗，讓我懂得如何細心傾聽、即時回應，最重要的是──讓每一位客人都能感受到被理解與被照顧。\n\n在法夏，我透過專業的筋膜放鬆與訓練，陪伴許多客人從痠痛不適逐漸改善，找回身體的平衡與自在。",
    specialties: ["筋膜徒手應用", "聲音共振", "體適能訓練", "產康調理"],
    certifications: [
      "缽動身心・大銅缽聲音共振鬆筋膜經絡法",
      "體適能健身 C 級指導員",
      "基礎動作模式肌肉動力學",
      "解剖列車（Anatomy Trains）徒手應用",
      "義大利筋膜手法（FM）徒手應用",
      "SISSEL SPINEFITTER® 認證指導員",
      "GMAA 國際產康初階認證",
    ],
    yearsExp: 4,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-20"],
  },
  {
    id: "wenyi",
    name: "雯儀老師",
    level: "技師職人",
    gender: "female",
    storeIds: ["daan"],
    photoPlaceholder: "",
    tagline: "二十年顧客服務精神結合筋膜技術，讓您在放鬆中走向更健康",
    bio: "我有超過二十年的顧客服務經驗，擅長觀察入微、讓人賓至如歸。快速理解客人的需求，並細心回應。\n\n加入法夏後，我把這份服務精神結合筋膜放鬆技術，陪伴大家在放鬆的同時，也逐步走向更健康的身心狀態。",
    specialties: ["解剖列車", "筋膜手法", "經絡撥筋", "整體評估"],
    certifications: [
      "解剖列車（Anatomy Trains）徒手應用",
      "義大利筋膜手法（FM）徒手應用",
      "系統性身體功能評估學",
      "應用解剖與肌肉動力學",
      "經絡撥筋保健實務",
    ],
    yearsExp: 3,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-20"],
  },
  // ── 僅限內部使用（staffOnly）──────────────
  {
    id: "yuchen",
    name: "宇辰老師",
    level: "技術長",
    gender: "male",
    storeIds: ["xiaoJudan", "daan"],
    photoPlaceholder: "",
    tagline: "FASCIA 法夏創辦人・技術總監・培訓導師",
    bio: "FASCIA 法夏創辦人，畢業於中華醫事大學調理保健技術系，首屆民俗調理傳統整復推拿技術士。\n\n深耕筋膜結構美學多年，整合國際頂尖筋膜療法，致力培訓台灣最專業的筋膜調理師，讓更多人找回身體的自然平衡。",
    specialties: ["義大利筋膜手法", "顱薦骨療法", "Redcord訓練", "芳香療法"],
    certifications: [
      "中華醫事大學 調理保健技術系（畢）",
      "首屆民俗調理傳統整復推拿技術士",
      "美國 Anatomy Trains 解剖列車 臨床應用",
      "PNF 本體感覺神經肌肉促進術 臨床應用",
      "義大利 Fascial Manipulation 系列 國際認證（FM1～FM4，筋骨＋內臟）",
      "Mulligan Concept 動態關節鬆動 國際認證（上半身／下半身）",
      "英國 筋膜解纏與能量覺醒 國際認證",
      "英國 疤痕組織組合應用 國際認證",
      "瑞士 RCST 生物動能頭薦骨 國際認證",
      "法國 骨病學系列 LMO-2 國際認證",
      "英國 ITEC 精油調香師 國際認證",
      "美國 NAHA 芳療師 國際認證",
      "挪威 Redcord 系列 國際認證（Active Intro / Advanced / Neurac 1）",
      "德國 SISSEL® OCTOCORE / SPINEFITTER / SitFit-Plus CE / epiflow",
      "肌貼系 肌肉穩定貼紮系統",
      "肌貼系 淋巴循環貼紮系統",
      "日本 YMC & 美國 STW 肌筋膜伸展術 臨床應用",
      "頌缽・缽動身心 臨床應用",
    ],
    yearsExp: 10,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "training-50", "frequency-40", "addon-20"],
    staffOnly: true,
  },
];

// ─── Services ──────────────────────────────────────────────────────────────
export const services: Service[] = [
  {
    id: "premium-120",
    name: "頂級筋膜結構整合",
    duration: 120,
    priceRegular: { "技師職人": 3800, "技術長": 4500, "準技師": 3000, "實習技師": 2500 },
    priceMember:  { "技師職人": 3000, "技術長": 3800, "準技師": 2500, "實習技師": 2000 },
    description: "完整的全身筋膜結構評估與深層整合療程。從足部到頭部系統性調整，適合長期姿勢問題或首次深度體驗。",
    category: "fascia",
    onlineBookable: true,
  },
  {
    id: "refined-90",
    name: "精緻筋膜調理",
    duration: 90,
    priceRegular: { "技師職人": 3200, "技術長": 3800, "準技師": 2500, "實習技師": 2000 },
    priceMember:  { "技師職人": 2500, "技術長": 3200, "準技師": 2000, "實習技師": 1600 },
    description: "針對特定部位進行深度筋膜鬆解，搭配全身淺層調理。適合有特定痠痛部位或定期保養需求。",
    category: "fascia",
    onlineBookable: true,
  },
  {
    id: "basic-60",
    name: "基礎筋膜放鬆",
    duration: 60,
    priceRegular: { "技師職人": 2500, "技術長": 3000, "準技師": 2000, "實習技師": 1500 },
    priceMember:  { "技師職人": 2000, "技術長": 2500, "準技師": 1600, "實習技師": 1200 },
    description: "聚焦單一重點部位的精準筋膜調理。忙碌現代人的快速保養首選，高效率釋放緊繃。",
    category: "fascia",
    onlineBookable: true,
  },
  {
    id: "training-50",
    name: "一對一功能式訓練",
    duration: 50,
    priceRegular: { "技師職人": 2500, "技術長": 2500, "準技師": 2500, "實習技師": 2500 },
    priceMember:  { "技師職人": 2500, "技術長": 2500, "準技師": 2500, "實習技師": 2500 },
    description: "個人化結構矯正訓練課程，由技師帶領進行針對性的核心與姿勢訓練，鞏固筋膜調理成效。",
    category: "training",
    onlineBookable: true,
  },
  {
    id: "frequency-40",
    name: "頻率檢測",
    duration: 40,
    priceRegular: { "技師職人": 2500, "技術長": 2500, "準技師": 2500, "實習技師": 2500 },
    priceMember:  { "技師職人": 2500, "技術長": 2500, "準技師": 2500, "實習技師": 2500 },
    description: "專業頻率檢測評估，了解身體筋膜狀態。",
    category: "fascia",
    onlineBookable: false,
  },
  {
    id: "addon-20",
    name: "加購延長 +20分",
    duration: 20,
    priceRegular: { "技師職人": 600, "技術長": 600, "準技師": 600, "實習技師": 600 },
    priceMember:  { "技師職人": 600, "技術長": 600, "準技師": 600, "實習技師": 600 },
    description: "於主療程後加購20分鐘，針對特別需要加強的部位深度處理。",
    category: "addon",
    isAddon: true,
    onlineBookable: true,
  },
];

// ─── Membership Tiers ──────────────────────────────────────────────────────
export const membershipTiers = [
  {
    amount: 15000,
    label: "會員",
    benefits: ["享會員優惠價格"],
    vouchers: [] as string[],
  },
  {
    amount: 30000,
    label: "進階會員",
    benefits: ["享會員優惠價格", "結構訓練券 × 1"],
    vouchers: ["結構訓練券 × 1"],
  },
  {
    amount: 50000,
    label: "頂級會員",
    benefits: ["享會員優惠價格", "結構訓練券 × 1", "頻率檢測券 × 1"],
    vouchers: ["結構訓練券 × 1", "頻率檢測券 × 1"],
  },
];

// ─── Mock User ─────────────────────────────────────────────────────────────
// Default new user state: $0 balance, no consent, no tier
export const mockUser = {
  id: "user001",
  name: "王小明",
  phone: "0912-345-678",
  email: "user@example.com",
  birthday: "1990-05-15",
  isNewUser: true,
  isMember: false,
  storedValue: 0,
  totalSpent: 0,
  consentSigned: false,
  vouchers: [] as string[],
  bookingHistory: [] as Array<{ id: string; date: string; store: string; teacher: string; service: string; amount: number }>,
};

// ─── Available Time Slots Generator ────────────────────────────────────────
export function generateTimeSlots(date: Date, duration: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startHour = 10;
  const endHour = 22;
  const intervalMinutes = 30; // 整點與半點

  // Simulate some unavailable slots based on date
  const dayOfWeek = date.getDay();
  const unavailableHours = dayOfWeek === 0 ? [] : [11, 13, 15, 18]; // Sunday open, others have some blocks

  // Check if the selected date is today; if so, filter out past slots (with 30-min buffer)
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const bufferMinutes = 30;
  const cutoffTotalMins = isToday
    ? (now.getHours() - startHour) * 60 + now.getMinutes() + bufferMinutes
    : -Infinity;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += intervalMinutes) {
      // Check if enough time remains before closing
      const totalMinsFromStart = (hour - startHour) * 60 + min;
      const closingMins = (endHour - startHour) * 60;
      if (totalMinsFromStart + duration > closingMins) break;

      // Skip past time slots for today (gray out by marking unavailable)
      if (totalMinsFromStart < cutoffTotalMins) {
        // Don't add past slots at all — they should not be selectable
        continue;
      }

      const timeStr = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;

      // Mock availability
      const isUnavailable =
        unavailableHours.includes(hour) ||
        (hour === 14 && min < 30) ||
        (dayOfWeek === 1); // Monday closed

      slots.push({
        time: timeStr,
        available: !isUnavailable,
      });
    }
  }

  return slots;
}
