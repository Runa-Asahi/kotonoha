export type Kana = {
  hira: string;
  kata: string;
  romaji: string;
  row: string;
  shot: string;
  mouth: string;
};

export type Voiced = {
  hira: string;
  kata: string;
  romaji: string;
  base: string;
  kind: "dakuten" | "handakuten";
  note?: string;
};

function k(
  hira: string,
  kata: string,
  romaji: string,
  row: string,
  mouth: string,
  shot: string,
): Kana {
  return { hira, kata, romaji, row, mouth, shot };
}

export const GOJUON: Kana[] = [
  k("あ", "ア", "a", "あ", "口张大", "一个人张开嘴坐在灯前。字形就是那张打开的口，读 a。"),
  k("い", "イ", "i", "あ", "嘴角拉开", "两根灯芯并排站着。嘴角向两边拉开，读 i。"),
  k("う", "ウ", "u", "あ", "嘴唇收圆", "上面一弯是收圆的嘴唇，下面是缩小的灯焰，读 u。"),
  k("え", "エ", "e", "あ", "口半开", "她在巷口回头，肩膀的折线像这个字，读 e。"),
  k("お", "オ", "o", "あ", "圆唇", "圆灯压在河的横线上，整座町的轮廓，读 o。"),
  k("か", "カ", "ka", "か", "舌根轻抵", "刀从左上切进纸灯，清脆的一声，读 ka。"),
  k("き", "キ", "ki", "か", "舌面贴硬腭", "钥匙插进灯座，齿痕左右错开，读 ki。"),
  k("く", "ク", "ku", "か", "舌根抬起", "灯罩被撞出一个缺口，嘴角也弯成这个形，读 ku。"),
  k("け", "ケ", "ke", "か", "舌根再送气", "格子窗裂开一角，她敲了敲，读 ke。"),
  k("こ", "コ", "ko", "か", "圆唇后送气", "两只弯钩小灯碰在一起，读 ko。"),
  k("さ", "サ", "sa", "さ", "齿间送气", "她在灯纸上斜着起笔，像写下一个 sa。"),
  k("し", "シ", "shi", "さ", "舌面近齿龈", "一根钩子钓起灯笼。气从齿间挤出，读 shi。"),
  k("す", "ス", "su", "さ", "舌尖近齿", "曲线绕着灯转完，结尾那一点是火星，读 su。"),
  k("せ", "セ", "se", "さ", "齿间再送气", "一张座位挡在灯前，读 se。"),
  k("そ", "ソ", "so", "さ", "舌尖送气", "丝线把两盏灯缠成之字，读 so。"),
  k("た", "タ", "ta", "た", "舌尖弹开", "十字灯架再加一横，脚步落下，读 ta。"),
  k("ち", "チ", "chi", "た", "舌尖贴上再弹", "灯焰扭出急弯。舌尖贴住齿龈再放开，读 chi。"),
  k("つ", "ツ", "tsu", "た", "舌尖轻弹", "一波灯火加上一点星光。舌尖短促一弹，读 tsu。"),
  k("て", "テ", "te", "た", "舌尖抵齿", "手伸出去扶住灯，读 te。"),
  k("と", "ト", "to", "た", "舌尖再弹", "灯柱上挑出一只钩，读 to。"),
  k("な", "ナ", "na", "な", "舌尖抵齿龈", "左边是她，右边是灯，并肩站着，读 na。"),
  k("に", "ニ", "ni", "な", "舌面贴上", "两滴烛泪并排落下，读 ni。"),
  k("ぬ", "ヌ", "nu", "な", "舌尖抵住", "曲线把灯缠住，平假名里最绕的一笔，读 nu。"),
  k("ね", "ネ", "ne", "な", "舌尖抵住", "她跪下去捡灯。和ぬ很像，但第一笔更弯，像猫的 ne。"),
  k("の", "ノ", "no", "な", "舌尖轻触", "灯焰转成一个涡，嘴唇也是圆的，读 no。"),
  k("は", "ハ", "ha", "は", "喉间轻送", "河面上灯的倒影分成两笔，气从喉里轻轻送出，读 ha。"),
  k("ひ", "ヒ", "hi", "は", "舌面送气", "笑起来的眼睛弯成一笔，读 hi。"),
  k("ふ", "フ", "fu", "は", "上齿轻咬下唇", "灯快灭了，只剩一点。上齿轻咬下唇再吹气，读 fu。"),
  k("へ", "ヘ", "he", "は", "口半开送气", "远山只剩一条棱，她往上指，读 he。"),
  k("ほ", "ホ", "ho", "は", "圆唇送气", "灯罩四条骨，火在里面，读 ho。"),
  k("ま", "マ", "ma", "ま", "双唇闭上", "两横夹着一竖，像把灯横过来罩住，双唇闭上再开，读 ma。"),
  k("み", "ミ", "mi", "ま", "双唇再开", "三道弧光从灯里飘出来，读 mi。"),
  k("む", "ム", "mu", "ま", "双唇闭合", "她把灯抱进怀里，笔画收到一起，读 mu。"),
  k("め", "メ", "me", "ま", "双唇微开", "眼睛里映着灯，眼尾那一挑，读 me。"),
  k("も", "モ", "mo", "ま", "双唇再闭", "两只鱼钩叠在一起，读 mo。和よ不同，も更圆。"),
  k("や", "ヤ", "ya", "や", "舌面近腭", "箭头灯指向夜市，读 ya。"),
  k("ゆ", "ユ", "yu", "や", "圆唇舌面", "热水壶的蒸汽弯成这个形，读 yu。"),
  k("よ", "ヨ", "yo", "や", "舌面圆唇", "钩子把灯勾住。不要和ま弄混，よ是钩不是横，读 yo。"),
  k("ら", "ラ", "ra", "ら", "舌尖轻弹", "灯转了半圈留下的痕迹。舌尖轻弹，不要发成英文 r，读 ra。"),
  k("り", "リ", "ri", "ら", "舌尖轻弹", "一个人笔直地站在灯旁，读 ri。"),
  k("る", "ル", "ru", "ら", "舌尖轻弹", "回路绕着灯转完才停，读 ru。"),
  k("れ", "レ", "re", "ら", "舌尖轻弹", "一个人跪着，裙摆拖在后面，读 re。"),
  k("ろ", "ロ", "ro", "ら", "舌尖轻弹", "方灯还缺一条边，读 ro。"),
  k("わ", "ワ", "wa", "わ", "双唇再圆", "她把灯抱成一个开口的圈，读 wa。"),
  k("を", "ヲ", "o", "わ", "圆唇", "同一只圈，尾巴还勾着一盏没灭的灯。作助词时读 o，不读 wo。"),
  k("ん", "ン", "n", "ん", "鼻音，嘴不大张", "灯芯最后一点。气流从鼻子走，嘴不张开，读 n。"),
];

