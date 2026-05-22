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

## GitHub（[github.com](https://github.com/)）

ローカルはコミット済み。リモート未設定です。

### 1. リポジトリを新規作成

1. [GitHub](https://github.com/) にログイン → **New repository**
2. 名前例: `synqa`（Public / Private はお好み）
3. **README / .gitignore は追加しない**（空のリポジトリ）

### 2. push（PowerShell）

リポジトリ: [kunieit9971/synqa](https://github.com/kunieit9971/synqa)

```powershell
cd c:\Users\kageyama\Desktop\attendance-cloud

$git = "C:\Program Files\Git\cmd\git.exe"

# 初回のみ（remote 済みなら不要）
& $git remote add origin https://github.com/kunieit9971/synqa.git
& $git branch -M main
& $git push -u origin main
```

**403 が出る場合**: PC に別アカウント（例: `gooner0701mk`）でログインしている。  
→ Windows「資格情報マネージャー」で `git:https://github.com` を削除するか、[GitHub CLI / PAT](https://github.com/settings/tokens) で **kunieit9971** として再認証してから push。

Git のユーザー名・メールが未設定で push が失敗する場合のみ、**一度だけ**（グローバル）:

```powershell
& $git config --global user.name "mikihiro"
& $git config --global user.email "kunieda9971j@gmail.com"
```

（`git.exe` の前に `&` が必要です。ないと PowerShell でエラーになります。）

### 3. 認証

初回 push で GitHub のログイン（ブラウザ or Personal Access Token）を求められます。

---

## Vercel（[kunieit9971-s-projects](https://vercel.com/kunieit9971-s-projects)）

1. GitHub にリポジトリを push 後、**新規 Project** で Import
2. 環境変数: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`（`.env` と同じ値）
3. デプロイ後、Supabase Auth に本番 URL を追加

## 動作確認

1. ログイン画面に Synqa ロゴが出る
2. **新規会社** で登録 → 打刻タブが表示される
3. スマホは `https://<PCのIP>:5174/`（証明書警告は開発用なので進む）
