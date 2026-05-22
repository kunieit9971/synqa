export type BreakWindow = {
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
}

export type PeriodMode = 'calendar_month' | 'anchor_day'

export type TenantSettings = {
  tenant_id: string
  standard_work_minutes_per_day: number
  admin_password_hash: string
  period_mode: PeriodMode
  period_anchor_day: number
  break_windows: BreakWindow[]
  monthly_overtime_limit_hours: number
  theme_primary_color: string
  theme_accent_color: string
  updated_at: string
}

export type Employee = {
  id: string
  tenant_id: string
  display_name: string
  active: boolean
  sort_order: number
}

export type Profile = {
  user_id: string
  tenant_id: string
  role: 'admin' | 'member'
  display_name: string
  employee_id: string | null
}

export type AttendanceRecord = {
  id: string
  tenant_id: string
  employee_id: string
  work_date: string
  clock_in_at: string
  clock_out_at: string | null
  clock_in_lat: number
  clock_in_lng: number
  clock_out_lat: number | null
  clock_out_lng: number | null
}

export const DEFAULT_BREAK_WINDOWS: BreakWindow[] = [
  { startHour: 10, startMinute: 0, endHour: 10, endMinute: 30 },
  { startHour: 12, startMinute: 0, endHour: 13, endMinute: 0 },
  { startHour: 15, startMinute: 30, endHour: 16, endMinute: 0 },
]

export const DEFAULT_TENANT_SETTINGS: Omit<TenantSettings, 'tenant_id' | 'updated_at'> = {
  standard_work_minutes_per_day: 420,
  admin_password_hash: '',
  period_mode: 'calendar_month',
  period_anchor_day: 1,
  break_windows: DEFAULT_BREAK_WINDOWS,
  monthly_overtime_limit_hours: 20,
  theme_primary_color: '#0066FF',
  theme_accent_color: '#00C9A7',
}
