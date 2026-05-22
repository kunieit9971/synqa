import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { joinTenant, registerNewTenant } from '../api/data'
import { getSupabase, isSupabaseConfigured } from '../supabaseClient'

type Mode = 'login' | 'new' | 'join'

function BrandHeader() {
  return (
    <>
      <img className="brand-logo" src="/icons/icon-192.png" alt="" width={72} height={72} />
      <h1 className="brand-title">Synqa</h1>
      <p className="brand-tagline">Sync Your Work Evolution</p>
      <p className="brand-tagline-ja">働き方を、同期し進化させる。</p>
    </>
  )
}

export function LoginPage() {
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [slug, setSlug] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  if (!isSupabaseConfigured) {
    return (
      <div className="auth-screen">
        <div className="panel auth-panel">
          <BrandHeader />
          <p className="error">
            Supabase の URL と anon キーを .env に設定してください。ローカル保存のみの運用はできません。
          </p>
          <p className="hint small">
            営業分析アプリとは別の Supabase プロジェクトを新規作成し、マイグレーション SQL を実行してください。
          </p>
        </div>
      </div>
    )
  }

  const submit = async () => {
    setMsg(null)
    setBusy(true)
    try {
      if (mode === 'login') {
        const err = await auth.signIn(email, password)
        if (err) setMsg(err)
        return
      }
      const err = await auth.signUp(email, password)
      if (err) {
        setMsg(err)
        return
      }
      const sb = getSupabase()
      if (!sb) return
      const { data } = await sb.auth.signInWithPassword({ email, password })
      if (!data.session) {
        setMsg('確認メールを送信しました。確認後に再度ログインしてください。')
        return
      }
      if (mode === 'new') {
        await registerNewTenant(slug, companyName, displayName)
      } else {
        await joinTenant(slug, displayName)
      }
      window.location.reload()
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e)
      if (m.includes('tenant_exists')) setMsg('この会社コードは既に使われています')
      else if (m.includes('tenant_not_found')) setMsg('会社コードが見つかりません')
      else if (m.includes('already_registered')) setMsg('すでに会社登録済みです')
      else setMsg(m)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="panel auth-panel">
        <BrandHeader />
        <p className="hint">スマホ打刻・GPS・複数社対応の勤怠管理</p>
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            ログイン
          </button>
          <button
            type="button"
            className={mode === 'new' ? 'active' : ''}
            onClick={() => setMode('new')}
          >
            新規会社
          </button>
          <button
            type="button"
            className={mode === 'join' ? 'active' : ''}
            onClick={() => setMode('join')}
          >
            参加
          </button>
        </div>
        <label className="field">
          <span>メール</span>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span>パスワード</span>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>
        {mode !== 'login' ? (
          <>
            <label className="field">
              <span>会社コード（英数字・例: asahi-home）</span>
              <input
                className="input"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </label>
            {mode === 'new' ? (
              <label className="field">
                <span>会社名</span>
                <input
                  className="input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </label>
            ) : null}
            <label className="field">
              <span>あなたの表示名</span>
              <input
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
          </>
        ) : null}
        {msg ? <p className="error">{msg}</p> : null}
        <button type="button" className="btn primary block" disabled={busy} onClick={() => void submit()}>
          {busy ? '処理中…' : mode === 'login' ? 'ログイン' : mode === 'new' ? '会社を作成して開始' : '会社に参加'}
        </button>
      </div>
    </div>
  )
}
