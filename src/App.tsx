import { useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { AppDataProvider, useAppData } from './context/AppDataContext'
import { LoginPage } from './pages/LoginPage'
import { ModeSelectPage } from './pages/ModeSelectPage'
import { AdminGatePage } from './pages/AdminGatePage'
import { PunchPage } from './pages/PunchPage'
import { SettingsPage } from './pages/SettingsPage'
import { AdminReportsPage } from './pages/AdminReportsPage'
import './App.css'

type Screen = 'select' | 'punch' | 'admin-gate' | 'admin'
type AdminTab = 'settings' | 'reports'

function AppShell() {
  const auth = useAuth()
  const { loading, refreshing, profile, tenantName, refresh } = useAppData()
  const [screen, setScreen] = useState<Screen>('select')
  const [adminTab, setAdminTab] = useState<AdminTab>('reports')

  if (!auth.session) return <LoginPage />

  if (loading && !profile) {
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

  const backToSelect = () => setScreen('select')

  const headerTitle =
    screen === 'select'
      ? 'メニュー'
      : screen === 'punch'
        ? '打刻'
        : screen === 'admin-gate'
          ? '管理者'
          : '管理'

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-main">
          {screen !== 'select' ? (
            <button type="button" className="btn-back" onClick={backToSelect}>
              ← メニュー
            </button>
          ) : null}
          <p className="app-brand">Synqa</p>
          <h1 className="app-title">
            {screen === 'select' ? tenantName : headerTitle}
          </h1>
          <p className="app-sub">{profile.display_name}</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn ghost small"
            disabled={refreshing}
            onClick={() => void refresh()}
          >
            {refreshing ? '更新中…' : '更新'}
          </button>
          <button type="button" className="btn ghost small" onClick={() => void auth.signOut()}>
            退出
          </button>
        </div>
      </header>

      <main className="app-main">
        {screen === 'select' ? (
          <ModeSelectPage
            onPunch={() => setScreen('punch')}
            onAdmin={() => setScreen('admin-gate')}
          />
        ) : null}
        {screen === 'punch' ? <PunchPage /> : null}
        {screen === 'admin-gate' ? (
          <AdminGatePage
            onBack={backToSelect}
            onUnlock={() => {
              setAdminTab('reports')
              setScreen('admin')
            }}
          />
        ) : null}
        {screen === 'admin' ? (
          adminTab === 'settings' ? <SettingsPage /> : <AdminReportsPage />
        ) : null}
      </main>

      {screen === 'admin' ? (
        <nav className="bottom-nav cols-2" aria-label="管理メニュー">
          <button
            type="button"
            className={adminTab === 'reports' ? 'active' : ''}
            onClick={() => setAdminTab('reports')}
          >
            確認
          </button>
          <button
            type="button"
            className={adminTab === 'settings' ? 'active' : ''}
            onClick={() => setAdminTab('settings')}
          >
            設定
          </button>
        </nav>
      ) : null}
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
