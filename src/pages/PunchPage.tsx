import { useMemo, useState } from 'react'
import { punchIn, punchOut } from '../api/data'
import { TeamStatusTable } from '../components/TeamStatusTable'
import { CorrectionPanel } from '../components/CorrectionPanel'
import { useAppData } from '../context/AppDataContext'
import { captureGps, formatGps, googleMapsUrl, isSecureContext } from '../lib/geo'
import { formatClock, formatDateJa, todayIsoDate } from '../lib/dates'
import { workMinutes, overtimeMinutes, formatMinutesJa } from '../lib/metrics'

export function PunchPage() {
  const { profile, settings, employees, records, refresh } = useAppData()
  const today = todayIsoDate()
  const [employeeId, setEmployeeId] = useState(profile?.employee_id ?? employees[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [showCorrection, setShowCorrection] = useState(false)
  const isAdmin = profile?.role === 'admin'

  const openRecord = useMemo(
    () =>
      records.find(
        (r) =>
          r.employee_id === employeeId &&
          r.work_date === today &&
          r.clock_in_at &&
          !r.clock_out_at,
      ) ?? null,
    [records, employeeId, today],
  )

  const todayRecord = useMemo(
    () =>
      records.find((r) => r.employee_id === employeeId && r.work_date === today) ??
      null,
    [records, employeeId, today],
  )

  const onDuty = Boolean(openRecord)

  const punchInHandler = async () => {
    if (!employeeId) {
      alert('打刻する担当を選んでください')
      return
    }
    if (!isSecureContext()) {
      alert('GPS打刻には HTTPS で開いてください（本番URLまたは https://の開発サーバー）')
      return
    }
    if (openRecord) {
      alert('すでに出勤中です')
      return
    }
    if (todayRecord?.clock_out_at) {
      alert('本日は退勤済みです')
      return
    }
    setBusy(true)
    try {
      const gps = await captureGps()
      await punchIn(employeeId, { lat: gps.lat, lng: gps.lng })
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : '出勤に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  const punchOutHandler = async () => {
    if (!openRecord) {
      alert('出勤打刻がありません')
      return
    }
    if (!isSecureContext()) {
      alert('GPS打刻には HTTPS が必要です')
      return
    }
    setBusy(true)
    try {
      const gps = await captureGps()
      await punchOut(openRecord.id, { lat: gps.lat, lng: gps.lng })
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : '退勤に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="panel punch-panel">
        <h2 className="section-title">打刻</h2>
        {!isSecureContext() ? (
          <p className="warn">位置情報のため HTTPS でアクセスしてください。</p>
        ) : null}
        <label className="field">
          <span>打刻する担当</span>
          <select
            className="input"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">選択</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.display_name}
              </option>
            ))}
          </select>
        </label>
        <p className={`status-pill ${onDuty ? 'on' : 'off'}`}>
          {onDuty ? '勤務中' : todayRecord?.clock_out_at ? '本日退勤済み' : '未出勤'}
        </p>
        <dl className="time-dl">
          <div>
            <dt>出勤</dt>
            <dd>{todayRecord ? formatClock(todayRecord.clock_in_at) : '—'}</dd>
          </div>
          <div>
            <dt>退勤</dt>
            <dd>
              {todayRecord?.clock_out_at
                ? formatClock(todayRecord.clock_out_at)
                : onDuty
                  ? '未退勤'
                  : '—'}
            </dd>
          </div>
        </dl>
        {todayRecord?.clock_out_at ? (
          <p className="hint">
            実働 {formatMinutesJa(workMinutes(todayRecord, settings.break_windows))}
            {overtimeMinutes(
              todayRecord,
              settings.break_windows,
              settings.standard_work_minutes_per_day,
            ) > 0
              ? ` / 残業 ${Math.floor(
                  overtimeMinutes(
                    todayRecord,
                    settings.break_windows,
                    settings.standard_work_minutes_per_day,
                  ) / 60,
                )}時間`
              : ''}
          </p>
        ) : null}
        {todayRecord ? (
          <p className="hint gps-line">
            出勤位置:{' '}
            <a
              href={googleMapsUrl(todayRecord.clock_in_lat, todayRecord.clock_in_lng)}
              target="_blank"
              rel="noreferrer"
            >
              {formatGps(todayRecord.clock_in_lat, todayRecord.clock_in_lng)}
            </a>
          </p>
        ) : null}
        <div className="punch-actions">
          <button
            type="button"
            className="btn primary punch-in large"
            disabled={busy || onDuty || !!todayRecord?.clock_out_at || !employeeId}
            onClick={() => void punchInHandler()}
          >
            {busy ? '取得中…' : '出勤'}
          </button>
          <button
            type="button"
            className="btn large"
            disabled={busy || !onDuty}
            onClick={() => void punchOutHandler()}
          >
            {busy ? '取得中…' : '退勤'}
          </button>
        </div>
        <p className="hint small">
          休憩は会社設定に従い自動控除（{formatDateJa(today)}）
        </p>
      </section>

      <TeamStatusTable employees={employees} records={records} workDate={today} />

      {isAdmin ? (
        <>
          <button
            type="button"
            className="btn ghost block"
            onClick={() => setShowCorrection((v) => !v)}
          >
            {showCorrection ? '修正画面を閉じる' : '打刻修正（管理者）'}
          </button>
          {showCorrection ? (
            <CorrectionPanel
              employees={employees}
              records={records}
              settings={settings}
              onChanged={refresh}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
