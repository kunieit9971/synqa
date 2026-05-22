import { useEffect, useMemo, useState } from 'react'
import { punchIn, punchOut } from '../api/data'
import { PunchStatusTable } from '../components/PunchStatusTable'
import { useAppData } from '../context/AppDataContext'
import { captureGps, isSecureContext } from '../lib/geo'
import {
  formatClock,
  formatDateJaWithWeekday,
  formatLiveClockParts,
  todayIsoDate,
} from '../lib/dates'
import { workMinutes, overtimeMinutes, formatMinutesJa } from '../lib/metrics'

export function PunchPage() {
  const { profile, settings, employees, records, refresh } = useAppData()
  const today = todayIsoDate()
  const [employeeId, setEmployeeId] = useState(profile?.employee_id ?? employees[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const clock = formatLiveClockParts(now)

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
  const doneToday = Boolean(todayRecord?.clock_out_at)

  const punchInHandler = async () => {
    if (!employeeId) {
      alert('打刻する担当を選んでください')
      return
    }
    if (!isSecureContext()) {
      alert('GPS打刻には HTTPS で開いてください')
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

  const statusLine = doneToday
    ? `本日の勤務は終了しました（出勤 ${formatClock(todayRecord!.clock_in_at)} / 退勤 ${formatClock(todayRecord!.clock_out_at)}）`
    : onDuty
      ? `勤務中 — 出勤 ${formatClock(todayRecord?.clock_in_at ?? openRecord?.clock_in_at ?? null)}`
      : null

  const summaryLine =
    doneToday && todayRecord
      ? `実働 ${formatMinutesJa(workMinutes(todayRecord, settings.break_windows))}${
          overtimeMinutes(
            todayRecord,
            settings.break_windows,
            settings.standard_work_minutes_per_day,
          ) > 0
            ? ` / 残業 ${formatMinutesJa(
                overtimeMinutes(
                  todayRecord,
                  settings.break_windows,
                  settings.standard_work_minutes_per_day,
                ),
              )}`
            : ''
        }`
      : null

  return (
    <div className="page-stack punch-page">
      <section className="panel punch-user-bar">
        <label className="field punch-user-field">
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
      </section>

      <section className="punch-simple" aria-label="打刻">
        {!isSecureContext() ? (
          <p className="warn punch-simple-warn">位置情報のため HTTPS でアクセスしてください</p>
        ) : null}

        <img
          className="punch-simple-logo"
          src="/icons/icon-192.png"
          alt="Synqa"
          width={72}
          height={72}
        />
        <p className="punch-simple-brand">Synqa</p>
        <p className="punch-simple-date">{formatDateJaWithWeekday(today)}</p>

        <div className="punch-simple-clock" aria-live="polite">
          <span className="punch-clock-hm">
            {clock.h}:{clock.m}
          </span>
          <span className="punch-clock-sec">:{clock.s}</span>
        </div>

        {statusLine ? <p className="punch-simple-status">{statusLine}</p> : null}
        {summaryLine ? <p className="punch-simple-summary">{summaryLine}</p> : null}

        {doneToday ? (
          <div className="punch-round-btn done" aria-disabled>
            退勤済み
          </div>
        ) : (
          <button
            type="button"
            className={`punch-round-btn ${onDuty ? 'is-out' : 'is-in'}`}
            disabled={busy || !employeeId}
            onClick={() => void (onDuty ? punchOutHandler() : punchInHandler())}
          >
            {busy ? '取得中…' : onDuty ? '退勤' : '出勤'}
          </button>
        )}
      </section>

      <PunchStatusTable employees={employees} records={records} workDate={today} />
    </div>
  )
}
