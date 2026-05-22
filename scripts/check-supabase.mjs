import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env')

function loadEnv() {
  if (!existsSync(envPath)) return {}
  const out = {}
  const raw = readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '')
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    let val = t.slice(i + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[t.slice(0, i).trim()] = val
  }
  return out
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL
const anon = env.VITE_SUPABASE_ANON_KEY

if (!url) {
  console.error('NG: .env に VITE_SUPABASE_URL を設定してください')
  process.exit(1)
}
if (!anon) {
  console.error(
    'NG: VITE_SUPABASE_ANON_KEY が空です。Supabase API から anon public をコピーし、.env を保存してください。',
  )
  process.exit(1)
}

const tables = ['tenants', 'employees', 'attendance_records']
let ok = true

for (const table of tables) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  })
  if (res.ok) {
    console.log(`OK: テーブル "${table}" に接続できました`)
  } else {
    const body = await res.text()
    console.error(`NG: "${table}" — HTTP ${res.status}`)
    if (body) console.error(body.slice(0, 300))
    ok = false
  }
}

if (!ok) {
  console.error('\n→ Supabase SQL Editor で migrations/20260520120000_initial.sql を実行してください')
  process.exit(1)
}

console.log('\nSupabase の準備は問題なさそうです。npm run dev で起動できます。')
