export type StageId = "beginner" | "intermediate" | "advanced";

export type Lesson = {
  day: number;
  stage: StageId;
  title: string;
  clue: string;
  romaji: string;
  meaning: string;
  focus: string;
  mission: string;
};

type LessonSeed = Omit<Lesson, "day" | "stage">;

const beginner: LessonSeed[] = [
  ["「あ行」的第一份證詞", "あ・い・う・え・お", "a・i・u・e・o", "五個母音", "平假名與日語母音", "聽辨並寫出五個母音"],
  ["「か行」藏在置物櫃", "か・き・く・け・こ", "ka・ki・ku・ke・ko", "K 行假名", "清音與拍子", "找到正確的置物櫃標籤"],
  ["「さ行」的聲音指紋", "さ・し・す・せ・そ", "sa・shi・su・se・so", "S 行假名", "し 的特殊讀音", "辨認錄音裡的 し"],
  ["「た行」時間表之謎", "た・ち・つ・て・と", "ta・chi・tsu・te・to", "T 行假名", "ち、つ 的讀音", "完成社團時間表"],
  ["「な行」名字名冊", "な・に・ぬ・ね・の", "na・ni・nu・ne・no", "N 行假名", "假名配對", "讀出五位同學的名字"],
  ["「は行」呼吸線索", "は・ひ・ふ・へ・ほ", "ha・hi・fu・he・ho", "H 行假名", "ふ 的氣音", "找出發音不同的證詞"],
  ["「ま行」地圖標記", "ま・み・む・め・も", "ma・mi・mu・me・mo", "M 行假名", "短詞閱讀", "讀懂校園地圖標記"],
  ["「や・ら・わ行」最後拼圖", "や・ゆ・よ／ら行／わ・を・ん", "ya・yu・yo / ra / wa・o・n", "剩餘平假名", "ん 與助詞 を", "補齊失落的假名拼圖"],
  ["濁音的變聲證詞", "が・ざ・だ・ば・ぱ", "ga・za・da・ba・pa", "濁音與半濁音", "清濁音對比", "比對兩份聲音證詞"],
  ["拗音與促音的暗號", "きゃ・しゅ・ちょ・っ", "kya・shu・cho・small tsu", "拗音與促音", "長短與停頓", "破解小字暗號"],
  ["片假名第一冊", "ア・カ・サ・タ・ナ行", "a / ka / sa / ta / na", "片假名前半", "外來語線索", "圈出飲料單上的外來語"],
  ["片假名第二冊", "ハ・マ・ヤ・ラ・ワ行", "ha / ma / ya / ra / wa", "片假名後半", "長音符號 ー", "讀懂車站廣播看板"],
  ["初次見面的口供", "はじめまして。", "hajimemashite", "初次見面", "招呼與自我介紹", "錄下 20 秒自我介紹"],
  ["姓名與身分檔案", "わたしはリンです。", "watashi wa Rin desu", "我是小凜", "A は B です", "建立自己的日語調查員證"],
  ["這是誰的物品？", "これはだれのですか。", "kore wa dare no desu ka", "這是誰的？", "これ／それ／あれ、の", "找回失物的主人"],
  ["校園位置搜查", "としょかんはどこですか。", "toshokan wa doko desu ka", "圖書館在哪裡？", "ここ／そこ／あそこ", "依指示走到正確地點"],
  ["數字證物 1–100", "さんじゅうに", "sanjū ni", "三十二", "數字與年齡", "核對學生證上的數字"],
  ["時間表的關鍵時刻", "しちじはんです。", "shichiji han desu", "七點半", "時間與星期", "排出一天的時間線"],
  ["存在與位置", "ねこがいます。", "neko ga imasu", "有一隻貓", "あります／います", "描述照片裡的人與物"],
  ["喜好調查問卷", "おんがくがすきです。", "ongaku ga suki desu", "喜歡音樂", "が好き／きらい", "完成班級喜好統計"],
  ["日常行動紀錄", "まいにちべんきょうします。", "mainichi benkyō shimasu", "每天讀書", "ます形肯定句", "寫出三項日常行動"],
  ["不在場時間線", "きのう行きませんでした。", "kinō ikimasen deshita", "昨天沒有去", "ます形四種時態", "還原昨天的行程"],
  ["邀請與回應", "いっしょに行きませんか。", "issho ni ikimasen ka", "要不要一起去？", "ませんか／ましょう", "邀請同伴完成搜查"],
  ["新人搜查員結案", "にほんごがすこしわかります。", "nihongo ga sukoshi wakarimasu", "懂一點日語", "初級統整", "完成第一份語音結案報告"],
].map(([title, clue, romaji, meaning, focus, mission]) => ({ title, clue, romaji, meaning, focus, mission }));

