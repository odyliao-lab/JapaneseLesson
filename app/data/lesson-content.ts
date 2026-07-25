import { lessons, type Lesson, type StageId } from "./curriculum";

export type VocabularyItem = [japanese: string, reading: string, meaning: string];

export type QuizItem = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  audio?: string;
};

const vocabularyBanks: Record<StageId, VocabularyItem[][]> = {
  beginner: [
    [
      ["あさ", "asa", "早上"], ["ひる", "hiru", "中午"], ["よる", "yoru", "晚上"],
      ["いま", "ima", "現在"], ["きょう", "kyō", "今天"], ["あした", "ashita", "明天"],
      ["きのう", "kinō", "昨天"], ["まいにち", "mainichi", "每天"], ["じかん", "jikan", "時間"],
      ["はん", "han", "半（時間）"],
    ],
    [
      ["がっこう", "gakkō", "學校"], ["きょうしつ", "kyōshitsu", "教室"], ["としょかん", "toshokan", "圖書館"],
      ["せんせい", "sensei", "老師"], ["がくせい", "gakusei", "學生"], ["ともだち", "tomodachi", "朋友"],
      ["ほん", "hon", "書"], ["ノート", "nōto", "筆記本"], ["えんぴつ", "enpitsu", "鉛筆"],
      ["つくえ", "tsukue", "桌子"],
    ],
    [
      ["おはよう", "ohayō", "早安"], ["こんにちは", "konnichiwa", "你好"], ["こんばんは", "konbanwa", "晚安"],
      ["ありがとう", "arigatō", "謝謝"], ["すみません", "sumimasen", "不好意思"], ["はい", "hai", "是"],
      ["いいえ", "iie", "不是"], ["なまえ", "namae", "名字"], ["だれ", "dare", "誰"],
      ["よろしく", "yoroshiku", "請多指教"],
    ],
    [
      ["いく", "iku", "去"], ["くる", "kuru", "來"], ["みる", "miru", "看"],
      ["きく", "kiku", "聽／問"], ["よむ", "yomu", "讀"], ["かく", "kaku", "寫"],
      ["たべる", "taberu", "吃"], ["のむ", "nomu", "喝"], ["はなす", "hanasu", "說"],
      ["べんきょうする", "benkyō suru", "學習"],
    ],
    [
      ["いち", "ichi", "一"], ["に", "ni", "二"], ["さん", "san", "三"],
      ["よん", "yon", "四"], ["ご", "go", "五"], ["ろく", "roku", "六"],
      ["なな", "nana", "七"], ["はち", "hachi", "八"], ["きゅう", "kyū", "九"],
      ["じゅう", "jū", "十"],
    ],
    [
      ["すき", "suki", "喜歡"], ["きらい", "kirai", "討厭"], ["おおきい", "ōkii", "大的"],
      ["ちいさい", "chiisai", "小的"], ["あたらしい", "atarashii", "新的"], ["ふるい", "furui", "舊的"],
      ["いい", "ii", "好的"], ["おもしろい", "omoshiroi", "有趣的"], ["むずかしい", "muzukashii", "困難的"],
      ["やさしい", "yasashii", "簡單／溫柔的"],
    ],
  ],
  intermediate: [
    [
      ["起きる", "okiru", "起床"], ["寝る", "neru", "睡覺"], ["着る", "kiru", "穿"],
      ["洗う", "arau", "洗"], ["作る", "tsukuru", "製作"], ["使う", "tsukau", "使用"],
      ["待つ", "matsu", "等待"], ["持つ", "motsu", "拿／持有"], ["帰る", "kaeru", "回家"],
      ["始める", "hajimeru", "開始"],
    ],
    [
      ["駅", "eki", "車站"], ["電車", "densha", "電車"], ["地下鉄", "chikatetsu", "地下鐵"],
      ["バス", "basu", "公車"], ["切符", "kippu", "車票"], ["出口", "deguchi", "出口"],
      ["入口", "iriguchi", "入口"], ["右", "migi", "右邊"], ["左", "hidari", "左邊"],
      ["まっすぐ", "massugu", "直走"],
    ],
    [
      ["料理", "ryōri", "料理"], ["注文", "chūmon", "點餐"], ["水", "mizu", "水"],
      ["ご飯", "gohan", "飯"], ["野菜", "yasai", "蔬菜"], ["肉", "niku", "肉"],
      ["魚", "sakana", "魚"], ["甘い", "amai", "甜的"], ["辛い", "karai", "辣的"],
      ["おいしい", "oishii", "好吃的"],
    ],
    [
      ["買う", "kau", "買"], ["売る", "uru", "賣"], ["値段", "nedan", "價格"],
      ["安い", "yasui", "便宜的"], ["高い", "takai", "昂貴的"], ["店", "mise", "商店"],
      ["財布", "saifu", "錢包"], ["円", "en", "日圓"], ["全部", "zenbu", "全部"],
      ["いくら", "ikura", "多少錢"],
    ],
    [
      ["家族", "kazoku", "家人"], ["父", "chichi", "父親"], ["母", "haha", "母親"],
      ["兄", "ani", "哥哥"], ["姉", "ane", "姊姊"], ["弟", "otōto", "弟弟"],
      ["妹", "imōto", "妹妹"], ["背が高い", "se ga takai", "個子高"], ["親切", "shinsetsu", "親切"],
      ["元気", "genki", "有精神"],
    ],
    [
      ["予定", "yotei", "預定"], ["週末", "shūmatsu", "週末"], ["旅行", "ryokō", "旅行"],
      ["映画", "eiga", "電影"], ["音楽", "ongaku", "音樂"], ["写真", "shashin", "照片"],
      ["公園", "kōen", "公園"], ["会う", "au", "見面"], ["遊ぶ", "asobu", "玩"],
      ["楽しみ", "tanoshimi", "期待"],
    ],
  ],
  advanced: [
    [
      ["意見", "iken", "意見"], ["理由", "riyū", "理由"], ["説明", "setsumei", "說明"],
      ["報告", "hōkoku", "報告"], ["事実", "jijitsu", "事實"], ["情報", "jōhō", "資訊"],
      ["結果", "kekka", "結果"], ["大切", "taisetsu", "重要"], ["必要", "hitsuyō", "必要"],
      ["考える", "kangaeru", "思考"],
    ],
    [
      ["場合", "baai", "情況"], ["条件", "jōken", "條件"], ["可能性", "kanōsei", "可能性"],
      ["必ず", "kanarazu", "一定"], ["たぶん", "tabun", "大概"], ["もし", "moshi", "如果"],
      ["例えば", "tatoeba", "例如"], ["しかし", "shikashi", "但是"], ["それで", "sorede", "因此"],
      ["つまり", "tsumari", "也就是說"],
    ],
    [
      ["連絡", "renraku", "聯絡"], ["変更", "henkō", "變更"], ["確認", "kakunin", "確認"],
      ["集合", "shūgō", "集合"], ["参加", "sanka", "參加"], ["欠席", "kesseki", "缺席"],
      ["締め切り", "shimekiri", "截止日"], ["都合", "tsugō", "方便／情況"], ["返事", "henji", "回覆"],
      ["知らせる", "shiraseru", "通知"],
    ],
    [
      ["最初", "saisho", "最初"], ["途中", "tochū", "途中"], ["最後", "saigo", "最後"],
      ["以前", "izen", "以前"], ["以後", "igo", "以後"], ["突然", "totsuzen", "突然"],
      ["しばらく", "shibaraku", "一會兒"], ["続く", "tsuzuku", "持續"], ["消える", "kieru", "消失"],
      ["見つかる", "mitsukaru", "被找到"],
    ],
    [
      ["時間", "jikan", "時間"], ["学校", "gakkō", "學校"], ["電車", "densha", "電車"],
      ["友達", "tomodachi", "朋友"], ["勉強", "benkyō", "學習"], ["会話", "kaiwa", "會話"],
      ["新聞", "shinbun", "報紙"], ["図書館", "toshokan", "圖書館"], ["天気", "tenki", "天氣"],
      ["旅行", "ryokō", "旅行"],
    ],
    [
      ["証拠", "shōko", "證據"], ["手がかり", "tegakari", "線索"], ["順番", "junban", "順序"],
      ["比べる", "kuraberu", "比較"], ["選ぶ", "erabu", "選擇"], ["調べる", "shiraberu", "調查"],
      ["分かる", "wakaru", "理解"], ["間違い", "machigai", "錯誤"], ["正しい", "tadashii", "正確的"],
      ["結論", "ketsuron", "結論"],
    ],
  ],
};

