import { formatDateJa, todayIsoDate } from '../lib/dates'
import { useAppData } from '../context/AppDataContext'

type Props = {
  onPunch: () => void
  onAdmin: () => void
}

export function ModeSelectPage({ onPunch, onAdmin }: Props) {
  const { tenantName } = useAppData()
  const today = todayIsoDate()

  return (
    <div className="page-stack mode-select-page">
      <section className="panel home-hero">
        <p className="home-date">{formatDateJa(today)}</p>
        <h2 className="home-greeting">{tenantName}</h2>
        <p className="hint">利用する画面を選んでください。</p>
      </section>

      <div className="mode-select-cards">
        <button type="button" className="mode-select-card punch" onClick={onPunch}>
          <span className="mode-select-icon">⏱</span>
          <span className="mode-select-title">打刻</span>
          <span className="mode-select-desc">ユーザー選択・出勤 / 退勤</span>
        </button>
        <button type="button" className="mode-select-card admin" onClick={onAdmin}>
          <span className="mode-select-icon">🔒</span>
          <span className="mode-select-title">管理者</span>
          <span className="mode-select-desc">パスワードで管理画面へ</span>
        </button>
      </div>
    </div>
  )
}
