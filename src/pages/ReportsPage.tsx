import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { currentPeriodFocusYm, payPeriodRange } from '../lib/period'
import { summarizeEmployeeMonth, formatMinutesJa } from '../lib/metrics'
import { todayIsoDate } from '../lib/dates'

export function ReportsPage() {
  const { settings, employees, records } = useAppData()
  const today = todayIsoDate()
  const [focusYm, setFocusYm] = useState(() =>
    currentPeriodFocusYm(today, settings.period_mode, settings.period_anchor_day),
  )

  const period = useMemo(
    () => payPeriodRange(focusYm, settings.period_mode, settings.period_anchor_day),
    [focusYm, settings],
  )

  const rows = useMemo(
    () =>
      employees
        .filter((e) => e.active)
        .map((e) =>
          summarizeEmployeeMonth(e.id, e.display_name, records, settings, focusYm),
        ),
    [employees, records, settings, focusYm],
  )

  const shiftYm = (delta: number) => {
    const [y, m] = focusYm.split('-').map(Number) as [number, number]
    const d = new Date(y, m - 1 + delta, 1)
    setFocusYm(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    )
  }

  const otLimitMin = settings.monthly_overtime_limit_hours * 60

  return (
    <div className="page-stack">
      <section className="panel">
        <h2 className="section-title">月次 勤務・残業</h2>
        <p className="hint">{period.label}</p>
        <div className="chip-row">
          <button type="button" className="chip" onClick={() => shiftYm(-1)}>
            前月
          </button>
          <button type="button" className="chip" onClick={() => shiftYm(1)}>
            翌月
          </button>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>担当</th>
                <th>出勤日数</th>
                <th>実働</th>
                <th>残業</th>
                <th>残り枠</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const remain = Math.max(0, otLimitMin - r.overtimeMinutes)
                const warn = r.overtimeMinutes >= otLimitMin
                return (
                  <tr key={r.employeeId}>
                    <td>{r.displayName}</td>
                    <td>{r.daysWorked}</td>
                    <td>{formatMinutesJa(r.workMinutes)}</td>
                    <td className={warn ? 'warn-cell' : ''}>
                      {formatMinutesJa(r.overtimeMinutes)}
                    </td>
                    <td>{formatMinutesJa(remain)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="hint small">
          残業上限 {settings.monthly_overtime_limit_hours}時間 / 月。休憩は自動控除済み。
        </p>
      </section>
    </div>
  )
}
