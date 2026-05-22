import { useEffect, useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { AppDataProvider, useAppData } from './context/AppDataContext'
import { MenuBackButton } from './components/MenuBackButton'
import { PunchSettingsOverlay } from './components/PunchSettingsOverlay'
import { HelpLinkButton } from './components/HelpLinkButton'
import { applyTheme } from './lib/theme'
import { LoginPage } from './pages/LoginPage'
import { ModeSelectPage } from './pages/ModeSelectPage'
import { AdminGatePage } from './pages/AdminGatePage'
import { PunchPage } from './pages/PunchPage'
import { SettingsPage } from './pages/SettingsPage'
import { AdminReportsPage } from './pages/AdminReportsPage'
import { GuidePage } from './pages/GuidePage'
import './App.css'

type Screen = 'select' | 'punch' | 'admin-gate' | 'admin'
type AdminTab = 'settings' | 'reports'

type AppShellProps = {
  onOpenGuide: () => void
}

function AppShell({ onOpenGuide }: AppShellProps) {
  const auth = useAuth()
  const { loading, refreshing, profile, tenantName, settings, refresh } = useAppData()
  const [screen, setScreen] = useState<Screen>('select')
  const [adminTab, setAdminTab] = useState<AdminTab>('reports')
  const [punchSettingsOpen, setPunchSettingsOpen] = useState(false)

  useEffect(() => {
    applyTheme(settings)
  }, [settings.theme_primary_color, settings.theme_accent_color, settings.updated_at])

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
          <div className="auth-help-wrap">
            <HelpLinkButton onClick={onOpenGuide} />
          </div>
        </div>
      </div>
    )
  }

  const backToSelect = () => {
    setPunchSettingsOpen(false)
    setScreen('select')
  }

  const headerTitle =
    screen === 'select'
      ? 'メニュー'
      : screen === 'punch'
        ? '打刻'
        : screen === 'admin-gate'
          ? '管理者'
          : '管理'

  return (
    <div className={`app-shell ${screen === 'admin' ? 'has-bottom-nav' : ''}`}>
      <header className="app-header">
        <div className="header-main">
          {screen !== 'select' ? <MenuBackButton onClick={backToSelect} /> : null}
          <p className="app-brand">Synqa</p>
          <h1 className="app-title">
            {screen === 'select' ? tenantName : headerTitle}
          </h1>
        </div>
        <div className={`header-actions ${screen === 'punch' ? 'with-settings' : ''}`}>
          <div className="header-actions-row">
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
          {screen === 'punch' ? (
            <button
              type="button"
              className={`btn-gear ${punchSettingsOpen ? 'active' : ''}`}
              aria-label="打刻の設定"
              aria-expanded={punchSettingsOpen}
              onClick={() => setPunchSettingsOpen((v) => !v)}
            >
              <span className="btn-gear-icon" aria-hidden>
                ⚙
              </span>
            </button>
          ) : null}
        </div>
      </header>

      <main className="app-main">
        {screen === 'select' ? (
          <ModeSelectPage
            onPunch={() => {
              setPunchSettingsOpen(false)
              setScreen('punch')
            }}
            onAdmin={() => setScreen('admin-gate')}
          />
        ) : null}
        {screen === 'punch' ? <PunchPage /> : null}
        <PunchSettingsOverlay
          open={screen === 'punch' && punchSettingsOpen}
          onClose={() => setPunchSettingsOpen(false)}
        />
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

      <footer className="app-help-footer">
        <HelpLinkButton onClick={onOpenGuide} />
      </footer>

      {screen === 'admin' ? (
        <nav className="bottom-nav cols-2" aria-label="管理メニュー">
          <button
            type="button"
            className={`nav-item ${adminTab === 'reports' ? 'active' : ''}`}
            onClick={() => setAdminTab('reports')}
          >
            <span className="nav-icon" aria-hidden>
              📊
            </span>
            <span className="nav-label">勤務・残業</span>
            <span className="nav-desc">確認・Excel</span>
          </button>
          <button
            type="button"
            className={`nav-item ${adminTab === 'settings' ? 'active' : ''}`}
            onClick={() => setAdminTab('settings')}
          >
            <span className="nav-icon" aria-hidden>
              ⚙️
            </span>
            <span className="nav-label">会社設定</span>
            <span className="nav-desc">社員・修正</span>
          </button>
        </nav>
      ) : null}
    </div>
  )
}

export default function App() {
  const auth = useAuth()
  const [showGuide, setShowGuide] = useState(false)

  if (showGuide) {
    return <GuidePage onBack={() => setShowGuide(false)} />
  }

  if (!auth.ready) {
    return (
      <div className="loading-screen" role="status">
        起動中…
      </div>
    )
  }

  if (!auth.configured) {
    return <LoginPage onOpenGuide={() => setShowGuide(true)} />
  }

  if (!auth.session) {
    return <LoginPage onOpenGuide={() => setShowGuide(true)} />
  }

  return (
    <AppDataProvider>
      <AppShell onOpenGuide={() => setShowGuide(true)} />
    </AppDataProvider>
  )
}