const byHira = Object.fromEntries(GOJUON.map((item) => [item.hira, item]));

function rowOf(cells: (string | null)[]): (Kana | null)[] {
  return cells.map((cell) => (cell ? byHira[cell] : null));
}

export const KANA_GRID: (Kana | null)[][] = [
  rowOf(["あ", "い", "う", "え", "お"]),
  rowOf(["か", "き", "く", "け", "こ"]),
  rowOf(["さ", "し", "す", "せ", "そ"]),
  rowOf(["た", "ち", "つ", "て", "と"]),
  rowOf(["な", "に", "ぬ", "ね", "の"]),
  rowOf(["は", "ひ", "ふ", "へ", "ほ"]),
  rowOf(["ま", "み", "む", "め", "も"]),
  rowOf(["や", null, "ゆ", null, "よ"]),
  rowOf(["ら", "り", "る", "れ", "ろ"]),
  rowOf(["わ", null, null, null, "を"]),
  rowOf(["ん", null, null, null, null]),
];

export const ROW_LABELS = ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ", "ん"];

function v(
  hira: string,
  kata: string,
  romaji: string,
  base: string,
  kind: Voiced["kind"],
  note?: string,
): Voiced {
  return { hira, kata, romaji, base, kind, note };
}

export const VOICED: Voiced[] = [
  v("が", "ガ", "ga", "か", "dakuten"),
  v("ぎ", "ギ", "gi", "き", "dakuten"),
  v("ぐ", "グ", "gu", "く", "dakuten"),
  v("げ", "ゲ", "ge", "け", "dakuten"),
  v("ご", "ゴ", "go", "こ", "dakuten"),
  v("ざ", "ザ", "za", "さ", "dakuten"),
  v("じ", "ジ", "ji", "し", "dakuten"),
  v("ず", "ズ", "zu", "す", "dakuten"),
  v("ぜ", "ゼ", "ze", "せ", "dakuten"),
  v("ぞ", "ゾ", "zo", "そ", "dakuten"),
  v("だ", "ダ", "da", "た", "dakuten"),
  v("ぢ", "ヂ", "ji", "ち", "dakuten", "和じ同音。连浊时出现，如ちぢむ。"),
  v("づ", "ヅ", "zu", "つ", "dakuten", "和ず同音。连浊时出现，如つづく。"),
  v("で", "デ", "de", "て", "dakuten"),
  v("ど", "ド", "do", "と", "dakuten"),
  v("ば", "バ", "ba", "は", "dakuten"),
  v("び", "ビ", "bi", "ひ", "dakuten"),
  v("ぶ", "ブ", "bu", "ふ", "dakuten"),
  v("べ", "ベ", "be", "へ", "dakuten"),
  v("ぼ", "ボ", "bo", "ほ", "dakuten"),
  v("ぱ", "パ", "pa", "は", "handakuten"),
  v("ぴ", "ピ", "pi", "ひ", "handakuten"),
  v("ぷ", "プ", "pu", "ふ", "handakuten"),
  v("ぺ", "ペ", "pe", "へ", "handakuten"),
  v("ぽ", "ポ", "po", "ほ", "handakuten"),
];