const intermediate: LessonSeed[] = [
  ["動詞家族鑑識", "行く・食べる・する", "iku・taberu・suru", "去、吃、做", "三類動詞", "把 12 個動詞放回正確家族"],
  ["て形變化密碼 I", "書いて・読んで", "kaite・yonde", "寫、讀的て形", "五段動詞て形", "完成變化規則板"],
  ["て形變化密碼 II", "食べて・して・来て", "tabete・shite・kite", "吃、做、來的て形", "一段與不規則動詞", "修復三段缺漏對話"],
  ["請求與指示", "もう一度言ってください。", "mō ichido itte kudasai", "請再說一次", "～てください", "向證人提出三個禮貌請求"],
  ["正在發生的證詞", "雨が降っています。", "ame ga futte imasu", "正在下雨", "～ています", "描述監視畫面中的動作"],
  ["許可與禁止", "ここで写真を撮ってもいいですか。", "koko de shashin o totte mo ii desu ka", "可以在這拍照嗎？", "～てもいい／てはいけない", "標示校園調查規則"],
  ["形容詞鑑識 I", "あたらしいかばん", "atarashii kaban", "新書包", "い形容詞", "描述三件遺失物"],
  ["形容詞鑑識 II", "しずかなへや", "shizuka na heya", "安靜的房間", "な形容詞", "找出最符合證詞的房間"],
  ["形容詞過去檔案", "きのうは寒かったです。", "kinō wa samukatta desu", "昨天很冷", "形容詞時態", "比對昨天與今天的天氣"],
  ["比較調查", "電車のほうが速いです。", "densha no hō ga hayai desu", "電車比較快", "比較級與最高級", "選出最快的移動路線"],
  ["數量與量詞", "本を三冊借りました。", "hon o sansatsu karimashita", "借了三本書", "常用量詞", "核對圖書館借閱紀錄"],
  ["家人與人物描述", "姉はめがねをかけています。", "ane wa megane o kakete imasu", "姊姊戴著眼鏡", "人物特徵與家人", "依描述鎖定照片"],
  ["購物價格線索", "これをください。", "kore o kudasai", "請給我這個", "購物與金額", "在預算內買齊調查用品"],
  ["餐廳點餐證詞", "おすすめは何ですか。", "osusume wa nan desu ka", "推薦什麼？", "點餐與需求", "完成一份禮貌點餐對話"],
  ["交通轉乘任務", "新宿で乗り換えます。", "Shinjuku de norikaemasu", "在新宿轉車", "交通與助詞で／に", "畫出正確轉乘路線"],
  ["經驗紀錄", "日本へ行ったことがあります。", "Nihon e itta koto ga arimasu", "曾去過日本", "～たことがある", "訪問同伴的三項經驗"],
  ["能力檔案", "ひらがなが読めます。", "hiragana ga yomemasu", "會讀平假名", "可能形", "更新自己的能力證物表"],
  ["計畫與意圖", "週末、映画を見るつもりです。", "shūmatsu eiga o miru tsumori desu", "週末打算看電影", "～つもり／予定", "整理週末搜查計畫"],
  ["原因與結果", "雨だから、家にいます。", "ame dakara ie ni imasu", "因為下雨所以在家", "から／ので", "連結四組原因與結果"],
  ["線索分析官結案", "手がかりを順番に説明します。", "tegakari o junban ni setsumei shimasu", "依序說明線索", "中級統整", "完成 60 秒案件說明"],
].map(([title, clue, romaji, meaning, focus, mission]) => ({ title, clue, romaji, meaning, focus, mission }));

