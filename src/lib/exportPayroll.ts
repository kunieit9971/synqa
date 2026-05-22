import type { EmployeeMonthSummary } from './metrics'
import { formatMinutesJa } from './metrics'

function minutesToDecimalHours(minutes: number): string {
  return (minutes / 60).toFixed(2)
}

function csvCell(s: string): string {
  const t = s.replace(/"/g, '""')
  return /[",\n\r]/.test(t) ? `"${t}"` : t
}

export type PayrollExportMeta = {
  companyName: string
  periodLabel: string
  granularity: string
  overtimeLimitHours: number
}

export function downloadPayrollCsv(
  rows: EmployeeMonthSummary[],
  meta: PayrollExportMeta,
): void {
  const header = [
    '会社名',
    '集計区分',
    '期間',
    '残業上限時間',
    '担当名',
    '出勤日数',
    '実働時間_分',
    '実働時間_時間',
    '残業時間_分',
    '残業時間_時間',
    '残業上限まで_分',
    '残業超過',
  ]

  const lines: string[] = [header.join(',')]
  for (const r of rows) {
    const remain = Math.max(
      0,
      meta.overtimeLimitHours * 60 - r.overtimeMinutes,
    )
    const over = r.overtimeMinutes > meta.overtimeLimitHours * 60
    lines.push(
      [
        meta.companyName,
        meta.granularity,
        meta.periodLabel,
        String(meta.overtimeLimitHours),
        r.displayName,
        String(r.daysWorked),
        String(r.workMinutes),
        minutesToDecimalHours(r.workMinutes),
        String(r.overtimeMinutes),
        minutesToDecimalHours(r.overtimeMinutes),
        String(remain),
        over ? '超過' : '',
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
  a.download = `synqa_給与用_${meta.granularity}_${safePeriod || 'export'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/** 画面表示用（時間表記） */
export function formatSummaryRow(r: EmployeeMonthSummary, otLimitMin: number) {
  return {
    ...r,
    workLabel: formatMinutesJa(r.workMinutes),
    otLabel: formatMinutesJa(r.overtimeMinutes),
    remainLabel: formatMinutesJa(Math.max(0, otLimitMin - r.overtimeMinutes)),
    overLimit: r.overtimeMinutes >= otLimitMin,
  }
}
