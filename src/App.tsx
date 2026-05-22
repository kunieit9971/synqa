import { useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { AppDataProvider, useAppData } from './context/AppDataContext'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { PunchPage } from './pages/PunchPage'
import { ReportsPage } from './pages/ReportsPage'
import { AnnualReportsPage } from './pages/AnnualReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import './App.css'

export type AppMode = 'punch' | 'admin'
export type Page = 'home' | 'punch' | 'monthly' | 'annual' | 'settings'

function AppShell() {
  const auth = useAuth()
  const { loading, profile, tenantName, refresh } = useAppData()
  const isAdmin = profile?.role === 'admin'
  const [appMode, setAppMode] = useState<AppMode>('punch')
  const [page, setPage] = useState<Page>('home')

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

  const selectMode = (mode: AppMode) => {
    if (mode === 'admin' && !isAdmin) return
    setAppMode(mode)
    setPage('home')
  }

  const goPage = (p: Page) => {
    if (appMode === 'punch' && (p === 'monthly' || p === 'annual' || p === 'settings')) {
      return
    }
    setPage(p)
  }

  const punchNav: { id: Page; label: string }[] = [
    { id: 'home', label: 'TOP' },
    { id: 'punch', label: '打刻' },
  ]

  const adminNav: { id: Page; label: string }[] = [
    { id: 'home', label: 'TOP' },
    { id: 'monthly', label: '月次' },
    { id: 'annual', label: '年次' },
    { id: 'settings', label: '設定' },
  ]

  const nav = appMode === 'admin' && isAdmin ? adminNav : punchNav

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-main">
          <p className="app-brand">Synqa</p>
          <h1 className="app-title">{tenantName}</h1>
          <p className="app-sub">
            {profile.display_name}
            {isAdmin ? ' · 管理者' : ''}
            {' · '}
            {appMode === 'admin' ? '管理モード' : '打刻モード'}
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn ghost small" onClick={() => void refresh()}>
            更新
          </button>
          <button type="button" className="btn ghost small" onClick={() => void auth.signOut()}>
            退出
          </button>
        </div>
      </header>

      <main className="app-main">
        {page === 'home' ? (
          <HomePage
            isAdmin={isAdmin}
            appMode={appMode}
            onSelectMode={selectMode}
            onGoPunch={() => {
              setAppMode('punch')
              setPage('punch')
            }}
          />
        ) : null}
        {page === 'punch' ? <PunchPage /> : null}
        {page === 'monthly' ? <ReportsPage /> : null}
        {page === 'annual' ? <AnnualReportsPage /> : null}
        {page === 'settings' ? <SettingsPage /> : null}
      </main>

      <nav
        className={`bottom-nav cols-${nav.length}`}
        aria-label="メニュー"
      >
        {nav.map((item) => (
          <button
            key={item.id}
            type="button"
            className={page === item.id ? 'active' : ''}
            onClick={() => goPage(item.id)}
          >
            {item.label}
          </button>
        ))}
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
