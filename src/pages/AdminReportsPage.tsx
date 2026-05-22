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
import {
  downloadPayrollCsv,
  formatSummaryRow,
  overtimeLimitMinutes,
} from '../lib/exportPayroll'
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

  const otLimitMin = overtimeLimitMinutes(settings, granularity)
  const otLimitHours =
    granularity === 'year'
      ? settings.monthly_overtime_limit_hours * 12
      : settings.monthly_overtime_limit_hours

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
          return formatSummaryRow(summary, otLimitMin)
        }),
    [employees, records, settings, granularity, focusYm, period, otLimitMin],
  )

  const overCount = rows.filter((r) => r.overLimit).length

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
    downloadPayrollCsv(employees, records, settings, {
      companyName: tenantName,
      periodLabel: `${granLabel} ${period.label}`,
      granularity: granLabel,
      monthlyOvertimeLimitHours: settings.monthly_overtime_limit_hours,
    }, period.start, period.end)
  }

  return (
    <div className="page-stack">
      <section className="panel panel-elevated">
        <h2 className="section-title">勤務・残業の確認</h2>
        <p className="period-label">{period.label}</p>

        <div className="segmented">
          <button
            type="button"
            className={granularity === 'week' ? 'active' : ''}
            onClick={() => setGranularity('week')}
          >
            週次
          </button>
          <button
            type="button"
            className={granularity === 'month' ? 'active' : ''}
            onClick={() => setGranularity('month')}
          >
            月次
          </button>
          <button
            type="button"
            className={granularity === 'year' ? 'active' : ''}
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
              ← 前週
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => setWeekAnchor(shiftWeekAnchor(weekAnchor, 1))}
            >
              翌週 →
            </button>
          </div>
        ) : null}

        {granularity === 'month' ? (
          <div className="chip-row">
            <button type="button" className="chip" onClick={() => shiftMonth(-1)}>
              ← 前月
            </button>
            <button type="button" className="chip" onClick={() => shiftMonth(1)}>
              翌月 →
            </button>
          </div>
        ) : null}

        {granularity === 'year' ? (
          <div className="chip-row">
            <button type="button" className="chip" onClick={() => setYear((y) => y - 1)}>
              ← 前年
            </button>
            <button type="button" className="chip" onClick={() => setYear((y) => y + 1)}>
              翌年 →
            </button>
          </div>
        ) : null}

        <div className="limit-banner">
          <span>残業上限 {otLimitHours}時間</span>
          {overCount > 0 ? (
            <span className="over-badge">{overCount}名が超過</span>
          ) : (
            <span className="ok-badge">超過なし</span>
          )}
        </div>

        <button type="button" className="btn primary block" onClick={exportExcel}>
          Excel用に出力（合計＋打刻ログ）
        </button>
        <p className="hint small">
          月次合計（ユーザー×月）と、日別の打刻ログ（出勤・退勤時刻・実働・残業）を1ファイルに出力します。
        </p>

        <div className="table-card">
          <table className="data-table reports-table">
            <thead>
              <tr>
                <th>担当</th>
                <th>日数</th>
                <th>実働</th>
                <th>残業</th>
                <th>上限まで</th>
                <th>超過</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.employeeId} className={r.overLimit ? 'row-over' : ''}>
                  <td className="name-cell">{r.displayName}</td>
                  <td>{r.daysWorked}</td>
                  <td>{r.workLabel}</td>
                  <td>{r.otLabel}</td>
                  <td>{r.remainLabel}</td>
                  <td>
                    {r.overLimit ? (
                      <span className="over-pill">+{r.overLabel}</span>
                    ) : (
                      <span className="muted-dash">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint small">
          超過は残業が上限を超えた時間です。休憩は自動控除済み。
          {granularity === 'week' ? ' 週次は月上限を目安に表示しています。' : null}
        </p>
      </section>
    </div>
  )
}
