import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  defaultSettingsForTenant,
  fetchAllEmployees,
  fetchEmployees,
  fetchProfile,
  fetchRecords,
  fetchSettings,
  fetchTenantName,
} from '../api/data'
import { isoDaysAgo, todayIsoDate } from '../lib/dates'
import type { AttendanceRecord, Employee, Profile, TenantSettings } from '../types'
import { useAuth } from '../auth/AuthContext'

type RefreshOptions = {
  /** true のときだけ全画面ローディング（初回読込など） */
  blocking?: boolean
}

type AppDataValue = {
  loading: boolean
  refreshing: boolean
  profile: Profile | null
  tenantName: string
  settings: TenantSettings
  employees: Employee[]
  records: AttendanceRecord[]
  refresh: (opts?: RefreshOptions) => Promise<void>
}

const AppDataContext = createContext<AppDataValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tenantName, setTenantName] = useState('')
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  const refresh = useCallback(async (opts?: RefreshOptions) => {
    if (!auth.session) {
      setProfile(null)
      setLoading(false)
      setRefreshing(false)
      return
    }
    const blocking = opts?.blocking ?? false
    if (blocking || profile === null) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    try {
      const p = await fetchProfile()
      setProfile(p)
      if (!p) {
        setSettings(null)
        setEmployees([])
        setRecords([])
        return
      }
      const [name, sett, emps] = await Promise.all([
        fetchTenantName(p.tenant_id),
        fetchSettings(),
        p.role === 'admin' ? fetchAllEmployees() : fetchEmployees(),
      ])
      setTenantName(name)
      setSettings(sett ?? defaultSettingsForTenant(p.tenant_id))
      setEmployees(emps.filter((e) => e.active || p.role === 'admin'))
      const today = todayIsoDate()
      const recs = await fetchRecords(isoDaysAgo(62), today)
      setRecords(recs)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [auth.session, profile])

  useEffect(() => {
    void refresh({ blocking: true })
  }, [auth.session])

  const value = useMemo(
    () => ({
      loading,
      refreshing,
      profile,
      tenantName,
      settings: settings ?? defaultSettingsForTenant(profile?.tenant_id ?? ''),
      employees,
      records,
      refresh,
    }),
    [loading, refreshing, profile, tenantName, settings, employees, records, refresh],
  )

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  )
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('AppDataProvider required')
  return ctx
}
