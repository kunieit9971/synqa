import { getSupabase } from '../supabaseClient'
import type {
  AttendanceRecord,
  BreakWindow,
  Employee,
  Profile,
  TenantSettings,
} from '../types'
import { DEFAULT_BREAK_WINDOWS, DEFAULT_TENANT_SETTINGS } from '../types'

function normalizeBreakWindows(raw: unknown): BreakWindow[] {
  if (!Array.isArray(raw)) return DEFAULT_BREAK_WINDOWS
  const out: BreakWindow[] = []
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    const startHour = Number(o.startHour)
    const startMinute = Number(o.startMinute)
    const endHour = Number(o.endHour)
    const endMinute = Number(o.endMinute)
    if (
      !Number.isFinite(startHour) ||
      !Number.isFinite(startMinute) ||
      !Number.isFinite(endHour) ||
      !Number.isFinite(endMinute)
    ) {
      continue
    }
    out.push({ startHour, startMinute, endHour, endMinute })
  }
  return out.length > 0 ? out : DEFAULT_BREAK_WINDOWS
}

export function normalizeSettings(row: Record<string, unknown>): TenantSettings {
  return {
    tenant_id: String(row.tenant_id ?? ''),
    standard_work_minutes_per_day: Number(row.standard_work_minutes_per_day) || 420,
    admin_password_hash: String(row.admin_password_hash ?? ''),
    period_mode:
      row.period_mode === 'anchor_day' ? 'anchor_day' : 'calendar_month',
    period_anchor_day: Math.min(
      28,
      Math.max(1, Number(row.period_anchor_day) || 1),
    ),
    break_windows: normalizeBreakWindows(row.break_windows),
    monthly_overtime_limit_hours: Number(row.monthly_overtime_limit_hours) || 20,
    theme_primary_color: String(row.theme_primary_color ?? '#0066FF'),
    theme_accent_color: String(row.theme_accent_color ?? '#00C9A7'),
    updated_at: String(row.updated_at ?? ''),
  }
}

export async function fetchProfile(): Promise<Profile | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data: user } = await sb.auth.getUser()
  if (!user.user) return null
  const { data, error } = await sb
    .from('profiles')
    .select('user_id, tenant_id, role, display_name, employee_id')
    .eq('user_id', user.user.id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return data as Profile
}

export async function fetchTenantName(tenantId: string): Promise<string> {
  const sb = getSupabase()
  if (!sb) return tenantId
  const { data, error } = await sb
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .maybeSingle()
  if (error) throw error
  return data?.name ?? tenantId
}

export async function fetchSettings(): Promise<TenantSettings | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('tenant_settings').select('*').maybeSingle()
  if (error) throw error
  if (!data) return null
  return normalizeSettings(data as Record<string, unknown>)
}

export async function updateSettings(
  patch: Partial<
    Pick<
      TenantSettings,
      | 'standard_work_minutes_per_day'
      | 'admin_password_hash'
      | 'period_mode'
      | 'period_anchor_day'
      | 'break_windows'
      | 'monthly_overtime_limit_hours'
      | 'theme_primary_color'
      | 'theme_accent_color'
    >
  >,
): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase未設定')
  const profile = await fetchProfile()
  if (!profile || profile.role !== 'admin') throw new Error('管理者のみ')
  const { error } = await sb
    .from('tenant_settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('tenant_id', profile.tenant_id)
  if (error) throw error
}

export async function fetchEmployees(): Promise<Employee[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb
    .from('employees')
    .select('*')
    .eq('active', true)
    .order('sort_order')
    .order('display_name')
  if (error) throw error
  return (data ?? []) as Employee[]
}

export async function fetchAllEmployees(): Promise<Employee[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb
    .from('employees')
    .select('*')
    .order('sort_order')
    .order('display_name')
  if (error) throw error
  return (data ?? []) as Employee[]
}

export async function upsertEmployee(
  row: Pick<Employee, 'id' | 'display_name' | 'active' | 'sort_order'> | {
    display_name: string
    active: boolean
    sort_order: number
  },
): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase未設定')
  const profile = await fetchProfile()
  if (!profile || profile.role !== 'admin') throw new Error('管理者のみ')
  if ('id' in row && row.id) {
    const { error } = await sb
      .from('employees')
      .update({
        display_name: row.display_name,
        active: row.active,
        sort_order: row.sort_order,
      })
      .eq('id', row.id)
    if (error) throw error
    return
  }
  const { error } = await sb.from('employees').insert({
    tenant_id: profile.tenant_id,
    display_name: row.display_name,
    active: row.active,
    sort_order: row.sort_order,
  })
  if (error) throw error
}

export async function fetchRecords(
  minDate: string,
  maxDate: string,
): Promise<AttendanceRecord[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb
    .from('attendance_records')
    .select('*')
    .gte('work_date', minDate)
    .lte('work_date', maxDate)
    .order('work_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as AttendanceRecord[]
}

export async function punchIn(
  employeeId: string,
  gps: { lat: number; lng: number },
): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase未設定')
  const profile = await fetchProfile()
  if (!profile) throw new Error('未ログイン')
  const now = new Date()
  const workDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const { error } = await sb.from('attendance_records').insert({
    tenant_id: profile.tenant_id,
    employee_id: employeeId,
    work_date: workDate,
    clock_in_at: now.toISOString(),
    clock_out_at: null,
    clock_in_lat: gps.lat,
    clock_in_lng: gps.lng,
  })
  if (error) throw error
}

export async function punchOut(
  recordId: string,
  gps: { lat: number; lng: number },
): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase未設定')
  const { error } = await sb
    .from('attendance_records')
    .update({
      clock_out_at: new Date().toISOString(),
      clock_out_lat: gps.lat,
      clock_out_lng: gps.lng,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordId)
  if (error) throw error
}

export async function deleteRecord(id: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase未設定')
  const { error } = await sb.from('attendance_records').delete().eq('id', id)
  if (error) throw error
}

export async function saveRecordCorrection(
  id: string,
  clockInIso: string,
  clockOutIso: string | null,
  workDate: string,
): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase未設定')
  const { error } = await sb
    .from('attendance_records')
    .update({
      clock_in_at: clockInIso,
      clock_out_at: clockOutIso,
      work_date: workDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function addManualRecord(
  employeeId: string,
  clockInIso: string,
  clockOutIso: string | null,
  workDate: string,
): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase未設定')
  const profile = await fetchProfile()
  if (!profile) throw new Error('未ログイン')
  const { error } = await sb.from('attendance_records').insert({
    tenant_id: profile.tenant_id,
    employee_id: employeeId,
    work_date: workDate,
    clock_in_at: clockInIso,
    clock_out_at: clockOutIso,
    clock_in_lat: 0,
    clock_in_lng: 0,
    clock_out_lat: clockOutIso ? 0 : null,
    clock_out_lng: clockOutIso ? 0 : null,
  })
  if (error) throw error
}

export async function registerNewTenant(
  slug: string,
  companyName: string,
  displayName: string,
): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase未設定')
  const { error } = await sb.rpc('register_new_tenant', {
    p_slug: slug,
    p_company_name: companyName,
    p_user_display_name: displayName,
  })
  if (error) throw error
}

export async function joinTenant(slug: string, displayName: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase未設定')
  const { error } = await sb.rpc('join_tenant', {
    p_slug: slug,
    p_user_display_name: displayName,
  })
  if (error) throw error
}

export function defaultSettingsForTenant(tenantId: string): TenantSettings {
  return {
    tenant_id: tenantId,
    updated_at: '',
    ...DEFAULT_TENANT_SETTINGS,
  }
}
