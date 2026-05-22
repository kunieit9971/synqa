/** Vercel/CI ビルド時: VITE_* が無いとデプロイを失敗させる */
const onVercel = Boolean(process.env.VERCEL)
const onCi = Boolean(process.env.CI)
if (!onVercel && !onCi) process.exit(0)

const url = (process.env.VITE_SUPABASE_URL ?? '').trim()
const anon = (process.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

const missing = []
if (!url) missing.push('VITE_SUPABASE_URL')
if (!anon) missing.push('VITE_SUPABASE_ANON_KEY')
if (url && !/^https?:\/\//i.test(url)) missing.push('VITE_SUPABASE_URL (invalid format)')

if (missing.length) {
  console.error('Build aborted: missing environment variables:', missing.join(', '))
  console.error('Set them in Vercel → Project → Settings → Environment Variables (Production + Preview), then Redeploy.')
  process.exit(1)
}

console.log('OK: Vite env vars present for build')
