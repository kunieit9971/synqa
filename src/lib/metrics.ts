import type { AttendanceRecord, BreakWindow, TenantSettings } from '../types'
import { breakMinutesInWorkSpan } from './breaks'
import { isDateInRange, payPeriodRange } from './period'

function parseMs(iso: string): number | null {
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : null
}

export function grossMinutes(
  r: AttendanceRecord,
  asOfMs = Date.now(),
): number {
  const start = parseMs(r.clock_in_at)
  if (start === null) return 0
  const end = r.clock_out_at ? parseMs(r.clock_out_at) : asOfMs
  if (end === null || end < start) return 0
  return Math.round((end - start) / 60000)
}

export function breakMinutes(
  r: AttendanceRecord,
  windows: BreakWindow[],
): number {
  if (!r.clock_out_at) return 0
  return breakMinutesInWorkSpan(
    r.work_date,
    r.clock_in_at,
    r.clock_out_at,
    windows,
  )
}

export function workMinutes(
  r: AttendanceRecord,
  windows: BreakWindow[],
  asOfMs = Date.now(),
): number {
  const gross = grossMinutes(r, asOfMs)
  if (!r.clock_out_at) return Math.max(0, gross)
  return Math.max(0, gross - breakMinutes(r, windows))
}

export function overtimeMinutes(
  r: AttendanceRecord,
  windows: BreakWindow[],
  standardPerDay: number,
  asOfMs = Date.now(),
): number {
  return Math.max(0, workMinutes(r, windows, asOfMs) - standardPerDay)
}

export function formatMinutesJa(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h <= 0) return `${m}分`
  if (m === 0) return `${h}時間`
  return `${h}時間${m}分`
}

export type EmployeeMonthSummary = {
  employeeId: string
  displayName: string
  workMinutes: number
  overtimeMinutes: number
  daysWorked: number
}

export function summarizeEmployeeInRange(
  employeeId: string,
  displayName: string,
  records: AttendanceRecord[],
  settings: TenantSettings,
  start: string,
  end: string,
): EmployeeMonthSummary {
  const windows = settings.break_windows
  const std = settings.standard_work_minutes_per_day
  let work = 0
  let ot = 0
  let days = 0
  for (const r of records) {
    if (r.employee_id !== employeeId) continue
    if (!isDateInRange(r.work_date, start, end)) continue
    days += 1
    work += workMinutes(r, windows)
    if (r.clock_out_at) ot += overtimeMinutes(r, windows, std)
  }
  return {
    employeeId,
    displayName,
    workMinutes: work,
    overtimeMinutes: ot,
    daysWorked: days,
  }
}

export function summarizeEmployeeMonth(
  employeeId: string,
  displayName: string,
  records: AttendanceRecord[],
  settings: TenantSettings,
  focusYm: string,
): EmployeeMonthSummary {
  const { start, end } = payPeriodRange(
    focusYm,
    settings.period_mode,
    settings.period_anchor_day,
  )
  return summarizeEmployeeInRange(
    employeeId,
    displayName,
    records,
    settings,
    start,
    end,
  )
}

export type TodayStatus = 'in' | 'out' | 'none'

export function summarizeEmployeeYear(
  employeeId: string,
  displayName: string,
  records: AttendanceRecord[],
  settings: TenantSettings,
  year: number,
): EmployeeMonthSummary {
  return summarizeEmployeeInRange(
    employeeId,
    displayName,
    records,
    settings,
    `${year}-01-01`,
    `${year}-12-31`,
  )
}

export function resolveTodayStatus(
  records: AttendanceRecord[],
  employeeId: string,
  workDate: string,
): TodayStatus {
  const day = records.filter(
    (r) => r.employee_id === employeeId && r.work_date === workDate,
  )
  if (day.some((r) => r.clock_in_at && !r.clock_out_at)) return 'in'
  if (day.some((r) => r.clock_out_at)) return 'out'
  return 'none'
}
