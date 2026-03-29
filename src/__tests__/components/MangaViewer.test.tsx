import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MangaViewer } from '@/components/MangaViewer'

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}))

const mockAssets6 = Array.from({ length: 6 }, (_, i) => ({
  id: `asset-${i + 1}`,
  asset_type: 'image' as const,
  panel_number: i + 1,
  public_url: `https://example.com/panel_${i + 1}.png`,
  overlay_data: {
    dialogue: [{ character: 'tanaka', text: `台詞${i + 1}` }],
    narrator_box: i === 5 ? 'まとめテキスト' : undefined,
    info_box: i === 2 ? '解説ボックス' : undefined,
    scene: `シーン${i + 1}`,
  },
}))

const mockAssets8 = Array.from({ length: 8 }, (_, i) => ({
  id: `asset-${i + 1}`,
  asset_type: 'image' as const,
  panel_number: i + 1,
  public_url: `https://example.com/panel_${i + 1}.png`,
  overlay_data: null,
}))

describe('MangaViewer', () => {
  it('should render 6-panel manga with correct grid', () => {
    const { container } = render(
      <MangaViewer assets={mockAssets6} panelCount={6} />
    )
    expect(screen.getByText('漫画ビューア')).toBeInTheDocument()
    expect(screen.getByText('(6コマ)')).toBeInTheDocument()

    // Check that the grid has the right number of panels
    const gridDiv = container.querySelector('[style*="grid-template-rows"]')
    expect(gridDiv).toBeTruthy()
    // 6 panels / 2 columns = 3 rows
    expect(gridDiv?.getAttribute('style')).toContain('repeat(3, 1fr)')
  })

  it('should render 8-panel manga with correct grid', () => {
    const { container } = render(
      <MangaViewer assets={mockAssets8} panelCount={8} />
    )
    expect(screen.getByText('(8コマ)')).toBeInTheDocument()
    const gridDiv = container.querySelector('[style*="grid-template-rows"]')
    // 8 panels / 2 columns = 4 rows
    expect(gridDiv?.getAttribute('style')).toContain('repeat(4, 1fr)')
  })

  it('should display panel numbers', () => {
    render(<MangaViewer assets={mockAssets6} panelCount={6} />)
    for (let i = 1; i <= 6; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument()
    }
  })

  it('should render text overlays when overlay_data is present', () => {
    render(<MangaViewer assets={mockAssets6} panelCount={6} />)
    // Check that dialogues are rendered
    expect(screen.getByText('台詞1')).toBeInTheDocument()
    // Check info_box
    expect(screen.getByText('解説ボックス')).toBeInTheDocument()
    // Check narrator_box
    expect(screen.getByText('まとめテキスト')).toBeInTheDocument()
  })

  it('should sort panels by panel_number', () => {
    const shuffled = [...mockAssets6].reverse()
    render(<MangaViewer assets={shuffled} panelCount={6} />)
    const panelBadges = screen.getAllByText(/^[1-6]$/)
    expect(panelBadges[0].textContent).toBe('1')
    expect(panelBadges[5].textContent).toBe('6')
  })

  it('should handle SVG fallback panels', () => {
    const svgAsset = [
      {
        id: 'svg-1',
        asset_type: 'svg_fallback' as const,
        panel_number: 1,
        public_url: 'https://example.com/panel_1_fallback.svg',
        overlay_data: {
          dialogue: [{ character: 'tanaka', text: 'SVGテスト' }],
          scene: 'SVGシーン',
        },
      },
    ]
    const { container } = render(
      <MangaViewer assets={svgAsset} panelCount={6} />
    )
    // SVG fallback renders <object> instead of <Image>
    const objectEl = container.querySelector('object[type="image/svg+xml"]')
    expect(objectEl).toBeTruthy()
  })
})
