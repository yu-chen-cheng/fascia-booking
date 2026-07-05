export type StaffLevel = "技術長" | "資深職人" | "進階職人" | "初階職人" | "準師";

// 客人端顯示用：技術長維持，其他統稱「技術職人」
export function publicLevel(level: StaffLevel): string {
  return level === "技術長" ? "技術長" : "技術職人";
}

export interface Store {
  id: string;
  name: string;
  address: string;
  mapEmbedUrl: string;
  phone: string;
  hours: string;
  comingSoon?: boolean;
  openDate?: string;
}

export interface Teacher {
  id: string;
  name: string;
  avatarText: string; // text shown in the colored circle
  subtitle?: string; // optional extra title shown below level badge (e.g. 店長)
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
    address: "新北市板橋區仁化街27號1樓",
    mapEmbedUrl: "",
    phone: "",
    hours: "每週一至週日 10:00–22:00",
    openDate: "2026-07-15",
  },
];

// ─── Teachers ──────────────────────────────────────────────────────────────
export const teachers: Teacher[] = [
  // ── 小巨蛋店 ──────────────────────────────
  {
    id: "youtong",
    name: "宥彤老師",
    avatarText: "宥彤",
    level: "技術長",
    gender: "female",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "高考物理治療師，深耕九年，曾多次出國義診的調理職人",
    bio: "我是國考合格的物理治療師，在身體調理這條路上已走了超過九年。除了在醫療院所累積紮實的臨床經驗，我也多次自費出國參與義診，走進不同文化與環境裡，用雙手幫助真正需要的人。\n\n那些義診的經歷讓我明白：語言不通也沒關係，身體的語言是共通的。感受得到緊繃、找得到根源、解決問題——這是我一直在做、也會持續做的事。\n\n我的理念是從源頭改善，而不是壓制症狀。來找我，我們一起讓你的身體回到它本來的狀態。",
    specialties: ["動作評估", "筋膜手法", "解剖列車", "羅夫按摩", "軟組織放鬆", "筋膜結構評估", "動態神經穩定", "足部核心"],
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
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "training-smart", "frequency-40", "addon-15", "addon-gold"],
  },
  {
    id: "jimbo",
    name: "Jimbo老師",
    avatarText: "Jimbo",
    subtitle: "店長",
    level: "初階職人",
    gender: "female",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "劇場人、十年創業老闆，用舞台磨出來的敏感度讀懂你的身體",
    bio: "我有兩段很不一樣的過去：一段在舞台上，一段在吧檯後。\n\n劇場訓練我的感知——怎麼讀空間、讀情緒、讀一個人此刻的狀態。十年飲料店創業訓練我的韌性——怎麼在每天面對各式各樣的人時，還能保持細心與熱情。\n\n這兩件事加在一起，讓我做調理的方式有點不一樣：我不是只按照你說的位置去做，而是在你進門的那一刻就開始讀你——站姿、眼神、說話的方式，都在告訴我你的身體今天需要什麼。",
    specialties: ["動作評估", "筋膜手法", "解剖列車", "羅夫按摩", "軟組織放鬆", "身體覺察", "整體評估"],
    certifications: [
      "解剖列車（Anatomy Trains）徒手應用",
      "義大利筋膜手法（FM）徒手應用",
      "全身軟組織肌肉放鬆 徒手應用",
      "系統性身體功能評估（SFMA）研習",
    ],
    yearsExp: 4,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-15", "addon-gold"],
  },
  {
    id: "hanhan",
    name: "韓韓老師",
    avatarText: "韓韓",
    level: "資深職人",
    gender: "female",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "知名導演旗下剪接師、旅居海外、英語流利，用剪接師的眼光看懂你的身體",
    bio: "我做過知名導演旗下的電影剪接師，所有的畫面都是我一格一格看過、一刀一刀剪出來的。\n\n剪接這份工作教我一件事：細節決定一切。同樣一個場景，動作差0.5秒、角度差一點，給人的感覺就完全不同。這種對細微差異的敏感度，後來全部轉移到我的雙手上。\n\n在海外打工的經驗讓我的英語很流利，也讓我習慣和不同背景的人相處。調理時我喜歡細細觀察——哪個方向的張力更緊、哪個細節被忽略了——就像剪接一樣，找到那個「差一點」，把它調回來。",
    specialties: ["動作評估", "筋膜手法", "解剖列車", "羅夫按摩", "軟組織放鬆", "拮抗鬆弛術", "整體評估"],
    certifications: [
      "解剖列車（Anatomy Trains）徒手應用",
      "義大利筋膜手法（FM）徒手應用",
      "全身軟組織肌肉放鬆 徒手應用",
      "系統性身體功能評估（SFMA）研習",
      "Counterstrain 拮抗鬆弛術 基礎班",
      "SISSEL SPINEFITTER® 認證指導員",
    ],
    yearsExp: 3,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-15", "addon-gold"],
  },
  {
    id: "shuoyuan",
    name: "溯源老師",
    avatarText: "溯源",
    level: "初階職人",
    gender: "male",
    storeIds: ["banqiao"],
    photoPlaceholder: "",
    tagline: "創業家、溯溪人，豪邁熱情，用真誠的雙手找到你的源頭",
    bio: "我是自己當老闆的人，靠著一份豬血糕事業打下一片天；空閒時，你會在溪谷裡找到我——多年溯溪經驗，讓我習慣在最艱難的地形裡，一步一步找到上游的源頭。\n\n朋友說我有點像張飛：個性豪邁、熱情直爽，跟誰都能聊得起來。也正因為這樣，當你躺上床說「這裡痠、那裡緊」，我會用最直接的方式回應你——不廢話、不拐彎，找到根源就動手解決。\n\n走入筋膜調理這條路，我帶著溯溪時的那股韌勁——不繞路、不妥協，帶著滿腔熱情陪你一起把身體找回來。",
    specialties: ["動作評估", "筋膜手法", "解剖列車", "羅夫按摩", "軟組織放鬆", "身體結構平衡", "整體評估"],
    certifications: [
      "系統性身體功能評估（SFMA）概念研習",
      "解剖列車（Anatomy Trains）徒手應用",
      "義大利筋膜手法（FM）徒手應用",
    ],
    yearsExp: 3,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-15", "addon-gold"],
  },
  {
    id: "daji",
    name: "大吉老師",
    avatarText: "大吉",
    level: "初階職人",
    gender: "male",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "精緻飯店出身、精通外語、帶著三年徒手底子加入法夏",
    bio: "我在高端飯店待過多年，精通多國語言，習慣用最高標準服務來自世界各地的客人——細節不能錯、狀態要能隨時切換、對每個人的需求要夠敏銳。\n\n加入法夏之前，我已經在徒手調理這條路走了三年。不是半路出家，而是帶著真實的實戰經驗來的。\n\n外語能力讓我能服務更多元的客群，飯店訓練出的細膩讓我做每一個手法都不將就，而三年的調理底子，讓我從第一天來到法夏就知道自己在做什麼。你值得被這樣的人認真對待。",
    specialties: ["動作評估", "筋膜手法", "解剖列車", "羅夫按摩", "軟組織放鬆", "體適能訓練", "整體評估"],
    certifications: [
      "系統性身體功能評估（SFMA）概念研習",
      "解剖列車（Anatomy Trains）徒手應用",
      "義大利筋膜手法（FM）徒手應用",
      "體適能健身 C 級指導員",
    ],
    yearsExp: 3,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-15", "addon-gold"],
  },
  {
    id: "lily",
    name: "Lily老師",
    avatarText: "Lily",
    level: "初階職人",
    gender: "female",
    storeIds: ["banqiao"],
    photoPlaceholder: "",
    tagline: "曾自己開過徒手工作室，外放活潑、英語強，技術比外表更讓你意外",
    bio: "很多人第一次見到我，會覺得：這麼活潑外向、這麼嬌小可愛，調理起來應該很輕柔吧？\n\n然後躺上去之後就不這麼想了。\n\n我之前自己開過徒手工作室，獨立接客、獨立處理各種狀況，後來又在其他職場繼續累積了一年多的實戰經驗。英文很流利，喜歡追國際最新的調理研究，把看到的東西直接用在你身上。\n\n我很愛說話、很愛分享，隨時都有聊不完的話題——但你知道嗎？當我突然安靜下來的時候，不是沒話說，而是我的手找到了什麼。那個瞬間的靜，往往是最關鍵的。",
    specialties: ["解剖列車", "筋膜手法", "基礎按摩手法", "整體評估"],
    certifications: [],
    yearsExp: 1,
    allowedServiceIds: ["basic-60", "addon-15", "addon-gold"],
  },
  {
    id: "jojo",
    name: "Jojo老師",
    avatarText: "Jojo",
    level: "初階職人",
    gender: "female",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "工程師出身，因為自己的肩膀出問題，走上了這條路",
    bio: "我以前是工程師，每天面對大量數據、長時間坐在電腦前，身體一點一點在抗議，但我一直說「還好還好」。\n\n直到發現肩胛骨已經翹得很明顯，肩背持續痠痛，嚴重時手還會麻。去運動也沒改善，因為根本不知道問題出在哪裡——就這樣撐著，硬撐了很長一段時間。\n\n接觸徒手調理之後，才第一次感覺到身體「鬆開來」是什麼感覺。那個當下讓我決定轉行：我想幫和以前的我一樣，悶著頭苦撐、說不清楚哪裡出問題的人。\n\n工程師的背景讓我習慣找問題根源、不接受模糊的答案。你的身體不舒服，一定有原因——我們一起找。",
    specialties: ["動作評估", "筋膜手法", "解剖列車", "羅夫按摩", "軟組織放鬆", "整體評估"],
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
    avatarText: "R3",
    level: "初階職人",
    gender: "male",
    storeIds: ["banqiao"],
    photoPlaceholder: "",
    tagline: "年薪百萬科技業工程師，放棄高薪，只為把身體這件事做對",
    bio: "我在科技業做工程師，年薪超過百萬。很多人聽到我轉行，第一個反應是：「為什麼？」\n\n因為我想做一件真正有意義的事。\n\n工程師的訓練讓我習慣把系統拆開來看——找輸入、找輸出、找哪個環節出了問題。後來發現人體也是一套精密的工程結構，筋膜、骨骼、動作模式，全部都有邏輯可循。解剖學和動作力學的知識，我背得比準備技術面試還認真。\n\n從科技業到調理師，薪水變了，但對「把事情做對」的執著沒有變。讓我用工程師的腦和真心投入的雙手，幫你把身體好好「除錯」。",
    specialties: ["動作評估", "筋膜手法", "解剖列車", "羅夫按摩", "軟組織放鬆", "身體能量手技"],
    certifications: [
      "解剖列車（Anatomy Trains）徒手應用研習",
      "義大利筋膜技術（Fascial Manipulation）徒手應用研習",
      "全身軟組織肌肉放鬆 徒手應用",
      "系統性身體功能評估 研習",
      "身體能量手技 進階研習",
    ],
    yearsExp: 0,
    allowedServiceIds: ["basic-60"],
  },
  // ── 大安店 ──────────────────────────────
  {
    id: "atai",
    name: "阿鐵老師",
    avatarText: "阿鐵",
    level: "技術長",
    gender: "male",
    storeIds: ["daan"],
    photoPlaceholder: "",
    tagline: "物理治療系畢業、近十年調理資歷，大安店技術長",
    bio: "我踏入身體工作這個領域將近十年，物理治療系畢業、實習完成，並在各大醫院復健科累積了紮實的臨床實務經驗。學術與實務雙軌並進，讓我對身體結構和動作功能的理解比一般調理師更深一層。\n\n這些年來，我整合了多種國際認證手法與評估系統，幫助許多人從慢性痠痛中找到出路，也在運動和日常生活中重建更穩定的身體基礎。\n\n現在是大安店的技術長，也是法夏工具應用的培訓講師。帶著近十年的底子，我知道怎麼幫你找到真正的問題所在。",
    specialties: ["動作評估", "筋膜手法", "解剖列車", "羅夫按摩", "軟組織放鬆", "結構整合調理", "顱薦骨放鬆", "運動步態分析"],
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
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "training-smart", "frequency-40", "addon-15", "addon-gold"],
  },
  {
    id: "miffy",
    name: "Miffy老師",
    avatarText: "Miffy",
    subtitle: "店長",
    level: "資深職人",
    gender: "female",
    storeIds: ["daan"],
    photoPlaceholder: "",
    tagline: "文創背景、國際芳療師認證，讓調理成為你生活裡最值得的時光",
    bio: "我在文創產業工作過，也取得了國際芳香調理師證照。這兩段經歷給了我同一件事：對「體驗感」的極度重視。\n\n文創教我美感和細節；芳療讓我理解氣味、觸感、環境對身心的影響遠超過我們以為的程度。把這些帶進筋膜調理，我在做的不只是鬆開你的肌肉——而是讓你從進門到離開，整個人都真正放下來。\n\n來找我的人，最後說的通常不是「比較不痠了」，而是「整個人輕了很多」。那種感覺，才是我想給你的。",
    specialties: ["動作評估", "筋膜手法", "解剖列車", "羅夫按摩", "軟組織放鬆", "芳香調理", "自然療法", "整體評估"],
    certifications: [
      "系統性身體功能評估（SFMA）研習",
      "解剖列車（Anatomy Trains）徒手應用",
      "義大利筋膜手法（FM）徒手應用",
      "全身軟組織肌肉放鬆 徒手應用",
      "ICap 芳香調理師 證照",
      "美容師丙級 證照",
    ],
    yearsExp: 5,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-15", "addon-gold"],
  },
  {
    id: "cindy",
    name: "Cindy老師",
    avatarText: "Cindy",
    level: "資深職人",
    gender: "female",
    storeIds: ["daan", "banqiao"],
    photoPlaceholder: "",
    tagline: "四年徒手資歷、餐飲業磨出的應對力，讓你從第一句話就覺得自在",
    bio: "我有四年的徒手調理資歷，做過速食連鎖也做過高端餐飲，兩種截然不同的場域都待過——一個訓練你在最快的節奏下還能照顧好每一個人，另一個要求你在最講究的環境裡讓客人感覺被尊重。\n\n這兩段經歷加在一起，讓我變成一個很會讀人的人：你今天是輕鬆來放鬆的，還是某個地方一直在困擾你？我通常很快就能感覺到，然後調整我的方式。\n\n調理的技術我紮實地練了四年；如何讓你從踏進門就感覺舒服，是我在餐飲業學到的事。這兩件事我都不馬虎。",
    specialties: ["動作評估", "筋膜手法", "解剖列車", "羅夫按摩", "軟組織放鬆", "聲音共振", "體適能訓練", "產康調理"],
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
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-15", "addon-gold"],
  },
  {
    id: "wenyi",
    name: "雯儀老師",
    avatarText: "雯儀",
    level: "進階職人",
    gender: "female",
    storeIds: ["daan"],
    photoPlaceholder: "",
    tagline: "曾同時管理雙店、創下全品牌最高業績，現在用同樣的標準照顧你的身體",
    bio: "我在連鎖餐飲業工作超過二十年，曾同時經營兩個據點，並在全品牌數百家門市中創下最高營業額紀錄——不是靠運氣，是靠對細節的極度要求，以及對每一位走進來的人都認真以對。\n\n那段經歷讓我學到：真正好的服務，是讓對方感覺被重視，而不是被服務。\n\n加入法夏後，我把二十年累積的直覺和筋膜技術結合在一起，讓我用雙手傾聽你的身體。我們都在這社會裡照顧人，現在也該換你被照顧了。",
    specialties: ["動作評估", "筋膜手法", "解剖列車", "羅夫按摩", "軟組織放鬆", "整體評估"],
    certifications: [
      "解剖列車（Anatomy Trains）徒手應用",
      "義大利筋膜手法（FM）徒手應用",
      "系統性身體功能評估學",
      "應用解剖與肌肉動力學",
      "軟組織保健手法研習",
    ],
    yearsExp: 3,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-15", "addon-gold"],
  },
  // ── 僅限內部使用（staffOnly）──────────────
  {
    id: "yuchen",
    name: "宇辰老師",
    avatarText: "宇辰",
    level: "技術長",
    gender: "male",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "FASCIA 法夏創辦人・技術總監・培訓導師",
    bio: "FASCIA 法夏創辦人，畢業於中華醫事大學調理保健技術系，首屆民俗調理傳統整復推拿技術士。\n\n深耕筋膜結構美學多年，整合國際頂尖筋膜療法，致力培訓台灣最專業的筋膜調理師，讓更多人找回身體的自然平衡。",
    specialties: ["義大利筋膜手法", "顱薦骨放鬆", "Redcord訓練", "芳香調理"],
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
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "training-smart", "frequency-40", "addon-15", "addon-gold"],
    staffOnly: true,
  },
];

