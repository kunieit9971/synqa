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
      <section className="panel home-hero menu-hero">
        <img className="menu-logo" src="/icons/icon-192.png" alt="" width={56} height={56} />
        <p className="menu-brand">Synqa</p>
        <p className="home-date">{formatDateJa(today)}</p>
        <h2 className="home-greeting">{tenantName}</h2>
        <p className="hint">使う機能をタップしてください</p>
      </section>

      <div className="mode-select-cards">
        <button type="button" className="mode-select-card punch" onClick={onPunch}>
          <span className="mode-select-badge punch">打刻モード</span>
          <span className="mode-select-title">出勤・退勤を打刻</span>
          <ul className="mode-select-list">
            <li>担当者を選んで出勤 / 退勤</li>
            <li>出勤中・退勤済みの一覧を確認</li>
          </ul>
          <span className="mode-select-go">打刻画面を開く →</span>
        </button>

        <button type="button" className="mode-select-card admin" onClick={onAdmin}>
          <span className="mode-select-badge admin">管理者モード</span>
          <span className="mode-select-title">設定・勤務データ</span>
          <ul className="mode-select-list">
            <li>勤務時間・残業・超過の確認</li>
            <li>Excel出力（給与計算用）</li>
            <li>社員・打刻修正などの設定</li>
          </ul>
          <span className="mode-select-go">パスワードを入力 →</span>
        </button>
      </div>
    </div>
  )
}
