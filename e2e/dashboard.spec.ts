import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('should load the dashboard page with correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('TakkenAI Studio')
  })

  test('should display the header with app name', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('TakkenAI Studio')
  })

  test('should display streak badge', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('0日連続')).toBeVisible()
  })

  test('should display stat cards', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('連続学習')).toBeVisible()
    await expect(page.getByText('トピック数')).toBeVisible()
    await expect(page.getByText('生成済み')).toBeVisible()
    await expect(page.getByText('正答率')).toBeVisible()
  })

  test('should display upload and character setup buttons', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('テキスト・写真をアップロード')).toBeVisible()
    await expect(page.getByText('キャラクターシート生成')).toBeVisible()
  })

  test('should display Remotion Phase 2b badge in generate hint', async ({ page }) => {
    // コンテンツビューに切り替えてトピック選択待ち画面を確認
    await page.goto('/')
    await page.getByRole('button', { name: 'コンテンツ' }).click()
    await expect(page.getByText('サイドバーからトピックを選択してください')).toBeVisible()
  })

  test('should display empty state message', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('まだトピックがありません')).toBeVisible()
  })

  test('should navigate between views via sidebar', async ({ page }) => {
    await page.goto('/')

    // Click "クイズ" in sidebar
    await page.getByRole('button', { name: 'クイズ' }).click()
    await expect(page.getByText('クイズがありません')).toBeVisible()

    // Click "設定" in sidebar
    await page.getByRole('button', { name: '設定' }).click()
    await expect(page.getByRole('heading', { name: 'キャラクターシート' })).toBeVisible()
    await expect(page.getByText('API接続状態')).toBeVisible()

    // Click "ダッシュボード" to go back
    await page.getByRole('button', { name: 'ダッシュボード' }).click()
    await expect(page.getByText('まだトピックがありません')).toBeVisible()
  })

  test('should display sidebar chapter tree section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('教科書', { exact: true }).first()).toBeVisible()
    await expect(
      page.getByText('PDF・写真をアップロードするとここに表示されます')
    ).toBeVisible()
  })
})

test.describe('Settings Page', () => {
  test('should show API status rows', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '設定' }).click()

    await expect(page.getByText('Supabase')).toBeVisible()
    await expect(page.getByText('Claude API (Anthropic)')).toBeVisible()
    await expect(page.getByText('Gemini API (Google)')).toBeVisible()
    await expect(page.getByText('Inngest')).toBeVisible()
    await expect(page.getByText('Remotion (紙芝居動画)')).toBeVisible()
    await expect(page.getByText('ElevenLabs (音声ナレーション)')).toBeVisible()
    await expect(page.getByText('Veo 3.1 (CGドラマ)')).toBeVisible()
  })

  test('should show video level settings with 3 levels', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '設定' }).click()

    await expect(page.getByText('動画生成レベル')).toBeVisible()
    await expect(page.getByText('Level 1 — Remotion 紙芝居')).toBeVisible()
    await expect(page.getByText('Level 2 — 音声ナレーション付き')).toBeVisible()
    await expect(page.getByText('Level 3 — Veo 3.1 CGドラマ')).toBeVisible()
    await expect(page.getByText('¥0/月（追加費用なし）')).toBeVisible()
  })

  test('should show character sheet empty state', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '設定' }).click()

    await expect(page.getByText('キャラクターシートが未生成です')).toBeVisible()
  })
})

test.describe('Content Page', () => {
  test('should show "select topic" message when no topic selected', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'コンテンツ' }).click()
    await expect(
      page.getByText('サイドバーからトピックを選択してください')
    ).toBeVisible()
  })
})
