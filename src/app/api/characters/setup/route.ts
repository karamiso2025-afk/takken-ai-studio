import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server'
import { ALL_CHARACTERS, CharacterDef } from '@/lib/characters'
import { generateCharacterSheet } from '@/lib/gemini/generate-image'

export const maxDuration = 60

// SVGでキャラクターシートを生成（外部API不要）
function generateSvgCharacterSheet(char: CharacterDef): string {
  const colors: Record<string, { body: string; face: string; accent: string; hair: string }> = {
    tanaka:    { body: '#1A237E', face: '#FFCC80', accent: '#FF8F00', hair: '#212121' },
    sato:      { body: '#2E7D32', face: '#FFCC80', accent: '#388E3C', hair: '#4E342E' },
    yamada:    { body: '#78909C', face: '#FFE0B2', accent: '#1565C0', hair: '#4E342E' },
    narrator:  { body: '#424242', face: '#FFCC80', accent: '#757575', hair: '#212121' },
    suzuki:    { body: '#5D4037', face: '#F0C070', accent: '#F9A825', hair: '#B0BEC5' },
    nakamura:  { body: '#1A237E', face: '#FFCC80', accent: '#546E7A', hair: '#212121' },
    kuroda:    { body: '#212121', face: '#FFCC80', accent: '#C62828', hair: '#212121' },
    kimura:    { body: '#EEEEEE', face: '#FFCC80', accent: '#00695C', hair: '#4E342E' },
    takahashi: { body: '#F5F0E8', face: '#FFCC80', accent: '#6A1B9A', hair: '#795548' },
  }
  const c = colors[char.key] ?? { body: '#9E9E9E', face: '#FFCC80', accent: '#616161', hair: '#212121' }
  const firstName = char.name.split(' ')[0]
  const role = char.role

  let illustration = ''

  switch (char.key) {
    case 'tanaka': // 35歳・営業マン・オールバック・ネクタイ
      illustration = `
        <rect x="105" y="230" width="90" height="120" rx="8" fill="${c.body}"/>
        <rect x="133" y="228" width="34" height="55" fill="white"/>
        <polygon points="143,228 157,228 154,268 150,274 146,268" fill="#C62828"/>
        <polygon points="105,230 133,228 128,268 108,258" fill="${c.body}"/>
        <polygon points="167,228 195,230 192,258 172,268" fill="${c.body}"/>
        <rect x="136" y="210" width="28" height="23" fill="${c.face}"/>
        <ellipse cx="150" cy="170" rx="50" ry="53" fill="${c.face}"/>
        <ellipse cx="150" cy="120" rx="50" ry="16" fill="${c.hair}"/>
        <rect x="100" y="118" width="18" height="50" rx="9" fill="${c.hair}"/>
        <rect x="182" y="118" width="18" height="50" rx="9" fill="${c.hair}"/>
        <ellipse cx="99" cy="170" rx="9" ry="12" fill="${c.face}"/>
        <ellipse cx="201" cy="170" rx="9" ry="12" fill="${c.face}"/>
        <ellipse cx="132" cy="168" rx="8" ry="8" fill="white"/>
        <ellipse cx="168" cy="168" rx="8" ry="8" fill="white"/>
        <circle cx="134" cy="169" r="5" fill="#1A237E"/>
        <circle cx="170" cy="169" r="5" fill="#1A237E"/>
        <circle cx="136" cy="167" r="1.5" fill="white"/>
        <circle cx="172" cy="167" r="1.5" fill="white"/>
        <path d="M121 153 Q131 148 141 151" stroke="${c.hair}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M159 151 Q169 148 179 153" stroke="${c.hair}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M148 178 Q150 185 152 178" stroke="#FFAB40" stroke-width="1.5" fill="none"/>
        <path d="M135 192 Q151 203 166 194" stroke="#E57373" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      `
      break

    case 'sato': // 28歳・丸顔・カジュアル・不安顔
      illustration = `
        <rect x="108" y="232" width="84" height="118" rx="12" fill="${c.body}"/>
        <rect x="136" y="210" width="28" height="25" fill="${c.face}"/>
        <ellipse cx="150" cy="172" rx="58" ry="60" fill="${c.face}"/>
        <ellipse cx="103" cy="185" rx="13" ry="10" fill="#FFAB40" opacity="0.25"/>
        <ellipse cx="197" cy="185" rx="13" ry="10" fill="#FFAB40" opacity="0.25"/>
        <ellipse cx="150" cy="118" rx="56" ry="20" fill="${c.hair}"/>
        <rect x="94" y="116" width="22" height="56" rx="11" fill="${c.hair}"/>
        <rect x="184" y="116" width="22" height="56" rx="11" fill="${c.hair}"/>
        <ellipse cx="152" cy="104" rx="18" ry="14" fill="${c.hair}"/>
        <ellipse cx="133" cy="105" rx="10" ry="12" fill="${c.hair}"/>
        <ellipse cx="132" cy="170" rx="9" ry="10" fill="white" stroke="#BDBDBD" stroke-width="1"/>
        <ellipse cx="168" cy="170" rx="9" ry="10" fill="white" stroke="#BDBDBD" stroke-width="1"/>
        <circle cx="133" cy="171" r="6" fill="#3E2723"/>
        <circle cx="169" cy="171" r="6" fill="#3E2723"/>
        <circle cx="135" cy="169" r="2" fill="white"/>
        <circle cx="171" cy="169" r="2" fill="white"/>
        <path d="M122 158 Q131 161 140 158" stroke="${c.hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M160 158 Q169 161 178 158" stroke="${c.hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M148 182 Q150 190 152 182" stroke="#FFAB40" stroke-width="1.5" fill="none"/>
        <path d="M136 198 Q150 195 164 198" stroke="#C0866A" stroke-width="2" fill="none" stroke-linecap="round"/>
      `
      break

    case 'yamada': // 40歳・女性・ボブ・眼鏡・ブレザー
      illustration = `
        <rect x="105" y="230" width="90" height="120" rx="8" fill="${c.body}"/>
        <rect x="134" y="228" width="32" height="50" fill="white"/>
        <polygon points="105,232 134,228 128,272 108,260" fill="${c.body}"/>
        <polygon points="166,228 195,232 192,260 172,272" fill="${c.body}"/>
        <rect x="118" y="244" width="26" height="18" rx="3" fill="white" stroke="${c.accent}" stroke-width="1.5"/>
        <line x1="121" y1="251" x2="141" y2="251" stroke="${c.accent}" stroke-width="1"/>
        <line x1="121" y1="257" x2="137" y2="257" stroke="${c.accent}" stroke-width="1"/>
        <rect x="137" y="210" width="26" height="23" fill="${c.face}"/>
        <ellipse cx="150" cy="170" rx="48" ry="53" fill="${c.face}"/>
        <ellipse cx="101" cy="170" rx="8" ry="10" fill="${c.face}"/>
        <ellipse cx="199" cy="170" rx="8" ry="10" fill="${c.face}"/>
        <ellipse cx="150" cy="120" rx="50" ry="20" fill="${c.hair}"/>
        <path d="M100,128 L96,200 Q98,220 113,222 L122,192 L106,132 Z" fill="${c.hair}"/>
        <path d="M200,128 L204,200 Q202,220 187,222 L178,192 L194,132 Z" fill="${c.hair}"/>
        <ellipse cx="150" cy="138" rx="49" ry="28" fill="${c.hair}"/>
        <path d="M123 159 L124 153" stroke="${c.hair}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M127 157 L128 151" stroke="${c.hair}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M131 156 L132 150" stroke="${c.hair}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M135 156 L136 150" stroke="${c.hair}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M140 157 L141 151" stroke="${c.hair}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M160 156 L160 150" stroke="${c.hair}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M164 156 L165 150" stroke="${c.hair}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M168 156 L169 150" stroke="${c.hair}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M172 157 L173 151" stroke="${c.hair}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M176 158 L178 153" stroke="${c.hair}" stroke-width="1.5" stroke-linecap="round"/>
        <ellipse cx="132" cy="168" rx="9" ry="9" fill="white" stroke="#BDBDBD" stroke-width="1"/>
        <ellipse cx="168" cy="168" rx="9" ry="9" fill="white" stroke="#BDBDBD" stroke-width="1"/>
        <circle cx="133" cy="169" r="5.5" fill="#4A148C"/>
        <circle cx="169" cy="169" r="5.5" fill="#4A148C"/>
        <circle cx="135" cy="167" r="1.5" fill="white"/>
        <circle cx="171" cy="167" r="1.5" fill="white"/>
        <rect x="121" y="162" width="22" height="13" rx="3" fill="none" stroke="${c.accent}" stroke-width="2"/>
        <rect x="157" y="162" width="22" height="13" rx="3" fill="none" stroke="${c.accent}" stroke-width="2"/>
        <line x1="143" y1="168" x2="157" y2="168" stroke="${c.accent}" stroke-width="2"/>
        <line x1="121" y1="168" x2="113" y2="165" stroke="${c.accent}" stroke-width="1.5"/>
        <line x1="179" y1="168" x2="187" y2="165" stroke="${c.accent}" stroke-width="1.5"/>
        <path d="M122 154 Q131 149 141 152" stroke="${c.hair}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M159 152 Q168 149 178 154" stroke="${c.hair}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M148 178 Q150 184 152 178" stroke="#FFAB40" stroke-width="1.5" fill="none"/>
        <path d="M136 192 Q150 202 164 192" stroke="#E57373" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      `
      break

    case 'suzuki': // 60歳・太め・白髪・地主
      illustration = `
        <rect x="85" y="225" width="130" height="125" rx="12" fill="${c.body}"/>
        <rect x="98" y="225" width="104" height="70" rx="6" fill="#EFEBE9"/>
        <rect x="85" y="225" width="130" height="125" rx="12" fill="${c.body}" opacity="0.6"/>
        <rect x="134" y="207" width="32" height="22" fill="${c.face}"/>
        <ellipse cx="150" cy="166" rx="57" ry="60" fill="${c.face}"/>
        <ellipse cx="93" cy="166" rx="12" ry="15" fill="${c.face}"/>
        <ellipse cx="207" cy="166" rx="12" ry="15" fill="${c.face}"/>
        <ellipse cx="95" cy="136" rx="22" ry="28" fill="${c.hair}"/>
        <ellipse cx="205" cy="136" rx="22" ry="28" fill="${c.hair}"/>
        <path d="M116 112 Q150 104 184 112" stroke="${c.hair}" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M122 106 Q150 99 178 106" stroke="${c.hair}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <ellipse cx="130" cy="164" rx="10" ry="8" fill="white" stroke="#BDBDBD" stroke-width="1"/>
        <ellipse cx="170" cy="164" rx="10" ry="8" fill="white" stroke="#BDBDBD" stroke-width="1"/>
        <circle cx="131" cy="164" r="5" fill="#5D4037"/>
        <circle cx="171" cy="164" r="5" fill="#5D4037"/>
        <circle cx="133" cy="162" r="1.5" fill="white"/>
        <circle cx="173" cy="162" r="1.5" fill="white"/>
        <path d="M118 158 Q113 161 117 167" stroke="#D4A77A" stroke-width="1.2" fill="none"/>
        <path d="M182 158 Q187 161 183 167" stroke="#D4A77A" stroke-width="1.2" fill="none"/>
        <path d="M128 138 Q150 133 172 138" stroke="#D4A77A" stroke-width="1" fill="none"/>
        <path d="M118 149 Q129 144 141 148" stroke="#90A4AE" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M159 148 Q171 144 182 149" stroke="#90A4AE" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M144 180 Q150 190 156 180" stroke="#E8A878" stroke-width="2" fill="none"/>
        <path d="M134 198 Q150 193 166 198" stroke="#C0866A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="150" cy="203" rx="20" ry="7" fill="#B0BEC5" opacity="0.2"/>
      `
      break

    case 'nakamura': // 45歳・銀行員・太フレーム眼鏡・きっちりネクタイ
      illustration = `
        <rect x="105" y="230" width="90" height="120" rx="8" fill="${c.body}"/>
        <rect x="134" y="228" width="32" height="55" fill="white"/>
        <polygon points="143,228 157,228 154,268 150,274 146,268" fill="#1565C0"/>
        <polygon points="105,230 134,228 129,268 108,260" fill="${c.body}"/>
        <polygon points="166,228 195,230 192,260 171,268" fill="${c.body}"/>
        <rect x="136" y="210" width="28" height="23" fill="${c.face}"/>
        <ellipse cx="150" cy="170" rx="50" ry="53" fill="${c.face}"/>
        <ellipse cx="99" cy="170" rx="9" ry="12" fill="${c.face}"/>
        <ellipse cx="201" cy="170" rx="9" ry="12" fill="${c.face}"/>
        <ellipse cx="150" cy="122" rx="50" ry="20" fill="${c.hair}"/>
        <rect x="100" y="120" width="20" height="47" rx="9" fill="${c.hair}"/>
        <rect x="180" y="120" width="20" height="47" rx="9" fill="${c.hair}"/>
        <path d="M118 117 L118 148" stroke="${c.face}" stroke-width="3"/>
        <rect x="116" y="159" width="30" height="18" rx="2" fill="none" stroke="${c.accent}" stroke-width="3.5"/>
        <rect x="154" y="159" width="30" height="18" rx="2" fill="none" stroke="${c.accent}" stroke-width="3.5"/>
        <line x1="146" y1="167" x2="154" y2="167" stroke="${c.accent}" stroke-width="3"/>
        <line x1="116" y1="167" x2="107" y2="164" stroke="${c.accent}" stroke-width="2.5"/>
        <line x1="184" y1="167" x2="193" y2="164" stroke="${c.accent}" stroke-width="2.5"/>
        <circle cx="131" cy="168" r="5" fill="#263238"/>
        <circle cx="169" cy="168" r="5" fill="#263238"/>
        <circle cx="133" cy="166" r="1.5" fill="white"/>
        <circle cx="171" cy="166" r="1.5" fill="white"/>
        <line x1="121" y1="153" x2="141" y2="153" stroke="${c.hair}" stroke-width="2.5"/>
        <line x1="159" y1="153" x2="179" y2="153" stroke="${c.hair}" stroke-width="2.5"/>
        <path d="M148 178 Q150 185 152 178" stroke="#FFAB40" stroke-width="1.5" fill="none"/>
        <line x1="138" y1="193" x2="162" y2="193" stroke="#C0866A" stroke-width="2" stroke-linecap="round"/>
      `
      break

    case 'kuroda': // 詐欺師・大きなサングラス・スパイク・黒
      illustration = `
        <rect x="105" y="230" width="90" height="120" rx="8" fill="${c.body}"/>
        <polygon points="138,228 162,228 158,262 150,270 142,262" fill="#1A1A1A"/>
        <rect x="136" y="210" width="28" height="23" fill="${c.face}"/>
        <ellipse cx="150" cy="170" rx="50" ry="52" fill="${c.face}"/>
        <ellipse cx="99" cy="170" rx="9" ry="12" fill="${c.face}"/>
        <ellipse cx="201" cy="170" rx="9" ry="12" fill="${c.face}"/>
        <ellipse cx="150" cy="120" rx="52" ry="18" fill="${c.hair}"/>
        <rect x="98" y="118" width="20" height="48" rx="9" fill="${c.hair}"/>
        <rect x="182" y="118" width="20" height="48" rx="9" fill="${c.hair}"/>
        <polygon points="128,118 123,96 133,114" fill="${c.hair}"/>
        <polygon points="150,116 148,94 153,113" fill="${c.hair}"/>
        <polygon points="172,118 167,96 177,114" fill="${c.hair}"/>
        <rect x="112" y="156" width="36" height="22" rx="6" fill="#1A1A1A"/>
        <rect x="152" y="156" width="36" height="22" rx="6" fill="#1A1A1A"/>
        <line x1="148" y1="165" x2="152" y2="165" stroke="#333" stroke-width="3"/>
        <line x1="112" y1="165" x2="103" y2="162" stroke="#333" stroke-width="2"/>
        <line x1="188" y1="165" x2="197" y2="162" stroke="#333" stroke-width="2"/>
        <path d="M113 152 Q127 146 143 151" stroke="${c.hair}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M157 151 Q173 146 187 152" stroke="${c.hair}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M148 182 Q150 190 152 182" stroke="#FFAB40" stroke-width="1.5" fill="none"/>
        <path d="M133 196 Q149 208 166 197" stroke="#E57373" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="150" cy="202" rx="22" ry="8" fill="#424242" opacity="0.3"/>
      `
      break

    case 'kimura': // 50歳・市役所・丸眼鏡・名札・ワイシャツ
      illustration = `
        <rect x="105" y="230" width="90" height="120" rx="8" fill="${c.body}"/>
        <polygon points="140,228 150,238 160,228 157,228 150,233 143,228" fill="white"/>
        <rect x="154" y="240" width="24" height="17" rx="2" fill="white" stroke="#B0BEC5" stroke-width="1"/>
        <line x1="163" y1="240" x2="163" y2="257" stroke="#1565C0" stroke-width="2" stroke-linecap="round"/>
        <rect x="119" y="244" width="28" height="20" rx="3" fill="white" stroke="${c.accent}" stroke-width="1.5"/>
        <line x1="122" y1="251" x2="144" y2="251" stroke="${c.accent}" stroke-width="1"/>
        <line x1="122" y1="257" x2="138" y2="257" stroke="${c.accent}" stroke-width="1"/>
        <rect x="136" y="210" width="28" height="23" fill="${c.face}"/>
        <ellipse cx="150" cy="170" rx="50" ry="53" fill="${c.face}"/>
        <ellipse cx="99" cy="170" rx="9" ry="12" fill="${c.face}"/>
        <ellipse cx="201" cy="170" rx="9" ry="12" fill="${c.face}"/>
        <ellipse cx="150" cy="122" rx="50" ry="20" fill="${c.hair}"/>
        <rect x="100" y="120" width="20" height="47" rx="9" fill="${c.hair}"/>
        <rect x="180" y="120" width="20" height="47" rx="9" fill="${c.hair}"/>
        <circle cx="131" cy="168" r="15" fill="none" stroke="${c.accent}" stroke-width="2.5"/>
        <circle cx="169" cy="168" r="15" fill="none" stroke="${c.accent}" stroke-width="2.5"/>
        <line x1="146" y1="168" x2="154" y2="168" stroke="${c.accent}" stroke-width="2"/>
        <line x1="116" y1="168" x2="107" y2="165" stroke="${c.accent}" stroke-width="1.5"/>
        <line x1="184" y1="168" x2="193" y2="165" stroke="${c.accent}" stroke-width="1.5"/>
        <circle cx="131" cy="168" r="5" fill="#3E2723"/>
        <circle cx="169" cy="168" r="5" fill="#3E2723"/>
        <circle cx="133" cy="166" r="1.5" fill="white"/>
        <circle cx="171" cy="166" r="1.5" fill="white"/>
        <path d="M122 156 Q132 152 142 156" stroke="${c.hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M158 156 Q168 152 178 156" stroke="${c.hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M148 178 Q150 185 152 178" stroke="#FFAB40" stroke-width="1.5" fill="none"/>
        <path d="M137 192 Q150 200 163 192" stroke="#E57373" stroke-width="2" fill="none" stroke-linecap="round"/>
      `
      break

    case 'takahashi': // 55歳・税理士・電卓・ベージュ・薄毛
      illustration = `
        <rect x="105" y="230" width="90" height="120" rx="8" fill="${c.body}"/>
        <rect x="134" y="228" width="32" height="45" fill="white"/>
        <polygon points="105,232 134,228 129,262 108,252" fill="${c.body}"/>
        <polygon points="166,228 195,232 192,252 171,262" fill="${c.body}"/>
        <rect x="166" y="286" width="24" height="34" rx="3" fill="#546E7A"/>
        <rect x="169" y="289" width="18" height="9" rx="1" fill="#B0BEC5"/>
        <circle cx="172" cy="305" r="2.2" fill="#90A4AE"/>
        <circle cx="178" cy="305" r="2.2" fill="#90A4AE"/>
        <circle cx="184" cy="305" r="2.2" fill="#90A4AE"/>
        <circle cx="172" cy="312" r="2.2" fill="#90A4AE"/>
        <circle cx="178" cy="312" r="2.2" fill="#90A4AE"/>
        <circle cx="184" cy="312" r="2.2" fill="#90A4AE"/>
        <rect x="136" y="210" width="28" height="23" fill="${c.face}"/>
        <ellipse cx="150" cy="170" rx="51" ry="54" fill="${c.face}"/>
        <ellipse cx="99" cy="170" rx="9" ry="12" fill="${c.face}"/>
        <ellipse cx="201" cy="170" rx="9" ry="12" fill="${c.face}"/>
        <ellipse cx="150" cy="126" rx="48" ry="16" fill="${c.hair}"/>
        <rect x="102" y="124" width="20" height="48" rx="9" fill="${c.hair}"/>
        <rect x="178" y="124" width="20" height="48" rx="9" fill="${c.hair}"/>
        <ellipse cx="150" cy="118" rx="30" ry="12" fill="${c.face}"/>
        <ellipse cx="110" cy="138" rx="11" ry="16" fill="#B0BEC5" opacity="0.35"/>
        <ellipse cx="190" cy="138" rx="11" ry="16" fill="#B0BEC5" opacity="0.35"/>
        <ellipse cx="132" cy="168" rx="8" ry="8" fill="white" stroke="#BDBDBD" stroke-width="1"/>
        <ellipse cx="168" cy="168" rx="8" ry="8" fill="white" stroke="#BDBDBD" stroke-width="1"/>
        <circle cx="133" cy="169" r="5" fill="#5D4037"/>
        <circle cx="169" cy="169" r="5" fill="#5D4037"/>
        <circle cx="135" cy="167" r="1.5" fill="white"/>
        <circle cx="171" cy="167" r="1.5" fill="white"/>
        <path d="M122 156 Q132 153 142 156" stroke="#795548" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M158 156 Q168 153 178 156" stroke="#795548" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M148 178 Q150 185 152 178" stroke="#FFAB40" stroke-width="1.5" fill="none"/>
        <path d="M135 192 Q150 203 165 192" stroke="#E57373" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M120 190 Q116 196 119 202" stroke="#D7B899" stroke-width="1" fill="none"/>
        <path d="M180 190 Q184 196 181 202" stroke="#D7B899" stroke-width="1" fill="none"/>
      `
      break

    default: // narrator
      illustration = `
        <rect x="105" y="230" width="90" height="120" rx="8" fill="${c.body}"/>
        <rect x="136" y="210" width="28" height="25" fill="${c.face}"/>
        <ellipse cx="150" cy="170" rx="52" ry="55" fill="${c.face}" stroke="#BDBDBD" stroke-width="1.5"/>
        <ellipse cx="150" cy="128" rx="52" ry="22" fill="${c.hair}"/>
        <rect x="98" y="128" width="20" height="40" rx="10" fill="${c.hair}"/>
        <rect x="182" y="128" width="20" height="40" rx="10" fill="${c.hair}"/>
        <ellipse cx="132" cy="168" rx="8" ry="9" fill="white" stroke="#BDBDBD" stroke-width="1"/>
        <ellipse cx="168" cy="168" rx="8" ry="9" fill="white" stroke="#BDBDBD" stroke-width="1"/>
        <circle cx="134" cy="169" r="5" fill="#3E2723"/>
        <circle cx="170" cy="169" r="5" fill="#3E2723"/>
        <circle cx="136" cy="167" r="1.5" fill="white"/>
        <circle cx="172" cy="167" r="1.5" fill="white"/>
        <path d="M122 156 Q132 152 142 156" stroke="${c.hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M158 156 Q168 152 178 156" stroke="${c.hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M148 178 Q150 185 152 178" stroke="#FFAB40" stroke-width="1.5" fill="none"/>
        <path d="M136 192 Q150 200 164 192" stroke="#E57373" stroke-width="2" fill="none" stroke-linecap="round"/>
      `
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F8F9FA"/>
      <stop offset="100%" style="stop-color:#ECEFF1"/>
    </linearGradient>
  </defs>
  <rect width="300" height="400" fill="url(#bg)"/>
  <rect x="0" y="0" width="300" height="8" fill="${c.accent}"/>
  <text x="150" y="40" font-family="'Hiragino Sans', 'Yu Gothic', sans-serif" font-size="22" font-weight="bold" text-anchor="middle" fill="#212121">${firstName}</text>
  <text x="150" y="60" font-family="'Hiragino Sans', 'Yu Gothic', sans-serif" font-size="11" text-anchor="middle" fill="#757575">${role}</text>
  ${illustration}
  <rect x="20" y="340" width="260" height="44" rx="8" fill="${c.accent}" opacity="0.15" stroke="${c.accent}" stroke-width="1.5"/>
  <text x="150" y="358" font-family="'Hiragino Sans', 'Yu Gothic', sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="${c.accent}">${char.age !== '年齢不詳' ? char.age + '歳' : '年齢不詳'} · ${char.role}</text>
  <text x="150" y="375" font-family="'Hiragino Sans', 'Yu Gothic', sans-serif" font-size="10" text-anchor="middle" fill="#616161">${char.speechStyle.slice(0, 20)}</text>
  <rect x="0" y="392" width="300" height="8" fill="${c.accent}"/>
</svg>`
}

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient()

  // バケットが存在しない場合は作成
  await svc.storage.createBucket('character-sheets', { public: true }).catch(() => {/* already exists */})

  // 全キャラクターの画像を生成してStorageに保存（Gemini Imagen → SVGフォールバック）
  const results = await Promise.allSettled(
    ALL_CHARACTERS.map(async (char) => {
      let imageBuffer: Buffer
      let contentType: string
      let ext: string

      try {
        // Gemini Imagenで生成
        imageBuffer = await generateCharacterSheet(char.name, char.promptDescription)
        contentType = 'image/jpeg'
        ext = 'jpg'
      } catch {
        // フォールバック: SVG
        const svgContent = generateSvgCharacterSheet(char)
        imageBuffer = Buffer.from(svgContent, 'utf-8')
        contentType = 'image/svg+xml'
        ext = 'svg'
      }

      const filePath = `${user.id}/${char.key}.${ext}`
      const { error: uploadError } = await svc.storage
        .from('character-sheets')
        .upload(filePath, imageBuffer, { contentType, upsert: true })

      if (uploadError) throw new Error(`upload failed for ${char.key}: ${uploadError.message}`)

      const { data: urlData } = svc.storage
        .from('character-sheets')
        .getPublicUrl(filePath)

      await svc.from('character_sheets').upsert({
        user_id: user.id,
        character_key: char.key,
        character_type: char.type,
        storage_path: filePath,
        public_url: urlData.publicUrl,
      })

      return { key: char.key, name: char.name, url: urlData.publicUrl }
    })
  )

  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => r.reason?.message ?? String(r.reason))
  const sheets = results
    .filter((r): r is PromiseFulfilledResult<{ key: string; name: string; url: string }> => r.status === 'fulfilled')
    .map((r) => r.value)

  return NextResponse.json({ status: 'complete', succeeded, failed, total: ALL_CHARACTERS.length, errors, sheets })
}