// ─── Services ──────────────────────────────────────────────────────────────
export const services: Service[] = [
  {
    id: "premium-120",
    name: "頂級筋膜結構整合",
    duration: 120,
    priceRegular: { "技術長": 4500, "資深職人": 3800, "進階職人": 3200, "初階職人": 2800, "準師": 2500 },
    priceMember:  { "技術長": 3800, "資深職人": 3000, "進階職人": 2500, "初階職人": 2200, "準師": 2000 },
    description: "完整的全身筋膜結構評估與深層整合療程。從足部到頭部系統性調整，適合長期姿勢問題或首次深度體驗。",
    category: "fascia",
    onlineBookable: true,
  },
  {
    id: "refined-90",
    name: "精緻筋膜調理",
    duration: 90,
    priceRegular: { "技術長": 3800, "資深職人": 3200, "進階職人": 2800, "初階職人": 2400, "準師": 2000 },
    priceMember:  { "技術長": 3200, "資深職人": 2500, "進階職人": 2200, "初階職人": 1900, "準師": 1600 },
    description: "針對特定部位進行深度筋膜鬆解，搭配全身淺層調理。適合有特定痠痛部位或定期保養需求。",
    category: "fascia",
    onlineBookable: true,
  },
  {
    id: "basic-60",
    name: "基礎筋膜放鬆",
    duration: 60,
    priceRegular: { "技術長": 3000, "資深職人": 2500, "進階職人": 2200, "初階職人": 1800, "準師": 1500 },
    priceMember:  { "技術長": 2500, "資深職人": 2000, "進階職人": 1800, "初階職人": 1500, "準師": 1200 },
    description: "聚焦單一重點部位的精準筋膜調理。忙碌現代人的快速保養首選，高效率釋放緊繃。",
    category: "fascia",
    onlineBookable: true,
  },
  {
    id: "training-smart",
    name: "智能訓練",
    duration: 50,
    priceRegular: { "技術長": 2500, "資深職人": 2500, "進階職人": 2500, "初階職人": 2500, "準師": 2500 },
    priceMember:  { "技術長": 2000, "資深職人": 2000, "進階職人": 2000, "初階職人": 2000, "準師": 2000 },
    description: "個人化智能結構訓練，由宥彤/阿鐵技術長帶領進行針對性的核心與姿勢訓練。",
    category: "training",
    onlineBookable: true,
  },
  {
    id: "frequency-40",
    name: "頻率檢測",
    duration: 40,
    priceRegular: { "技術長": 2500, "資深職人": 2500, "進階職人": 2500, "初階職人": 2500, "準師": 2500 },
    priceMember:  { "技術長": 2500, "資深職人": 2500, "進階職人": 2500, "初階職人": 2500, "準師": 2500 },
    description: "專業頻率檢測評估，了解身體筋膜狀態。",
    category: "fascia",
    onlineBookable: false,
  },
  {
    id: "addon-15",
    name: "加購延長 +15分",
    duration: 15,
    priceRegular: { "技術長": 600, "資深職人": 600, "進階職人": 600, "初階職人": 600, "準師": 600 },
    priceMember:  { "技術長": 600, "資深職人": 600, "進階職人": 600, "初階職人": 600, "準師": 600 },
    description: "於主療程後加購15分鐘，針對特別需要加強的部位深度處理。",
    category: "addon",
    isAddon: true,
    onlineBookable: true,
  },
  {
    id: "addon-gold-sleep",
    name: "黃金甲｜舒壓好眠組",
    duration: 0,
    priceRegular: { "技術長": 3060, "資深職人": 3060, "進階職人": 3060, "初階職人": 3060, "準師": 3060 },
    priceMember:  { "技術長": 2640, "資深職人": 2640, "進階職人": 2640, "初階職人": 2640, "準師": 2640 },
    description: "睿智膏＋葉黃素。適合工作壓力大、眼壓高、想提升睡眠品質的疲勞族群。",
    category: "addon",
    isAddon: true,
    onlineBookable: true,
  },
  {
    id: "addon-gold-eye",
    name: "黃金甲｜晶亮活力組",
    duration: 0,
    priceRegular: { "技術長": 2370, "資深職人": 2370, "進階職人": 2370, "初階職人": 2370, "準師": 2370 },
    priceMember:  { "技術長": 2040, "資深職人": 2040, "進階職人": 2040, "初階職人": 2040, "準師": 2040 },
    description: "葉黃素＋維生素。適合3C/手機重度依賴者、需要全家大小日常基礎補給的家庭。",
    category: "addon",
    isAddon: true,
    onlineBookable: true,
  },
  {
    id: "addon-gold-beauty",
    name: "黃金甲｜逆齡淨化組",
    duration: 0,
    priceRegular: { "技術長": 4360, "資深職人": 4360, "進階職人": 4360, "初階職人": 4360, "準師": 4360 },
    priceMember:  { "技術長": 3760, "資深職人": 3760, "進階職人": 3760, "初階職人": 3760, "準師": 3760 },
    description: "白藜蘆醇飲＋冰晶膠原凍。適合想要養顏美容、好氣色、定妝後不脫妝與體內大掃除的客戶。",
    category: "addon",
    isAddon: true,
    onlineBookable: true,
  },
];

