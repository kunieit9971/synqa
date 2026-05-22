import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { verifyPassword } from '../lib/password'

type Props = {
  onBack: () => void
  onUnlock: () => void
}

export function AdminGatePage({ onBack, onUnlock }: Props) {
  const { profile, settings } = useAppData()
  const canSkipPw =
    profile?.role === 'admin' && !settings.admin_password_hash
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    setErr(null)
    if (!settings.admin_password_hash) {
      setErr('管理者パスワードが未設定です。先に管理画面（初回）またはDBで設定してください。')
      return
    }
    setBusy(true)
    try {
      const ok = await verifyPassword(pw, settings.admin_password_hash)
      if (!ok) {
        setErr('パスワードが違います')
        return
      }
      onUnlock()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <h2 className="section-title">管理者ログイン</h2>
        <p className="hint">設定で登録した管理者パスワードを入力してください。</p>
        <label className="field">
          <span>パスワード</span>
          <input
            type="password"
            className="input"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit()
            }}
          />
        </label>
        {err ? <p className="error">{err}</p> : null}
        {canSkipPw ? (
          <p className="hint">初回設定のため、パスワード未設定時は管理者アカウントでそのまま入れます。</p>
        ) : null}
        <button
          type="button"
          className="btn primary block"
          disabled={busy || (!pw && !canSkipPw)}
          onClick={() => void (canSkipPw && !pw ? onUnlock() : submit())}
        >
          {busy ? '確認中…' : '管理画面へ'}
        </button>
        <button type="button" className="btn ghost block" onClick={onBack}>
          戻る
        </button>
      </section>
    </div>
  )
}
