# Synqa

**Sync Your Work Evolution** — 働き方を、同期し進化させる。

複数社向けの勤怠打刻 PWA（営業分析アプリ `sales-newbiz-analytics` とは別リポジトリ・別 Supabase プロジェクト）。

## 機能

- マルチテナント（会社コードでログイン・データ分離）
- スマホ打刻・GPS（HTTPS 必須・ローカル保存のみの運用なし）
- TOP：全員の出勤中 / 退勤済み / 未打刻一覧
- 管理者：打刻修正・削除（当日 / 7日 / 31日）
- 休憩時間の自動控除（会社ごとに設定）
- 設定：社員表示名、管理者PW、休憩帯、月次期間（暦月 or 締め日）、所定・残業上限
- 月次表：実働・残業の可視化

## Supabase

プロジェクト: [rhsslssyfwwpmktlplrc](https://supabase.com/dashboard/project/rhsslssyfwwpmktlplrc)（営業分析アプリとは別）

1. [API 設定](https://supabase.com/dashboard/project/rhsslssyfwwpmktlplrc/settings/api) で **anon public** キーをコピー
2. `.env.example` を `.env` にコピーし、`VITE_SUPABASE_ANON_KEY` を貼り付け（URL は既にこのプロジェクト向け）
3. [SQL Editor](https://supabase.com/dashboard/project/rhsslssyfwwpmktlplrc/sql/new) で `supabase/migrations/20260520120000_initial.sql` を **Run**
4. [Auth URL Configuration](https://supabase.com/dashboard/project/rhsslssyfwwpmktlplrc/auth/url-configuration) に Site URL / Redirect URLs（本番・`https://localhost:5174` 等）を追加

## ローカル開発

1. `npm install`
2. `.env.example` を `.env` にコピー
3. `npm run dev` → スマホは `https://<PCのIP>:5174/`（basic-ssl 付き）

PWA アイコンは `public/icons/source.png` から `npm run icons` で生成されます（`npm run build` でも自動実行）。

## 初回利用

1. **新規会社**：メール・パスワード・会社コード・会社名・表示名で登録（最初の人が管理者）
2. **参加**：既存の会社コードでメール登録
3. 設定で社員を追加し、各自「自分の打刻担当」を選ぶ
4. 打刻タブから出勤 / 退勤

## Vercel デプロイ

チーム: [kunieit9971-s-projects](https://vercel.com/kunieit9971-s-projects)（営業分析アプリとは **別の Vercel プロジェクト** で作成）

### 1. リポジトリを用意

GitHub 等に `attendance-cloud` を push（未初期化なら `git init` → リモート追加 → push）。

### 2. Vercel で新規プロジェクト

1. [kunieit9971-s-projects](https://vercel.com/kunieit9971-s-projects) → **Add New…** → **Project**
2. リポジトリを Import（Framework: **Vite** を自動検出）
3. **Environment Variables**（Production / Preview 両方推奨）:

| 名前 | 値 |
|------|-----|
| `VITE_SUPABASE_URL` | `https://rhsslssyfwwpmktlplrc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase の anon public キー |

4. Deploy → 表示された URL（例: `https://synqa-xxxx.vercel.app`）を控える

ビルドは `npm run build`（アイコン生成込み）。`vercel.json` で SPA 用 rewrite を設定済み。

### 3. Supabase Auth に本番 URL を登録

デプロイ後、[Auth URL Configuration](https://supabase.com/dashboard/project/rhsslssyfwwpmktlplrc/auth/url-configuration) で:

- **Site URL**: `https://<あなたの-vercel-url>/`
- **Redirect URLs**: 同じ URL を追加（必要なら `https://localhost:5174` も開発用に残す）

### 4. スマホで使う

1. 本番 URL を Safari / Chrome で開く（HTTPS のため GPS 打刻可）
2. **ホーム画面に追加** → Synqa アイコンで起動

営業アプリ（`sales-newbiz-analytics`）と URL・Vercel プロジェクト・Supabase はすべて別運用です。
