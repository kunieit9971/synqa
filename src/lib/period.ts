import type { PeriodMode } from '../types'

export type ReportGranularity = 'week' | 'month' | 'year'

/** 暦月 YYYY-MM */
export function calendarMonthKey(isoDate: string): string {
  return isoDate.slice(0, 7)
}

/** anchor_day 締め: 当月 anchor 〜 翌月 anchor-1 */
export function payPeriodRange(
  focusYm: string,
  mode: PeriodMode,
  anchorDay: number,
): { start: string; end: string; label: string } {
  if (mode === 'calendar_month') {
    const [y, m] = focusYm.split('-').map(Number) as [number, number]
    const last = new Date(y, m, 0).getDate()
    const start = `${focusYm}-01`
    const end = `${focusYm}-${String(last).padStart(2, '0')}`
    return { start, end, label: `${y}年${m}月（1日〜月末）` }
  }
  const [y, m] = focusYm.split('-').map(Number) as [number, number]
  const ad = Math.min(Math.max(1, anchorDay), 28)
  const startDt = new Date(y, m - 1, ad)
  const endDt = new Date(y, m, ad)
  endDt.setDate(endDt.getDate() - 1)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return {
    start: fmt(startDt),
    end: fmt(endDt),
    label: `${fmt(startDt)} 〜 ${fmt(endDt)}（${ad}日始まり）`,
  }
}

export function isDateInRange(isoDate: string, start: string, end: string): boolean {
  return isoDate >= start && isoDate <= end
}

export function currentPeriodFocusYm(
  today: string,
  mode: PeriodMode,
  anchorDay: number,
): string {
  if (mode === 'calendar_month') return today.slice(0, 7)
  const [y, m, d] = today.split('-').map(Number) as [number, number, number]
  const ad = Math.min(Math.max(1, anchorDay), 28)
  if (d >= ad) return `${y}-${String(m).padStart(2, '0')}`
  const dt = new Date(y, m - 2, 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

function fmtIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 月〜日 の週（月曜始まり） */
export function weekRange(anchorDate: string): { start: string; end: string; label: string } {
  const [y, m, d] = anchorDate.split('-').map(Number) as [number, number, number]
  const dt = new Date(y, m - 1, d)
  const dow = dt.getDay()
  const diffToMon = dow === 0 ? -6 : 1 - dow
  const mon = new Date(dt)
  mon.setDate(mon.getDate() + diffToMon)
  const sun = new Date(mon)
  sun.setDate(sun.getDate() + 6)
  return {
    start: fmtIso(mon),
    end: fmtIso(sun),
    label: `${fmtIso(mon)} 〜 ${fmtIso(sun)}（週次）`,
  }
}

export function yearRange(year: number): { start: string; end: string; label: string } {
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    label: `${year}年（年次）`,
  }
}

export function shiftWeekAnchor(anchor: string, deltaWeeks: number): string {
  const [y, m, d] = anchor.split('-').map(Number) as [number, number, number]
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + deltaWeeks * 7)
  return fmtIso(dt)
}
