import { useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { AppDataProvider, useAppData } from './context/AppDataContext'
import { LoginPage } from './pages/LoginPage'
import { PunchPage } from './pages/PunchPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import './App.css'

type Tab = 'punch' | 'reports' | 'settings'

function AppShell() {
  const auth = useAuth()
  const { loading, profile, tenantName, refresh } = useAppData()
  const [tab, setTab] = useState<Tab>('punch')

  if (!auth.session) return <LoginPage />

  if (loading) {
    return (
      <div className="loading-screen" role="status">
        読み込み中…
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="auth-screen">
        <div className="panel auth-panel">
          <h1>会社登録が必要です</h1>
          <p className="hint">
            ログアウトして「新規会社」または「参加」から会社コードを登録してください。
          </p>
          <button type="button" className="btn" onClick={() => void auth.signOut()}>
            ログアウト
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="app-title">{tenantName}</h1>
          <p className="app-sub">
            {profile.display_name}
            {profile.role === 'admin' ? '（管理者）' : ''}
          </p>
        </div>
        <button type="button" className="btn ghost small" onClick={() => void refresh()}>
          更新
        </button>
        <button type="button" className="btn ghost small" onClick={() => void auth.signOut()}>
          ログアウト
        </button>
      </header>

      <main className="app-main">
        {tab === 'punch' ? <PunchPage /> : null}
        {tab === 'reports' ? <ReportsPage /> : null}
        {tab === 'settings' ? <SettingsPage /> : null}
      </main>

      <nav className="bottom-nav" aria-label="メニュー">
        <button
          type="button"
          className={tab === 'punch' ? 'active' : ''}
          onClick={() => setTab('punch')}
        >
          打刻
        </button>
        <button
          type="button"
          className={tab === 'reports' ? 'active' : ''}
          onClick={() => setTab('reports')}
        >
          月次
        </button>
        <button
          type="button"
          className={tab === 'settings' ? 'active' : ''}
          onClick={() => setTab('settings')}
        >
          設定
        </button>
      </nav>
    </div>
  )
}

export default function App() {
  const auth = useAuth()

  if (!auth.ready) {
    return (
      <div className="loading-screen" role="status">
        起動中…
      </div>
    )
  }

  if (!auth.configured) {
    return <LoginPage />
  }

  if (!auth.session) {
    return <LoginPage />
  }

  return (
    <AppDataProvider>
      <AppShell />
    </AppDataProvider>
  )
}
