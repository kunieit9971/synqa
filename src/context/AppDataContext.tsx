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

type AppDataValue = {
  loading: boolean
  profile: Profile | null
  tenantName: string
  settings: TenantSettings
  employees: Employee[]
  records: AttendanceRecord[]
  refresh: () => Promise<void>
}

const AppDataContext = createContext<AppDataValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tenantName, setTenantName] = useState('')
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  const refresh = useCallback(async () => {
    if (!auth.session) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
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
    }
  }, [auth.session])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      loading,
      profile,
      tenantName,
      settings: settings ?? defaultSettingsForTenant(profile?.tenant_id ?? ''),
      employees,
      records,
      refresh,
    }),
    [loading, profile, tenantName, settings, employees, records, refresh],
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
