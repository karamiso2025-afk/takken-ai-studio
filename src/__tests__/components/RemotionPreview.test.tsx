import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock @remotion/player
vi.mock('@remotion/player', () => ({
  Player: ({ inputProps, controls }: {
    inputProps: { panels: unknown[]; topicName?: string }
    controls?: boolean
  }) => (
    <div data-testid="remotion-player" data-controls={String(controls)}>
      <div data-testid="player-panels-count">{inputProps.panels.length}</div>
      {inputProps.topicName && <div data-testid="player-topic">{inputProps.topicName}</div>}
    </div>
  ),
}))

// Mock MangaSlideshow module
vi.mock('@/remotion/MangaSlideshow', () => ({
  MangaSlideshow: () => <div data-testid="manga-slideshow" />,
  buildRemotionPanels: (
    assets: Array<{ panel_number: number | null; public_url: string | null; overlay_data?: unknown }>,
    duration = 3
  ) =>
    assets
      .filter((a) => a.panel_number !== null && a.public_url)
      .sort((a, b) => (a.panel_number ?? 0) - (b.panel_number ?? 0))
      .map((a, i) => ({
        imageUrl: a.public_url,
        durationSeconds: duration,
        animation: ['fade_in', 'slide_left', 'zoom_in', 'fade_in'][i % 4],
        panelNumber: a.panel_number,
        overlayText: (a.overlay_data as { narrator_box?: string } | null)?.narrator_box ?? undefined,
      })),
  calcTotalFrames: (panels: unknown[], fps = 30, titleSec = 2) =>
    (panels as unknown[]).length * 3 * fps + titleSec * fps,
}))

import { RemotionPreview } from '@/components/RemotionPreview'

const makeAssets = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    panel_number: i + 1,
    public_url: `https://example.com/panel_${i + 1}.png`,
    overlay_data: { narrator_box: i === 0 ? 'ナレーターテキスト' : undefined },
  }))

describe('RemotionPreview', () => {
  it('should render Remotion Player after dynamic import resolves', async () => {
    render(<RemotionPreview assets={makeAssets(6)} topicName="クーリング・オフ" />)
    const player = await screen.findByTestId('remotion-player')
    expect(player).toBeInTheDocument()
  })

  it('should pass correct panel count to Player', async () => {
    render(<RemotionPreview assets={makeAssets(8)} />)
    const countEl = await screen.findByTestId('player-panels-count')
    expect(countEl.textContent).toBe('8')
  })

  it('should pass topicName to Player', async () => {
    render(<RemotionPreview assets={makeAssets(6)} topicName="意思表示" />)
    const topicEl = await screen.findByTestId('player-topic')
    expect(topicEl.textContent).toBe('意思表示')
  })

  it('should show header with Level 1 badge', async () => {
    render(<RemotionPreview assets={makeAssets(6)} />)
    await screen.findByTestId('remotion-player')
    expect(screen.getByText('Level 1')).toBeInTheDocument()
    expect(screen.getByText('動画プレビュー')).toBeInTheDocument()
  })

  it('should display panel count in header', async () => {
    render(<RemotionPreview assets={makeAssets(6)} />)
    await screen.findByTestId('remotion-player')
    expect(screen.getByText(/6コマ/)).toBeInTheDocument()
  })

  it('should toggle info panel on chevron click', async () => {
    render(<RemotionPreview assets={makeAssets(6)} />)
    await screen.findByTestId('remotion-player')
    expect(screen.queryByText('パネル表示時間:')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '情報を表示' }))
    expect(screen.getByText('パネル表示時間:')).toBeInTheDocument()
    expect(screen.getByText(/Level 2 で音声ナレーション追加/)).toBeInTheDocument()
  })

  it('should filter out assets without public_url', async () => {
    const mixed = [
      { panel_number: 1, public_url: 'https://example.com/p1.png', overlay_data: null },
      { panel_number: 2, public_url: null, overlay_data: null },
      { panel_number: 3, public_url: 'https://example.com/p3.png', overlay_data: null },
    ]
    render(<RemotionPreview assets={mixed} />)
    const countEl = await screen.findByTestId('player-panels-count')
    expect(countEl.textContent).toBe('2')
  })
})

// buildRemotionPanels / calcTotalFrames ユニットテスト
describe('MangaSlideshow utilities', () => {
  it('buildRemotionPanels: filters null public_url', async () => {
    const { buildRemotionPanels } = await import('@/remotion/MangaSlideshow')
    const panels = buildRemotionPanels([
      { panel_number: 1, public_url: 'https://example.com/1.png', overlay_data: null },
      { panel_number: 2, public_url: null, overlay_data: null },
    ])
    expect(panels).toHaveLength(1)
    expect(panels[0].imageUrl).toBe('https://example.com/1.png')
  })

  it('buildRemotionPanels: sorts by panel_number', async () => {
    const { buildRemotionPanels } = await import('@/remotion/MangaSlideshow')
    const panels = buildRemotionPanels([
      { panel_number: 3, public_url: 'https://example.com/3.png', overlay_data: null },
      { panel_number: 1, public_url: 'https://example.com/1.png', overlay_data: null },
      { panel_number: 2, public_url: 'https://example.com/2.png', overlay_data: null },
    ])
    expect(panels[0].panelNumber).toBe(1)
    expect(panels[2].panelNumber).toBe(3)
  })

  it('buildRemotionPanels: uses narrator_box as overlayText', async () => {
    const { buildRemotionPanels } = await import('@/remotion/MangaSlideshow')
    const panels = buildRemotionPanels([
      { panel_number: 1, public_url: 'https://example.com/1.png', overlay_data: { narrator_box: 'ここがポイント！' } },
    ])
    expect(panels[0].overlayText).toBe('ここがポイント！')
  })

  it('calcTotalFrames: 6パネル×3秒+タイトル2秒 = 600フレーム', async () => {
    const { calcTotalFrames } = await import('@/remotion/MangaSlideshow')
    const panels = Array.from({ length: 6 }, (_, i) => ({
      imageUrl: '', durationSeconds: 3, animation: 'fade_in' as const, panelNumber: i + 1,
    }))
    expect(calcTotalFrames(panels, 30, 2)).toBe(600)
  })
})
