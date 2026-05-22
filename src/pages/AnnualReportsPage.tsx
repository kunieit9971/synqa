import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { formatMinutesJa, summarizeEmployeeYear } from '../lib/metrics'

export function AnnualReportsPage() {
  const { settings, employees, records } = useAppData()
  const [year, setYear] = useState(() => new Date().getFullYear())

  const rows = useMemo(
    () =>
      employees
        .filter((e) => e.active)
        .map((e) => summarizeEmployeeYear(e.id, e.display_name, records, settings, year)),
    [employees, records, settings, year],
  )

  const totals = useMemo(() => {
    let work = 0
    let ot = 0
    let days = 0
    for (const r of rows) {
      work += r.workMinutes
      ot += r.overtimeMinutes
      days += r.daysWorked
    }
    return { work, ot, days }
  }, [rows])

  return (
    <div className="page-stack">
      <section className="panel">
        <h2 className="section-title">年次 勤務・残業</h2>
        <div className="chip-row">
          <button type="button" className="chip" onClick={() => setYear((y) => y - 1)}>
            前年
          </button>
          <span className="chip active">{year}年</span>
          <button type="button" className="chip" onClick={() => setYear((y) => y + 1)}>
            翌年
          </button>
        </div>
        <p className="hint">
          暦年（1月〜12月）の合計。月次の締め設定とは別集計です。
        </p>
        <div className="summary-cards annual">
          <div className="summary-card">
            <span className="num">{totals.days}</span>
            <span className="lbl">出勤日数合計</span>
          </div>
          <div className="summary-card">
            <span className="num">{formatMinutesJa(totals.work)}</span>
            <span className="lbl">実働合計</span>
          </div>
          <div className="summary-card warn">
            <span className="num">{formatMinutesJa(totals.ot)}</span>
            <span className="lbl">残業合計</span>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>担当</th>
                <th>出勤日数</th>
                <th>実働</th>
                <th>残業</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.employeeId}>
                  <td>{r.displayName}</td>
                  <td>{r.daysWorked}</td>
                  <td>{formatMinutesJa(r.workMinutes)}</td>
                  <td
                    className={
                      r.overtimeMinutes >=
                      settings.monthly_overtime_limit_hours * 60 * 12
                        ? 'warn-cell'
                        : ''
                    }
                  >
                    {formatMinutesJa(r.overtimeMinutes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
