export interface CharacterDef {
  key: string
  name: string
  role: string
  age: string
  personality: string
  appearance: string
  speechStyle: string
  promptDescription: string
  type: 'core' | 'guest'
  triggerTopics?: string[]
}

export const CORE_CHARACTERS: CharacterDef[] = [
  {
    key: 'tanaka',
    name: '田中 太郎',
    role: '宅建業者の営業マン',
    age: '35',
    personality: 'やや強引、自信家、時々グレーなことをする',
    appearance: '紺スーツ・ネクタイ緩め・オールバック',
    speechStyle: '「〜っすよ！」「これはお得ですよ！」断定的',
    promptDescription:
      'Japanese male, age 35, slicked-back black hair, navy blue suit with loosened tie, confident sly grin, slightly pushy demeanor',
    type: 'core',
  },
  {
    key: 'sato',
    name: '佐藤 健一',
    role: '一般消費者・買主',
    age: '28',
    personality: '慎重派、騙されやすい、素直',
    appearance: '緑ポロシャツ・丸顔・柔らかい表情',
    speechStyle: '「え、そうなんですか…」「大丈夫かなぁ」不安げ',
    promptDescription:
      'Japanese male, age 28, round face, soft expression, green polo shirt, casual style, looks easily convinced',
    type: 'core',
  },
  {
    key: 'yamada',
    name: '山田 美咲',
    role: '宅建士・解説役',
    age: '40',
    personality: '知的、頼れる、正義感が強い',
    appearance: 'グレーブレザー・名札バッジ・眼鏡・ショートヘア',
    speechStyle: '「ここがポイントです！」「条文を確認しましょう」明快',
    promptDescription:
      'Japanese female, age 40, short hair, glasses, gray blazer with name badge, confident warm smile, professional',
    type: 'core',
  },
]

export const GUEST_CHARACTERS: CharacterDef[] = [
  {
    key: 'suzuki',
    name: '鈴木 大家',
    role: '地主・貸主・大家',
    age: '60',
    personality: '保守的、土地に執着、頑固だが情がある',
    appearance: '和服風の上着・白髪混じり・恰幅がいい',
    speechStyle: '「わしの土地を…」「昔からこうだった」頑固口調',
    promptDescription:
      'Japanese elderly male, age 60, stocky build, gray hair, traditional Japanese vest over shirt, stern but warm expression',
    type: 'guest',
    triggerTopics: ['賃貸借', '借地借家法', '地上権', '敷金', '相続', '借地権'],
  },
  {
    key: 'nakamura',
    name: '中村 銀行員',
    role: '銀行の融資担当',
    age: '45',
    personality: '堅実、数字に厳しい、冷静',
    appearance: 'ダークスーツ・ネクタイきっちり・四角い眼鏡',
    speechStyle: '「融資の条件ですが」「担保が必要です」事務的',
    promptDescription:
      'Japanese male, age 45, rectangular glasses, dark formal suit with perfectly knotted tie, serious composed expression',
    type: 'guest',
    triggerTopics: ['抵当権', '根抵当権', '住宅ローン', '債権', '保証', '質権'],
  },
  {
    key: 'kuroda',
    name: '黒田 悪徳',
    role: '詐欺師・無免許業者・悪い人',
    age: '年齢不詳',
    personality: '狡猾、口が上手い、人を騙すことに罪悪感なし',
    appearance: '黒いシャツ・サングラス・ニヤリとした笑み',
    speechStyle: '「いい話があるんだけどさ…」「知らなかったなぁ」嘘つき口調',
    promptDescription:
      'Suspicious Japanese male, age unknown, dark shirt, sunglasses, sly smirk, shady mysterious appearance',
    type: 'guest',
    triggerTopics: ['詐欺', '通謀虚偽表示', '心裡留保', '強迫', '錯誤', '公序良俗違反', '無免許営業'],
  },
  {
    key: 'kimura',
    name: '木村 主事',
    role: '市役所 都市計画課の職員',
    age: '50',
    personality: '堅い、規則遵守、親切だが融通が利かない',
    appearance: 'ワイシャツ・腕まくり・名札・市役所の書類を持つ',
    speechStyle: '「条例により…」「許可が必要です」公務員口調',
    promptDescription:
      'Japanese male government worker, age 50, white dress shirt with rolled sleeves, name tag, holding documents, formal but approachable',
    type: 'guest',
    triggerTopics: ['都市計画法', '建築基準法', '建ぺい率', '容積率', '用途地域', '開発許可', '農地法', '国土利用計画法', '宅地造成規制法'],
  },
  {
    key: 'takahashi',
    name: '高橋 税理士',
    role: '税務アドバイザー',
    age: '55',
    personality: '穏やか、計算が速い、節税に詳しい',
    appearance: 'ベージュジャケット・電卓を持つ・柔和な表情',
    speechStyle: '「税額を計算しますと…」「特例が使えますよ」丁寧',
    promptDescription:
      'Japanese male, age 55, beige jacket, holding a calculator, gentle warm expression, accountant appearance',
    type: 'guest',
    triggerTopics: ['不動産取得税', '固定資産税', '所得税', '登録免許税', '印紙税', '贈与税', '住宅ローン控除', '譲渡所得', '地価公示'],
  },
]

export const ALL_CHARACTERS = [...CORE_CHARACTERS, ...GUEST_CHARACTERS]

export function getCharacterByKey(key: string): CharacterDef | undefined {
  return ALL_CHARACTERS.find((c) => c.key === key)
}

export function castGuestCharacters(topicName: string): CharacterDef[] {
  const matched = GUEST_CHARACTERS.filter((g) =>
    g.triggerTopics?.some((t) => topicName.includes(t))
  )
  return matched.slice(0, 2)
}