// ─── Membership Tiers ──────────────────────────────────────────────────────
export const membershipTiers = [
  {
    amount: 15000,
    label: "法夏會員",
    benefits: ["享儲值會員優惠價（全品項9.5折）"],
    vouchers: [] as string[],
  },
  {
    amount: 30000,
    label: "黃金會員",
    benefits: ["享儲值會員優惠價（全品項9.5折）", "贈結構訓練一堂（效期90天）"],
    vouchers: ["結構訓練券 × 1"],
  },
  {
    amount: 50000,
    label: "白金會員",
    benefits: ["享儲值會員優惠價（全品項9.5折）", "贈頻率檢測一堂（效期90天）", "贈結構訓練一堂（效期90天）"],
    vouchers: ["頻率檢測券 × 1", "結構訓練券 × 1"],
  },
];

// ─── Monthly Booking Counts (mock — will come from real DB) ────────────────
// Updated monthly; used to sort teachers by popularity on the booking page.
export const monthlyBookingCounts: Record<string, number> = {
  youtong:  18,
  jimbo:    15,
  hanhan:   14,
  shuoyuan: 12,
  daji:     11,
  lily:      6,
  jojo:      4,
  r3:        3,
  atai:     16,
  miffy:    13,
  cindy:    10,
  wenyi:     9,
  yuchen:    0, // staffOnly — not shown
};

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
  bookingHistory: [
    { id: "BK001", date: "2026-06-03", store: "小巨蛋店", teacher: "宥彤", service: "深層筋膜調理 60分", amount: 2200 },
    { id: "BK002", date: "2026-05-17", store: "小巨蛋店", teacher: "宥彤", service: "深層筋膜調理 60分", amount: 2200 },
    { id: "BK003", date: "2026-04-28", store: "大安店", teacher: "韓韓", service: "筋膜結構評估 90分", amount: 2800 },
    { id: "BK004", date: "2026-04-05", store: "小巨蛋店", teacher: "宥彤", service: "深層筋膜調理 60分", amount: 2200 },
    { id: "BK005", date: "2026-03-14", store: "大安店", teacher: "阿鐵", service: "筋膜結構評估 90分", amount: 2800 },
    { id: "BK006", date: "2026-02-22", store: "小巨蛋店", teacher: "Jimbo", service: "深層筋膜調理 60分 + 加購20分", amount: 2800 },
  ] as Array<{ id: string; date: string; store: string; teacher: string; service: string; amount: number }>,
};

// ─── Available Time Slots Generator ────────────────────────────────────────
export function generateTimeSlots(
  date: Date,
  duration: number,
  blockedPeriods?: Array<{ startTime: string; endTime: string }>
): TimeSlot[] {
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

      // Check if slot overlaps with any blocked period
      const slotStartMins = (hour - startHour) * 60 + min;
      const slotEndMins = slotStartMins + duration;
      const isBlockedByEvent = (blockedPeriods || []).some(period => {
        const [bStartH, bStartM] = period.startTime.split(":").map(Number);
        const [bEndH, bEndM] = period.endTime.split(":").map(Number);
        const bStart = (bStartH - startHour) * 60 + bStartM;
        const bEnd = (bEndH - startHour) * 60 + bEndM;
        return slotStartMins < bEnd && slotEndMins > bStart;
      });

      slots.push({
        time: timeStr,
        available: !isUnavailable && !isBlockedByEvent,
      });
    }
  }

  return slots;
}
