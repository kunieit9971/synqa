# Synqa セットアップチェックリスト

## あなたが Supabase ダッシュボードでやること

- [ ] [SQL を実行](https://supabase.com/dashboard/project/rhsslssyfwwpmktlplrc/sql/new)（`supabase/migrations/20260520120000_initial.sql`）
- [ ] [Auth URL](https://supabase.com/dashboard/project/rhsslssyfwwpmktlplrc/auth/url-configuration) に以下を追加:
  - Site URL: `https://localhost:5174`（開発）→ 本番デプロイ後は Vercel URL に変更
  - Redirect URLs: `https://localhost:5174/**` と本番 `https://xxxx.vercel.app/**`

## ローカル（PC）

```powershell
cd c:\Users\kageyama\Desktop\attendance-cloud
npm install
npm run check:supabase   # テーブル接続確認
npm run dev              # https://localhost:5174/
```

## Vercel（[kunieit9971-s-projects](https://vercel.com/kunieit9971-s-projects)）

1. GitHub にリポジトリを push 後、**新規 Project** で Import
2. 環境変数: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`（`.env` と同じ値）
3. デプロイ後、Supabase Auth に本番 URL を追加

## 動作確認

1. ログイン画面に Synqa ロゴが出る
2. **新規会社** で登録 → 打刻タブが表示される
3. スマホは `https://<PCのIP>:5174/`（証明書警告は開発用なので進む）