export const VOICED_GRID: Voiced[][] = [
  VOICED.slice(0, 5),
  VOICED.slice(5, 10),
  VOICED.slice(10, 15),
  VOICED.slice(15, 20),
  VOICED.slice(20, 25),
];

const KATA: Record<string, string> = {};
for (const item of GOJUON) KATA[item.hira] = item.kata;
for (const item of VOICED) KATA[item.hira] = item.kata;
KATA["ゃ"] = "ャ";
KATA["ゅ"] = "ュ";
KATA["ょ"] = "ョ";

export type Yoon = { hira: string; kata: string; romaji: string };

const YOON_BASE: { k: string; y: [string, string][] }[] = [
  { k: "き", y: [["ゃ", "kya"], ["ゅ", "kyu"], ["ょ", "kyo"]] },
  { k: "ぎ", y: [["ゃ", "gya"], ["ゅ", "gyu"], ["ょ", "gyo"]] },
  { k: "し", y: [["ゃ", "sha"], ["ゅ", "shu"], ["ょ", "sho"]] },
  { k: "じ", y: [["ゃ", "ja"], ["ゅ", "ju"], ["ょ", "jo"]] },
  { k: "ち", y: [["ゃ", "cha"], ["ゅ", "chu"], ["ょ", "cho"]] },
  { k: "に", y: [["ゃ", "nya"], ["ゅ", "nyu"], ["ょ", "nyo"]] },
  { k: "ひ", y: [["ゃ", "hya"], ["ゅ", "hyu"], ["ょ", "hyo"]] },
  { k: "び", y: [["ゃ", "bya"], ["ゅ", "byu"], ["ょ", "byo"]] },
  { k: "ぴ", y: [["ゃ", "pya"], ["ゅ", "pyu"], ["ょ", "pyo"]] },
  { k: "み", y: [["ゃ", "mya"], ["ゅ", "myu"], ["ょ", "myo"]] },
  { k: "り", y: [["ゃ", "rya"], ["ゅ", "ryu"], ["ょ", "ryo"]] },
];

export const YOON: Yoon[][] = YOON_BASE.map((group) =>
  group.y.map(([small, romaji]) => {
    const hira = group.k + small;
    const kata = (KATA[group.k] ?? "") + (KATA[small] ?? "");
    return { hira, kata, romaji };
  }),
);

export function kanaByHira(hira: string): Kana | undefined {
  return byHira[hira];
}
