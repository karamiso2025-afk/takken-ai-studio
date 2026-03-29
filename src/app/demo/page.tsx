'use client'

import dynamic from 'next/dynamic'

const RemotionPreview = dynamic(
  () => import('@/components/RemotionPreview').then((m) => m.RemotionPreview),
  { ssr: false }
)

// モック用のカラーSVGパネル（Supabase不要）
function makeSvgUrl(label: string, color: string, sub: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:1"/>
        <stop offset="100%" style="stop-color:${color}cc;stop-opacity:1"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#bg)"/>
    <rect x="60" y="60" width="1160" height="600" rx="24" fill="white" fill-opacity="0.1" stroke="white" stroke-opacity="0.2" stroke-width="2"/>
    <text x="640" y="310" font-family="'Hiragino Sans', 'Yu Gothic', sans-serif" font-size="64" font-weight="bold" fill="white" text-anchor="middle">${label}</text>
    <text x="640" y="400" font-family="'Hiragino Sans', 'Yu Gothic', sans-serif" font-size="32" fill="white" fill-opacity="0.8" text-anchor="middle">${sub}</text>
    <text x="640" y="630" font-family="sans-serif" font-size="22" fill="white" fill-opacity="0.4" text-anchor="middle">TakkenAI Studio — Remotion Demo</text>
  </svg>`
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

const MOCK_ASSETS = [
  {
    panel_number: 1,
    public_url: makeSvgUrl('宅建とは？', '#4f46e5', '宅地建物取引士 — 不動産の国家資格'),
    overlay_data: { narrator_box: '宅建（宅地建物取引士）は不動産取引の国家資格です' },
  },
  {
    panel_number: 2,
    public_url: makeSvgUrl('試験概要', '#7c3aed', '毎年10月 全国一斉実施'),
    overlay_data: { narrator_box: '合格率は約15〜17%。例年20万人以上が受験する人気資格' },
  },
  {
    panel_number: 3,
    public_url: makeSvgUrl('権利関係 14問', '#0891b2', '民法を中心とした出題'),
    overlay_data: { narrator_box: '民法・借地借家法・区分所有法など。難易度が高い科目' },
  },
  {
    panel_number: 4,
    public_url: makeSvgUrl('宅建業法 20問', '#059669', '最重要科目！満点を目指せ'),
    overlay_data: { narrator_box: '宅建業法は最も配点が高い。完璧に仕上げることが合格への近道' },
  },
  {
    panel_number: 5,
    public_url: makeSvgUrl('法令上の制限 8問', '#d97706', '都市計画法・建築基準法など'),
    overlay_data: { narrator_box: '都市計画法・建築基準法・農地法など。暗記が中心の科目' },
  },
  {
    panel_number: 6,
    public_url: makeSvgUrl('合格を目指せ！', '#dc2626', 'TakkenAI Studio で効率学習'),
    overlay_data: { narrator_box: 'AIが漫画で分かりやすく解説。楽しく合格を目指しましょう！' },
  },
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center py-10 px-4 gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Remotion プレビュー デモ</h1>
        <p className="text-gray-400 text-sm">Phase 2b — 紙芝居スライドショー（モックパネル）</p>
      </div>
      <div className="w-full max-w-3xl">
        <RemotionPreview
          assets={MOCK_ASSETS}
          topicName="宅建とは？（デモ）"
          panelCount={MOCK_ASSETS.length}
        />
      </div>
    </div>
  )
}
