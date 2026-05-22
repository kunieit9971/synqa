import type { EmployeeMonthSummary } from './metrics'
import { summarizeEmployeeMonth } from './metrics'
import { formatMinutesJa } from './metrics'
import type { ReportGranularity } from './period'
import type { Employee, TenantSettings } from '../types'
import type { AttendanceRecord } from '../types'

function minutesToDecimalHours(minutes: number): string {
  return (minutes / 60).toFixed(2)
}

function csvCell(s: string): string {
  const t = s.replace(/"/g, '""')
  return /[",\n\r]/.test(t) ? `"${t}"` : t
}

/** 期間内の暦月 YYYY-MM 一覧 */
export function monthsBetween(startIso: string, endIso: string): string[] {
  const out: string[] = []
  let y = Number(startIso.slice(0, 4))
  let m = Number(startIso.slice(5, 7))
  const endY = Number(endIso.slice(0, 4))
  const endM = Number(endIso.slice(5, 7))
  while (y < endY || (y === endY && m <= endM)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return out
}

export type PayrollExportMeta = {
  companyName: string
  periodLabel: string
  granularity: string
  monthlyOvertimeLimitHours: number
}

/** 集計区分ごとの残業上限（分）— 画面表示用 */
export function overtimeLimitMinutes(
  settings: TenantSettings,
  granularity: ReportGranularity,
): number {
  const monthly = settings.monthly_overtime_limit_hours * 60
  if (granularity === 'year') return monthly * 12
  return monthly
}

export type MonthlyExportRow = {
  employeeId: string
  displayName: string
  yearMonth: string
  daysWorked: number
  workMinutes: number
  overtimeMinutes: number
  overMinutes: number
}

export function buildMonthlyExportRows(
  employees: Employee[],
  records: AttendanceRecord[],
  settings: TenantSettings,
  startIso: string,
  endIso: string,
): MonthlyExportRow[] {
  const months = monthsBetween(startIso, endIso)
  const monthlyLimitMin = settings.monthly_overtime_limit_hours * 60
  const rows: MonthlyExportRow[] = []

  for (const ym of months) {
    for (const e of employees.filter((x) => x.active)) {
      const s = summarizeEmployeeMonth(e.id, e.display_name, records, settings, ym)
      const overMin = Math.max(0, s.overtimeMinutes - monthlyLimitMin)
      rows.push({
        employeeId: e.id,
        displayName: s.displayName,
        yearMonth: ym,
        daysWorked: s.daysWorked,
        workMinutes: s.workMinutes,
        overtimeMinutes: s.overtimeMinutes,
        overMinutes: overMin,
      })
    }
  }

  return rows
}

/** 給与計算用 CSV（ユーザー×月ごとの合計） */
export function downloadPayrollCsv(
  employees: Employee[],
  records: AttendanceRecord[],
  settings: TenantSettings,
  meta: PayrollExportMeta,
  startIso: string,
  endIso: string,
): void {
  const monthlyRows = buildMonthlyExportRows(
    employees,
    records,
    settings,
    startIso,
    endIso,
  )
  const limitH = meta.monthlyOvertimeLimitHours

  const header = [
    '会社名',
    '担当名',
    '対象年月',
    '出力期間',
    '出勤日数',
    '合計勤務時間_分',
    '合計勤務時間_時間',
    '合計残業時間_分',
    '合計残業時間_時間',
    '残業上限_時間_月',
    '超過時間_分',
    '超過時間_時間',
    '超過あり',
  ]

  const lines: string[] = [header.join(',')]
  for (const r of monthlyRows) {
    lines.push(
      [
        meta.companyName,
        r.displayName,
        r.yearMonth,
        meta.periodLabel,
        String(r.daysWorked),
        String(r.workMinutes),
        minutesToDecimalHours(r.workMinutes),
        String(r.overtimeMinutes),
        minutesToDecimalHours(r.overtimeMinutes),
        String(limitH),
        String(r.overMinutes),
        minutesToDecimalHours(r.overMinutes),
        r.overMinutes > 0 ? '超過' : '',
      ]
        .map(csvCell)
        .join(','),
    )
  }

  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safePeriod = meta.periodLabel.replace(/[^\d\-年月日週次〜\s]/g, '').slice(0, 40)
  a.href = url
  a.download = `synqa_給与用_月別_${safePeriod || 'export'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export type SummaryRowView = EmployeeMonthSummary & {
  workLabel: string
  otLabel: string
  remainLabel: string
  overLabel: string
  overMinutes: number
  overLimit: boolean
}

/** 画面表示用（時間表記） */
export function formatSummaryRow(
  r: EmployeeMonthSummary,
  otLimitMin: number,
): SummaryRowView {
  const remainMin = otLimitMin - r.overtimeMinutes
  const overMin = Math.max(0, -remainMin)
  return {
    ...r,
    workLabel: formatMinutesJa(r.workMinutes),
    otLabel: formatMinutesJa(r.overtimeMinutes),
    remainLabel: remainMin > 0 ? formatMinutesJa(remainMin) : '—',
    overLabel: overMin > 0 ? formatMinutesJa(overMin) : '—',
    overMinutes: overMin,
    overLimit: overMin > 0,
  }
}
