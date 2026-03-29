// Remotion Composition: MangaSlideshow
// Phase 2b: 漫画パネルを紙芝居アニメに変換するコンポーザブル

import {
  AbsoluteFill,
  Sequence,
  Img,
  useVideoConfig,
  useCurrentFrame,
  interpolate,
  spring,
} from 'remotion'

// ─────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────
export type AnimationType = 'fade_in' | 'slide_left' | 'zoom_in'

export interface RemotionPanel {
  imageUrl: string
  durationSeconds: number
  overlayText?: string
  animation: AnimationType
  panelNumber: number
}

export interface MangaSlideshowProps {
  panels: RemotionPanel[]
  topicName?: string
}

// ─────────────────────────────────────────
// 1枚パネルのアニメーションフレーム
// ─────────────────────────────────────────
function PanelFrame({
  panel,
  durationInFrames,
}: {
  panel: RemotionPanel
  durationInFrames: number
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const fadeOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })

  const translateX =
    panel.animation === 'slide_left'
      ? interpolate(frame, [0, 18], [-60, 0], {
          extrapolateRight: 'clamp',
          extrapolateLeft: 'clamp',
        })
      : 0

  const scaleValue =
    panel.animation === 'zoom_in'
      ? spring({
          fps,
          frame,
          config: { damping: 14, stiffness: 120 },
          durationInFrames: 20,
          from: 0.85,
          to: 1,
        })
      : 1

  const textOpacity = interpolate(
    frame,
    [Math.min(18, durationInFrames - 8), Math.min(28, durationInFrames - 3)],
    [0, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  )

  const badgeOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f0f1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOpacity,
      }}
    >
      <div
        style={{
          transform: `translateX(${translateX}px) scale(${scaleValue})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '48px',
          boxSizing: 'border-box',
        }}
      >
        <Img
          src={panel.imageUrl}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: 16,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            border: '2px solid rgba(255,255,255,0.1)',
          }}
        />
      </div>

      {/* パネル番号バッジ */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          backgroundColor: 'rgba(99,102,241,0.9)',
          color: 'white',
          borderRadius: 24,
          padding: '6px 16px',
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'sans-serif',
          opacity: badgeOpacity,
        }}
      >
        {panel.panelNumber}
      </div>

      {/* テキストオーバーレイ（narrator_box） */}
      {panel.overlayText && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 60,
            right: 60,
            backgroundColor: 'rgba(0,0,0,0.82)',
            color: 'white',
            padding: '16px 24px',
            borderRadius: 12,
            fontSize: 26,
            lineHeight: 1.6,
            textAlign: 'center',
            opacity: textOpacity,
            fontFamily: 'sans-serif',
            borderLeft: '4px solid #6366f1',
          }}
        >
          {panel.overlayText}
        </div>
      )}
    </AbsoluteFill>
  )
}

// ─────────────────────────────────────────
// タイトルカード
// ─────────────────────────────────────────
function TitleCard({ topicName }: { topicName: string }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const opacity = spring({ fps, frame, config: { damping: 20 }, durationInFrames: 20 })
  const scale = spring({
    fps, frame, config: { damping: 16, stiffness: 100 },
    durationInFrames: 25, from: 0.8, to: 1,
  })

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div style={{ color: '#a5b4fc', fontSize: 28, fontFamily: 'sans-serif', marginBottom: 16, letterSpacing: 4 }}>
        TakkenAI Studio
      </div>
      <div style={{ color: 'white', fontSize: 52, fontWeight: 800, fontFamily: 'sans-serif', textAlign: 'center', padding: '0 80px', lineHeight: 1.3 }}>
        {topicName}
      </div>
      <div style={{ marginTop: 32, width: 80, height: 4, backgroundColor: '#6366f1', borderRadius: 2 }} />
      <div style={{ color: '#94a3b8', fontSize: 22, fontFamily: 'sans-serif', marginTop: 24 }}>
        宅建試験 漫画解説
      </div>
    </AbsoluteFill>
  )
}

// ─────────────────────────────────────────
// メインコンポジション
// ─────────────────────────────────────────
export function MangaSlideshow({ panels, topicName }: MangaSlideshowProps) {
  const { fps } = useVideoConfig()
  const TITLE_DURATION = 2
  const titleFrames = Math.round(TITLE_DURATION * fps)

  // 各パネルのフレーム数を事前計算（immutable）
  const panelFrames = panels.map((p) => Math.round(p.durationSeconds * fps))
  const panelStarts = panelFrames.reduce<number[]>((acc, _, i) => {
    acc.push(i === 0 ? titleFrames : acc[i - 1] + panelFrames[i - 1])
    return acc
  }, [])

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f0f1a' }}>
      <Sequence from={0} durationInFrames={titleFrames}>
        <TitleCard topicName={topicName || '宅建学習'} />
      </Sequence>
      {panels.map((panel, i) => (
        <Sequence key={panel.panelNumber} from={panelStarts[i]} durationInFrames={panelFrames[i]}>
          <PanelFrame panel={panel} durationInFrames={panelFrames[i]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}

// ─────────────────────────────────────────
// ユーティリティ型
// ─────────────────────────────────────────
export interface ContentAssetLike {
  panel_number: number | null
  public_url: string | null
  overlay_data?: {
    narrator_box?: string
    dialogue?: { character: string; text: string }[]
    scene?: string
  } | null
}

const ANIMATIONS: AnimationType[] = ['fade_in', 'slide_left', 'zoom_in', 'fade_in']

export function buildRemotionPanels(
  assets: ContentAssetLike[],
  durationPerPanel = 3
): RemotionPanel[] {
  return assets
    .filter((a) => a.panel_number !== null && a.public_url)
    .sort((a, b) => (a.panel_number ?? 0) - (b.panel_number ?? 0))
    .map((asset, i) => ({
      imageUrl: asset.public_url!,
      durationSeconds: durationPerPanel,
      overlayText: asset.overlay_data?.narrator_box ?? undefined,
      animation: ANIMATIONS[i % ANIMATIONS.length],
      panelNumber: asset.panel_number!,
    }))
}

export function calcTotalFrames(
  panels: RemotionPanel[],
  fps = 30,
  titleDurationSec = 2
): number {
  const panelFrames = panels.reduce(
    (sum, p) => sum + Math.round(p.durationSeconds * fps),
    0
  )
  return panelFrames + Math.round(titleDurationSec * fps)
}
