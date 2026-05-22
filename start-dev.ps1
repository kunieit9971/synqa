# Synqa 開発サーバー起動（必ずこのフォルダから実行）
Set-Location $PSScriptRoot
if (-not (Test-Path package.json)) {
  Write-Error "attendance-cloud フォルダで実行してください"
  exit 1
}
$envContent = Get-Content .env -Raw -ErrorAction SilentlyContinue
if ($envContent -notmatch 'VITE_SUPABASE_ANON_KEY=\S') {
  Write-Warning ".env の VITE_SUPABASE_ANON_KEY が空です。保存してから再実行してください。"
}
npm run dev