const stageAdvice: Record<StageId, string> = {
  beginner: "先讀懂句子的主題，再觀察助詞和句尾。初級階段重點是穩定辨認假名與拍子，不追求速度。",
  intermediate: "先找動詞，再確認時態與て形等連接方式。把句子拆成「誰、在哪裡、做什麼」三部分。",
  advanced: "注意普通形、引用與條件的範圍。閱讀時先標出接續詞，再用一句中文概括每段功能。",
};

const distractorMeanings = ["正在調查車站", "昨天沒有上課", "請給我一杯水", "朋友住在東京"];

function rotate<T>(items: T[], offset: number) {
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function uniqueOptions(correct: string, candidates: string[]) {
  return [correct, ...candidates.filter((item) => item !== correct)].slice(0, 4);
}

export function lessonLevel(day: number) {
  if (day <= 32) return "JLPT N5";
  if (day <= 44) return "N5 → N4";
  return "JLPT N4";
}

export function buildLessonContent(lesson: Lesson) {
  const bankList = vocabularyBanks[lesson.stage];
  const vocabulary = bankList[(lesson.day - 1) % bankList.length];
  const otherLessons = rotate(lessons, lesson.day).filter((item) => item.day !== lesson.day);
  const meaningOptions = uniqueOptions(
    lesson.meaning,
    [...otherLessons.slice(0, 3).map((item) => item.meaning), ...distractorMeanings],
  );
  const readingOptions = uniqueOptions(
    lesson.romaji,
    otherLessons.slice(3, 7).map((item) => item.romaji),
  );
  const level = lessonLevel(lesson.day);
  const quizzes: QuizItem[] = [
    {
      id: "meaning",
      prompt: `「${lesson.clue}」最接近哪個意思？`,
      options: meaningOptions,
      answer: 0,
      explanation: `正解是「${lesson.meaning}」。先抓核心詞，再確認句尾語氣。`,
    },
    {
      id: "reading",
      prompt: "哪一個是今日核心線索的正確讀法？",
      options: readingOptions,
      answer: 0,
      explanation: `正確讀法是 ${lesson.romaji}。`,
      audio: lesson.clue,
    },
    {
      id: "focus",
      prompt: "今天最主要的鑑識重點是什麼？",
      options: uniqueOptions(lesson.focus, ["助詞隨機猜測", "只背中文翻譯", "跳過發音直接結案"]),
      answer: 0,
      explanation: `本案核心是「${lesson.focus}」，練習時要能說明規則並造句。`,
    },
    {
      id: "mission",
      prompt: "哪一項最符合今日獨立搜查任務？",
      options: uniqueOptions(lesson.mission, ["只播放一次語音", "不做筆記直接完成", "改學其他語言"]),
      answer: 0,
      explanation: `今日任務是：${lesson.mission}。`,
    },
    {
      id: "level",
      prompt: "這項線索目前對應哪個能力階段？",
      options: uniqueOptions(level, ["JLPT N3", "JLPT N2", "JLPT N1"]),
      answer: 0,
      explanation: `本課標示為 ${level}，用於掌握 N5 到 N4 的銜接位置。`,
    },
  ];

  return {
    vocabulary,
    quizzes,
    level,
    grammar: {
      title: lesson.focus,
      explanation: `${stageAdvice[lesson.stage]} 本課以「${lesson.clue}」為核心，中文意思是「${lesson.meaning}」。`,
      examples: [
        lesson.clue,
        `まず、${lesson.clue}`,
        `${lesson.clue} もう一度お願いします。`,
      ],
    },
    listeningScript: `${lesson.clue}。もう一度聞いてください。${lesson.clue}。`,
    selfStudy: buildSelfStudy(lesson),
  };
}

function buildSelfStudy(lesson: Lesson) {
  if (lesson.day <= 8) {
    return [
      `將「${lesson.clue}」各抄寫三次，圈出最不熟悉的一個假名。`,
      "以慢速和正常速度各跟讀三次，最後不看文字說一次。",
      "寫下最不熟假名的讀音，並用中文記錄書寫或聽辨時容易出錯的地方。",
      `完成任務：「${lesson.mission}」，再依照下方三個問題留下至少 20 字練習紀錄。`,
    ];
  }

  if (lesson.day <= 12) {
    return [
      `將「${lesson.clue}」各抄寫三次，圈出最需要重練的字。`,
      "以慢速和正常速度各跟讀三次，最後完成一次不看文字的聽寫。",
      "從今天的線索詞彙選一個，抄寫並標出其中新學到的假名。",
      `完成任務：「${lesson.mission}」，再留下至少 20 字練習紀錄。`,
    ];
  }

  if (lesson.day <= 15) {
    return [
      `將「${lesson.clue}」抄寫三次，標出不熟悉的假名或漢字。`,
      "以慢速和正常速度各跟讀三次，最後不看文字說一次。",
      "仿照今天的核心句，依照下方句型提示替換一個詞，不需要從零開始造句。",
      `完成任務：「${lesson.mission}」，並留下至少 20 字搜查筆記。`,
    ];
  }

  return [
    `將「${lesson.clue}」抄寫三次，標出不熟悉的假名或漢字。`,
    "以慢速和正常速度各跟讀三次，最後不看文字說一次。",
    `使用今天的「${lesson.focus}」寫一個自己的例句。`,
    `完成任務：「${lesson.mission}」，並留下至少 20 字搜查筆記。`,
  ];
}

export const badgeCatalog = [
  { id: "first", name: "第一份證詞", threshold: 1, icon: "🔎" },
  { id: "kana", name: "假名鑑識員", threshold: 10, icon: "あ" },
  { id: "rookie", name: "新人結案", threshold: 24, icon: "📘" },
  { id: "analyst", name: "線索分析官", threshold: 44, icon: "🧩" },
  { id: "truth", name: "真相報告員", threshold: 60, icon: "🏆" },
];
