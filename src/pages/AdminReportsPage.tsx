import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import {
  currentPeriodFocusYm,
  payPeriodRange,
  weekRange,
  yearRange,
  shiftWeekAnchor,
  type ReportGranularity,
} from '../lib/period'
import { summarizeEmployeeInRange, summarizeEmployeeMonth } from '../lib/metrics'
import { downloadPayrollCsv, formatSummaryRow } from '../lib/exportPayroll'
import { todayIsoDate } from '../lib/dates'

export function AdminReportsPage() {
  const { tenantName, settings, employees, records } = useAppData()
  const today = todayIsoDate()
  const [granularity, setGranularity] = useState<ReportGranularity>('month')
  const [focusYm, setFocusYm] = useState(() =>
    currentPeriodFocusYm(today, settings.period_mode, settings.period_anchor_day),
  )
  const [weekAnchor, setWeekAnchor] = useState(today)
  const [year, setYear] = useState(() => new Date().getFullYear())

  const period = useMemo(() => {
    if (granularity === 'week') return weekRange(weekAnchor)
    if (granularity === 'year') return yearRange(year)
    return payPeriodRange(focusYm, settings.period_mode, settings.period_anchor_day)
  }, [granularity, weekAnchor, year, focusYm, settings])

  const rows = useMemo(
    () =>
      employees
        .filter((e) => e.active)
        .map((e) => {
          const summary =
            granularity === 'month'
              ? summarizeEmployeeMonth(
                  e.id,
                  e.display_name,
                  records,
                  settings,
                  focusYm,
                )
              : summarizeEmployeeInRange(
                  e.id,
                  e.display_name,
                  records,
                  settings,
                  period.start,
                  period.end,
                )
          return formatSummaryRow(
            summary,
            settings.monthly_overtime_limit_hours * 60,
          )
        }),
    [employees, records, settings, granularity, focusYm, period, weekAnchor, year],
  )

  const granLabel =
    granularity === 'week' ? '週次' : granularity === 'month' ? '月次' : '年次'

  const shiftMonth = (delta: number) => {
    const [y, m] = focusYm.split('-').map(Number) as [number, number]
    const d = new Date(y, m - 1 + delta, 1)
    setFocusYm(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    )
  }

  const exportExcel = () => {
    const raw = employees
      .filter((e) => e.active)
      .map((e) =>
        granularity === 'month'
          ? summarizeEmployeeMonth(e.id, e.display_name, records, settings, focusYm)
          : summarizeEmployeeInRange(
              e.id,
              e.display_name,
              records,
              settings,
              period.start,
              period.end,
            ),
      )
    downloadPayrollCsv(raw, {
      companyName: tenantName,
      periodLabel: period.label,
      granularity: granLabel,
      overtimeLimitHours: settings.monthly_overtime_limit_hours,
    })
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <h2 className="section-title">勤務・残業の確認</h2>
        <p className="hint">{period.label}</p>

        <div className="chip-row">
          <button
            type="button"
            className={`chip ${granularity === 'week' ? 'active' : ''}`}
            onClick={() => setGranularity('week')}
          >
            週次
          </button>
          <button
            type="button"
            className={`chip ${granularity === 'month' ? 'active' : ''}`}
            onClick={() => setGranularity('month')}
          >
            月次
          </button>
          <button
            type="button"
            className={`chip ${granularity === 'year' ? 'active' : ''}`}
            onClick={() => setGranularity('year')}
          >
            年次
          </button>
        </div>

        {granularity === 'week' ? (
          <div className="chip-row">
            <button
              type="button"
              className="chip"
              onClick={() => setWeekAnchor(shiftWeekAnchor(weekAnchor, -1))}
            >
              前週
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => setWeekAnchor(shiftWeekAnchor(weekAnchor, 1))}
            >
              翌週
            </button>
          </div>
        ) : null}

        {granularity === 'month' ? (
          <div className="chip-row">
            <button type="button" className="chip" onClick={() => shiftMonth(-1)}>
              前月
            </button>
            <button type="button" className="chip" onClick={() => shiftMonth(1)}>
              翌月
            </button>
          </div>
        ) : null}

        {granularity === 'year' ? (
          <div className="chip-row">
            <button type="button" className="chip" onClick={() => setYear((y) => y - 1)}>
              前年
            </button>
            <button type="button" className="chip" onClick={() => setYear((y) => y + 1)}>
              翌年
            </button>
          </div>
        ) : null}

        <button type="button" className="btn primary block" onClick={exportExcel}>
          Excel用に出力（CSV）
        </button>
        <p className="hint small">
          CSV を Excel で開いて給与計算に利用できます（UTF-8・実働/残業は分と時間の両方）。
        </p>

        <div className="table-scroll tall">
          <table className="data-table">
            <thead>
              <tr>
                <th>担当</th>
                <th>出勤日数</th>
                <th>実働</th>
                <th>残業</th>
                <th>残業上限まで</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.employeeId}>
                  <td>{r.displayName}</td>
                  <td>{r.daysWorked}</td>
                  <td>{r.workLabel}</td>
                  <td className={r.overLimit ? 'warn-cell' : ''}>{r.otLabel}</td>
                  <td>{r.remainLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint small">
          残業上限 {settings.monthly_overtime_limit_hours}時間
          {granularity === 'month' ? ' / 月' : granularity === 'week' ? '（月上限を参照）' : ' / 年次は月上限×12目安'}
          ・休憩は自動控除済み。
        </p>
      </section>
    </div>
  )
}
