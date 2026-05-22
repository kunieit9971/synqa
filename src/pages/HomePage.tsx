import { useMemo } from 'react'
import { TeamStatusTable } from '../components/TeamStatusTable'
import { useAppData } from '../context/AppDataContext'
import { formatClock, formatDateJa, todayIsoDate } from '../lib/dates'
import { resolveTodayStatus } from '../lib/metrics'

type Props = {
  isAdmin: boolean
  appMode: 'punch' | 'admin'
  onSelectMode: (mode: 'punch' | 'admin') => void
  onGoPunch: () => void
}

export function HomePage({ isAdmin, appMode, onSelectMode, onGoPunch }: Props) {
  const { profile, settings, employees, records, tenantName } = useAppData()
  const today = todayIsoDate()
  const myEmployeeId = profile?.employee_id ?? ''

  const myRecord = useMemo(
    () =>
      records.find(
        (r) => r.employee_id === myEmployeeId && r.work_date === today,
      ) ?? null,
    [records, myEmployeeId, today],
  )

  const myStatus = myEmployeeId
    ? resolveTodayStatus(records, myEmployeeId, today)
    : 'none'

  const counts = useMemo(() => {
    let inC = 0
    let outC = 0
    let noneC = 0
    for (const e of employees) {
      const s = resolveTodayStatus(records, e.id, today)
      if (s === 'in') inC++
      else if (s === 'out') outC++
      else noneC++
    }
    return { inC, outC, noneC }
  }, [employees, records, today])

  return (
    <div className="page-stack">
      <section className="panel home-hero">
        <p className="home-date">{formatDateJa(today)}</p>
        <h2 className="home-greeting">{tenantName}</h2>
        <p className="hint">本日のチーム状況と、打刻・管理メニューへ進めます。</p>
      </section>

      <section className="panel">
        <h2 className="section-title">あなたの本日</h2>
        {!myEmployeeId ? (
          <p className="warn">打刻担当が未設定です。管理者モードの設定で紐づけてください。</p>
        ) : (
          <>
            <p className={`status-pill ${myStatus === 'in' ? 'on' : 'off'}`}>
              {myStatus === 'in'
                ? '出勤中'
                : myStatus === 'out'
                  ? '退勤済み'
                  : '未出勤'}
            </p>
            <dl className="time-dl compact">
              <div>
                <dt>出勤</dt>
                <dd>{myRecord ? formatClock(myRecord.clock_in_at) : '—'}</dd>
              </div>
              <div>
                <dt>退勤</dt>
                <dd>
                  {myRecord?.clock_out_at
                    ? formatClock(myRecord.clock_out_at)
                    : myStatus === 'in'
                      ? '未退勤'
                      : '—'}
                </dd>
              </div>
            </dl>
            <button type="button" className="btn primary block" onClick={onGoPunch}>
              打刻画面へ
            </button>
          </>
        )}
      </section>

      <section className="panel">
        <div className="summary-cards">
          <div className="summary-card in">
            <span className="num">{counts.inC}</span>
            <span className="lbl">出勤中</span>
          </div>
          <div className="summary-card out">
            <span className="num">{counts.outC}</span>
            <span className="lbl">退勤済み</span>
          </div>
          <div className="summary-card none">
            <span className="num">{counts.noneC}</span>
            <span className="lbl">未打刻</span>
          </div>
        </div>
        <TeamStatusTable employees={employees} records={records} workDate={today} />
      </section>

      <section className="panel">
        <h2 className="section-title">メニュー</h2>
        <p className="hint small">
          現在: {appMode === 'punch' ? '打刻モード' : '管理者モード'}
        </p>
        <div className="mode-cards">
          <button
            type="button"
            className={`mode-card ${appMode === 'punch' ? 'active' : ''}`}
            onClick={() => onSelectMode('punch')}
          >
            <span className="mode-card-title">打刻</span>
            <span className="mode-card-desc">出勤・退勤（GPS）</span>
          </button>
          {isAdmin ? (
            <button
              type="button"
              className={`mode-card admin ${appMode === 'admin' ? 'active' : ''}`}
              onClick={() => onSelectMode('admin')}
            >
              <span className="mode-card-title">管理者</span>
              <span className="mode-card-desc">設定・月次・年次・修正</span>
            </button>
          ) : null}
        </div>
        {!isAdmin ? (
          <p className="hint small">会社設定の変更は管理者アカウントのみ可能です。</p>
        ) : null}
      </section>

      <p className="hint small center">
        所定 {Math.floor(settings.standard_work_minutes_per_day / 60)}時間/日 ・ 月残業上限{' '}
        {settings.monthly_overtime_limit_hours}時間
      </p>
    </div>
  )
}