const advanced: LessonSeed[] = [
  ["普通形身分切換", "明日、学校へ行く。", "ashita gakkō e iku", "明天去學校", "普通形與禮貌形", "將訪談內容改寫成筆記"],
  ["我想與我希望", "日本で勉強したいです。", "Nihon de benkyō shitai desu", "想在日本學習", "～たい／ほしい", "列出三個學習願望"],
  ["傳聞證詞", "田中さんは来ると言いました。", "Tanaka-san wa kuru to iimashita", "田中說他會來", "引用助詞と", "準確轉述兩份證詞"],
  ["推測與樣態", "雨が降りそうです。", "ame ga furisō desu", "看起來要下雨", "～そう／かもしれない", "為線索標上可信程度"],
  ["如果條件成立", "時間があったら、行きます。", "jikan ga attara ikimasu", "有時間的話就去", "～たら條件句", "設計三條搜查備案"],
  ["一邊進行調查", "音楽を聞きながら歩きます。", "ongaku o kikinagara arukimasu", "邊聽音樂邊走", "～ながら", "描述同時發生的動作"],
  ["之前與之後", "食べる前に手を洗います。", "taberu mae ni te o araimasu", "吃飯前洗手", "前に／後で", "重排事件時間線"],
  ["必須與不必", "宿題をしなければなりません。", "shukudai o shinakereba narimasen", "必須做作業", "義務與免除", "制定調查員守則"],
  ["給予與接受", "友だちが教えてくれました。", "tomodachi ga oshiete kuremashita", "朋友教了我", "あげる／くれる／もらう", "判斷每份幫助的方向"],
  ["關係子句線索", "駅で見つけたかばん", "eki de mitsuketa kaban", "在車站找到的包包", "名詞修飾", "組合精確的證物描述"],
  ["漢字部件鑑識", "時間・学校・電車・友達", "jikan・gakkō・densha・tomodachi", "時間、學校、電車、朋友", "N5–N4 常用漢字", "用部件分類 20 個漢字"],
  ["短篇公告解讀", "本日は休館です。", "honjitsu wa kyūkan desu", "今日休館", "公告與標示閱讀", "從公告找出日期、地點、規則"],
  ["訊息與郵件", "集合時間を変更します。", "shūgō jikan o henkō shimasu", "更改集合時間", "簡短訊息寫作", "寫一封 80 字集合通知"],
  ["短篇故事推理 I", "消えたノート", "kieta nōto", "消失的筆記本", "篇章連接與指示詞", "標出故事中的五條線索"],
  ["短篇故事推理 II", "最後の目撃者", "saigo no mokugekisha", "最後的目擊者", "推論與摘要", "以三句話重建事件"],
  ["真相報告員最終結案", "真相を報告します。", "shinsō o hōkoku shimasu", "報告真相", "N5→N4 綜合任務", "完成 2 分鐘日語結案報告"],
].map(([title, clue, romaji, meaning, focus, mission]) => ({ title, clue, romaji, meaning, focus, mission }));

export const lessons: Lesson[] = [
  ...beginner.map((lesson, index) => ({ ...lesson, day: index + 1, stage: "beginner" as const })),
  ...intermediate.map((lesson, index) => ({ ...lesson, day: index + 25, stage: "intermediate" as const })),
  ...advanced.map((lesson, index) => ({ ...lesson, day: index + 45, stage: "advanced" as const })),
];

export const stages = [
  {
    id: "beginner" as const,
    number: "01",
    label: "BEGINNER CASES",
    title: "新人搜查員",
    days: "24 天",
    range: "DAY 01–24",
    description: "從假名、發音與招呼開始，建立第一套日語線索系統。",
  },
  {
    id: "intermediate" as const,
    number: "02",
    label: "ANALYSIS CASES",
    title: "線索分析官",
    days: "20 天",
    range: "DAY 25–44",
    description: "拆解動詞、て形、形容詞與生活情境，把證詞連成完整句子。",
  },
  {
    id: "advanced" as const,
    number: "03",
    label: "FINAL REPORTS",
    title: "真相報告員",
    days: "16 天",
    range: "DAY 45–60",
    description: "閱讀公告與短篇故事，使用普通形、引用及條件句完成日語報告。",
  },
];

export const lessonFlow = [
  ["案件簡報", "5 分鐘", "先理解今天要破解的任務"],
  ["線索教學", "12 分鐘", "假名、詞彙或漢字核心"],
  ["文法鑑識", "10 分鐘", "拆解句型與使用情境"],
  ["聽力證詞", "10 分鐘", "播放、跟讀與聽辨"],
  ["獨立搜查", "15 分鐘", "自習、筆記與任務練習"],
  ["案件結案", "5 分鐘", "自評並留下今日報告"],
];
