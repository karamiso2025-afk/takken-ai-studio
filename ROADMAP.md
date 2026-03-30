# TakkenAI Studio — プロジェクトロードマップ

> 最終更新: 2026-03-30
> リポジトリ: https://github.com/karamiso2025-afk/takken-ai-studio
> 本番URL: https://app-lime-two-22.vercel.app

---

## プロジェクト概要

宅建試験の学習を**漫画形式**で行うWebアプリ。
PDF・テキストをアップロード → AIがシナリオ生成 → キャラクターが登場する漫画として表示 → クイズで定着。

### 登場キャラクター
| キー | 名前 | 役割 |
|------|------|------|
| tanaka | 田中 太郎 | 宅建業者・自信過剰・たまに間違える |
| sato | 佐藤 健一 | 買主・素直・驚きやすい |
| yamada | 山田 美咲 | 宅建士・知的・正確に訂正する |
| ゲスト | 鈴木/中村/黒田/木村/高橋 | トピックに応じて登場 |

---

## フェーズ別進捗

### ✅ Phase 1 — 基盤構築（完了）

| # | 内容 | コミット |
|---|------|---------|
| 1.1 | Next.js 16 プロジェクト初期化 | `335d753` |
| 1.2 | Supabase セットアップ（Auth / DB / Storage） | `335d753` |
| 1.3 | DBスキーマ設計（textbooks / chapters / topics / generated_content / content_assets / quizzes） | `335d753` |
| 1.4 | キャラクター定義（`src/lib/characters.ts`） | `335d753` |
| 1.5 | UIコンポーネント基本実装（Sidebar / Header / Dashboard / ContentView） | `f26d6d1` |

### ✅ Phase 2a — コンテンツ生成パイプライン（部分完了）

| # | 内容 | コミット | 状態 |
|---|------|---------|------|
| 2.1 | Anthropic Claude APIでシナリオ生成 | `f26d6d1` | ✅ 実装済み |
| 2.2 | Gemini APIで画像生成（初期実装） | `f26d6d1` | ❌ 動作不可 |
| 2.3 | Inngest でバックグラウンドジョブ設計 | `f26d6d1` | ❌ 未設定（INNGEST_EVENT_KEY空） |
| 2.4 | テキスト教材アップロード → トピック抽出 | `f26d6d1` | ✅ 動作確認済み |
| 2.5 | AuthGate（Supabase メール認証） | `c2b0b96` | ✅ 動作確認済み |

### ✅ Phase 2b — パイプライン修正（完了、ただし課題残り）

| # | 内容 | コミット | 状態 |
|---|------|---------|------|
| 2.6 | 同期エンドポイント `/api/generate/sync` 作成（Inngest不要） | `8578b39` | ✅ |
| 2.7 | ContentStatus ENUM バグ修正（`error`→`failed`） | `bcf1edb` | ✅ |
| 2.8 | Anthropic → Gemini 2.0 Flash へシナリオ生成移行 | `0f8f336` | ✅ |
| 2.9 | Google AI APIキー更新・Vercel環境変数更新 | —— | ✅ |
| 2.10 | SVGフォールバック改善（日本語キャラ名表示） | `b42c44c` | ✅ |
| 2.11 | システムプロンプト改善（短いセリフ・ツッコミ形式） | `b42c44c` | ✅ |
| 2.12 | MangaViewer リデザイン（キャラアバター＋吹き出し） | `acf32be` | ✅ |
| 2.13 | 画像生成を Pollinations.ai に変更・並列処理化 | `6c36f70` | ⚠️ 動作未確認 |

---

## ❌ 現在の重大な問題

### 問題1: 漫画に「絵」が存在しない【最重要】

**期待**: 田中・佐藤・山田が実際に描かれたマンガ絵がコマごとに表示される
**現実**: テキストの吹き出しのみ（イラストなし）

**根本原因**:
- Gemini の画像生成API（`gemini-2.0-flash-exp`）は試験的で不安定 → 廃止
- Pollinations.ai に切り替えたが「キャラクターの一貫性」がない（毎回違う顔の人物が生成される）
- **本来の要件「田中・佐藤・山田が毎コマ同じ外見で登場する」は、現在の方式では実現不可能**

**技術的制約**:
```
キャラクター一貫性のある漫画生成 = LoRA学習 or キャラクターリファレンス機能が必要
→ Midjourney --cref, DALL-E 3（部分的）, Stable Diffusion + LoRA 等
→ いずれも「毎回API呼び出しで自動生成」には追加コストまたは手作業が伴う
```

### 問題2: Vercel Hobby プランのタイムアウト

**期待**: 画像6枚生成 + アップロード + DB保存を1リクエストで完了
**現実**: Vercel Hobby は最大60秒 → 画像6枚の並列生成は50〜90秒かかり失敗する可能性
**`maxDuration = 300` は Pro プラン限定**

### 問題3: キャラクターシート生成が未動作

- `/api/characters/setup` が Inngest に依存しており呼び出せない
- キャラクター9人分のシートが一度も生成されていない

---

## 📋 今後のロードマップ

### Phase 3 — 漫画表示の本質的解決【最優先】

**方針選択（要確認）:**

#### 方針A: 固定イラスト素材方式（推奨・最速）
```
1. 田中・佐藤・山田のイラスト素材を用意（3〜5パターン: 話す/驚く/説明する等）
2. シナリオの emotion/action に応じてイラストを選択
3. 吹き出しをオーバーレイで合成
4. Vercel タイムアウト問題も解消
```
- コスト: 素材費のみ（フリー素材なら無料）
- 実装工数: 2〜3日
- 品質: 安定・一貫性あり ✅

#### 方針B: DALL-E 3 / Imagen 3 API
```
1. prompt_en を API に送信
2. 生成された画像をコマに配置
3. キャラクター一貫性は低い（毎回違う外見）
```
- コスト: 1コマ $0.04〜$0.08 × 6〜10コマ = 1生成あたり $0.24〜$0.80
- 実装工数: 1日
- 品質: ランダム（キャラが統一されない）⚠️

#### 方針C: Stable Diffusion + LoRA（本格派）
```
1. 各キャラのLoRAを作成（手動作業が必要）
2. 自前サーバーまたはRunPod等で推論
3. API化してパイプラインに組み込む
```
- コスト: サーバー費 + 構築工数
- 実装工数: 1〜2週間
- 品質: 最高（完全一貫性）✅✅

---

### Phase 4 — タイムアウト問題の解決

| タスク | 内容 |
|--------|------|
| 4.1 | Inngest を正しく設定（INNGEST_EVENT_KEY取得・設定） |
| 4.2 | 画像生成をバックグラウンドジョブ化 |
| 4.3 | フロントエンドでポーリングまたはリアルタイム進捗表示 |
| 4.4 | または Vercel Pro にアップグレード（月$20） |

### Phase 5 — キャラクターシート生成

| タスク | 内容 |
|--------|------|
| 5.1 | `/api/characters/setup` を Inngest 非依存に修正 |
| 5.2 | 9キャラ分のシート生成・Supabase Storage保存 |
| 5.3 | 設定画面でシート確認・再生成ボタン |

### Phase 6 — 品質・UX改善

| タスク | 内容 |
|--------|------|
| 6.1 | クイズ機能の動作確認・UI改善 |
| 6.2 | 学習進捗ダッシュボード（連続学習日数・正答率） |
| 6.3 | モバイル対応（1カラムレイアウト） |
| 6.4 | PDF直接アップロード + 自動テキスト抽出 |
| 6.5 | Remotion による動画エクスポート（Phase 2b実装済みだが未テスト） |

---

## 技術スタック

| レイヤー | 技術 |
|--------|------|
| フロントエンド | Next.js 16 (App Router), React, Tailwind CSS |
| バックエンド | Next.js API Routes (Serverless) |
| DB / Auth / Storage | Supabase |
| シナリオ生成 | Google Gemini 2.0 Flash (`@google/genai`) |
| 画像生成 | ⚠️ Pollinations.ai（暫定・要変更） |
| デプロイ | Vercel (Hobby Plan) |
| バックグラウンドジョブ | Inngest（未設定） |

---

## 環境変数一覧

| 変数名 | 用途 | 状態 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | ✅ 設定済み |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公開キー | ✅ 設定済み |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 管理キー | ✅ 設定済み |
| `GOOGLE_AI_API_KEY` | Gemini API | ✅ 設定済み（2026-03-30更新） |
| `ANTHROPIC_API_KEY` | Claude API（旧） | ❌ クレジット切れ・不使用 |
| `INNGEST_EVENT_KEY` | Inngest | ❌ 未設定 |
| `INNGEST_SIGNING_KEY` | Inngest | ❌ 未設定 |

---

## コミット規則（今後）

```
feat: 新機能追加
fix: バグ修正
refactor: リファクタリング
style: UI/CSS変更
docs: ドキュメント更新
chore: 設定・依存関係変更
```

**PRを作らず master 直push可。ただしコミットメッセージは必ず上記形式で。**

---

## 意思決定ログ

| 日付 | 決定事項 | 理由 |
|------|---------|------|
| 2026-03-29 | Anthropic → Gemini 2.0 Flash に移行 | Anthropicクレジット切れ。MAX$200サブスクはAPI利用不可 |
| 2026-03-29 | Inngest をバイパスして同期エンドポイント作成 | INNGEST_EVENT_KEY未設定で動作不可 |
| 2026-03-30 | Google AI APIキー再作成 | 旧キーが無効（AIzaSyCAbK...）|
| 2026-03-30 | Pollinations.ai で画像生成 | Gemini画像生成API不安定。暫定対応 |
| 2026-03-30 | 漫画表示をHTML/CSSパネルに変更 | SVG objectタグでは overlay_data が使えない |
