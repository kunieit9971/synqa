import { useEffect, useState } from 'react'
import {
  fetchAllEmployees,
  updateSettings,
  upsertEmployee,
} from '../api/data'
import { getSupabase } from '../supabaseClient'
import { useAppData } from '../context/AppDataContext'
import { CorrectionPanel } from '../components/CorrectionPanel'
import { BreakWindowsEditor } from '../components/BreakWindowsEditor'
import { hashPassword } from '../lib/password'
import { DEFAULT_THEME_ACCENT, DEFAULT_THEME_PRIMARY } from '../lib/theme'
import type { BreakWindow, PeriodMode } from '../types'

type SettingsSection = 'work' | 'users' | 'correction' | 'period' | 'theme'

export function SettingsPage() {
  const { profile, settings, employees: activeEmployees, records, refresh } = useAppData()
  const isAdmin = profile?.role === 'admin'
  const [section, setSection] = useState<SettingsSection>('work')
  const [employees, setEmployees] = useState<{ id?: string; name: string; active: boolean }[]>(
    [],
  )
  const [periodMode, setPeriodMode] = useState<PeriodMode>(settings.period_mode)
  const [anchorDay, setAnchorDay] = useState(settings.period_anchor_day)
  const [stdHours, setStdHours] = useState(
    String(Math.floor(settings.standard_work_minutes_per_day / 60)),
  )
  const [otLimit, setOtLimit] = useState(String(settings.monthly_overtime_limit_hours))
  const [breakWindows, setBreakWindows] = useState<BreakWindow[]>(settings.break_windows)
  const [adminPw, setAdminPw] = useState('')
  const [adminPw2, setAdminPw2] = useState('')
  const [myEmployeeId, setMyEmployeeId] = useState(profile?.employee_id ?? '')
  const [newEmpName, setNewEmpName] = useState('')
  const [themePrimary, setThemePrimary] = useState(settings.theme_primary_color)
  const [themeAccent, setThemeAccent] = useState(settings.theme_accent_color)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    void fetchAllEmployees().then((list) =>
      setEmployees(
        list.map((e) => ({ id: e.id, name: e.display_name, active: e.active })),
      ),
    )
    setBreakWindows(settings.break_windows)
    setPeriodMode(settings.period_mode)
    setAnchorDay(settings.period_anchor_day)
    setStdHours(String(Math.floor(settings.standard_work_minutes_per_day / 60)))
    setOtLimit(String(settings.monthly_overtime_limit_hours))
    setThemePrimary(settings.theme_primary_color)
    setThemeAccent(settings.theme_accent_color)
  }, [settings.updated_at])

  if (!isAdmin) {
    return (
      <div className="page-stack">
        <section className="panel">
          <h2 className="section-title">設定</h2>
          <p className="hint">管理者モードでのみ会社設定を変更できます。</p>
          <label className="field">
            <span>自分の打刻担当</span>
            <select
              className="input"
              value={myEmployeeId}
              onChange={(e) => setMyEmployeeId(e.target.value)}
            >
              <option value="">未設定</option>
              {activeEmployees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.display_name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn primary" onClick={() => void saveMyLink()}>
            保存
          </button>
        </section>
      </div>
    )
  }

  async function saveMyLink() {
    const sb = getSupabase()
    if (!sb || !profile) return
    await sb
      .from('profiles')
      .update({ employee_id: myEmployeeId || null })
      .eq('user_id', profile.user_id)
    setMsg('自分の打刻担当を保存しました')
    await refresh()
  }

  const saveWorkRules = async () => {
    const patch: Parameters<typeof updateSettings>[0] = {
      standard_work_minutes_per_day: Math.max(1, Number(stdHours) || 7) * 60,
      monthly_overtime_limit_hours: Math.max(0, Number(otLimit) || 20),
      break_windows: breakWindows,
    }
    await updateSettings(patch)
    setMsg('勤務・休憩・残業上限を保存しました')
    await refresh()
  }

  const savePeriodAndPw = async () => {
    const patch: Parameters<typeof updateSettings>[0] = {
      period_mode: periodMode,
      period_anchor_day: anchorDay,
    }
    if (adminPw.trim()) {
      if (adminPw !== adminPw2) {
        setMsg('管理者パスワードが一致しません')
        return
      }
      patch.admin_password_hash = await hashPassword(adminPw)
    }
    await updateSettings(patch)
    setAdminPw('')
    setAdminPw2('')
    setMsg('期間設定・管理者パスワードを保存しました')
    await refresh()
  }

  const saveEmployees = async () => {
    for (const [i, e] of employees.entries()) {
      if (e.id) {
        await upsertEmployee({
          id: e.id,
          display_name: e.name.trim() || '無名',
          active: e.active,
          sort_order: i,
        })
      }
    }
    setMsg('社員一覧を保存しました')
    await refresh()
  }

  const addEmployee = async () => {
    if (!newEmpName.trim()) return
    await upsertEmployee({
      display_name: newEmpName.trim(),
      active: true,
      sort_order: employees.length,
    })
    setNewEmpName('')
    setMsg('社員を追加しました')
    await refresh()
  }

  const deactivateEmployee = async (id: string, name: string) => {
    if (!window.confirm(`「${name}」を無効化（削除）しますか？`)) return
    await upsertEmployee({
      id,
      display_name: name,
      active: false,
      sort_order: 999,
    })
    setMsg('社員を無効化しました')
    await refresh()
  }

  const saveTheme = async () => {
    await updateSettings({
      theme_primary_color: themePrimary,
      theme_accent_color: themeAccent,
    })
    setMsg('画面の色を保存しました')
    await refresh()
  }

  const resetTheme = () => {
    setThemePrimary(DEFAULT_THEME_PRIMARY)
    setThemeAccent(DEFAULT_THEME_ACCENT)
  }

  const sections: { id: SettingsSection; label: string }[] = [
    { id: 'work', label: '勤務' },
    { id: 'users', label: 'ユーザー' },
    { id: 'correction', label: '修正' },
    { id: 'period', label: '期間' },
    { id: 'theme', label: '色' },
  ]

  return (
    <div className="page-stack">
      <div className="settings-tabs cols-5">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            className={section === s.id ? 'active' : ''}
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'work' ? (
        <section className="panel">
          <h2 className="section-title">勤務時間・休憩・残業上限</h2>
          <label className="field">
            <span>所定労働（時間/日）</span>
            <input
              type="number"
              min={1}
              max={16}
              className="input"
              value={stdHours}
              onChange={(e) => setStdHours(e.target.value)}
            />
          </label>
          <label className="field">
            <span>月の残業上限（時間）</span>
            <input
              type="number"
              min={0}
              className="input"
              value={otLimit}
              onChange={(e) => setOtLimit(e.target.value)}
            />
          </label>
          <p className="field-label">休憩時間（自動控除）</p>
          <BreakWindowsEditor value={breakWindows} onChange={setBreakWindows} />
          <button type="button" className="btn primary block" onClick={() => void saveWorkRules()}>
            保存
          </button>
        </section>
      ) : null}

      {section === 'users' ? (
        <>
          <section className="panel">
            <h2 className="section-title">自分の打刻担当</h2>
            <select
              className="input"
              value={myEmployeeId}
              onChange={(e) => setMyEmployeeId(e.target.value)}
            >
              <option value="">未設定</option>
              {employees
                .filter((e) => e.active)
                .map((e) => (
                  <option key={e.id ?? e.name} value={e.id ?? ''}>
                    {e.name}
                  </option>
                ))}
            </select>
            <button type="button" className="btn" onClick={() => void saveMyLink()}>
              自分の担当を保存
            </button>
          </section>
          <section className="panel">
            <h2 className="section-title">ユーザー（社員）追加・削除</h2>
            <ul className="emp-edit-list">
              {employees.map((e, i) => (
                <li key={e.id ?? i}>
                  <input
                    className="input grow"
                    value={e.name}
                    disabled={!e.active}
                    onChange={(ev) => {
                      const next = [...employees]
                      next[i] = { ...e, name: ev.target.value }
                      setEmployees(next)
                    }}
                  />
                  {e.active ? (
                    <button
                      type="button"
                      className="btn danger small"
                      onClick={() => e.id && void deactivateEmployee(e.id, e.name)}
                    >
                      削除
                    </button>
                  ) : (
                    <span className="badge badge-none">無効</span>
                  )}
                </li>
              ))}
            </ul>
            <button type="button" className="btn block" onClick={() => void saveEmployees()}>
              名前の変更を保存
            </button>
            <div className="add-emp-row">
              <input
                className="input grow"
                placeholder="新しい表示名"
                value={newEmpName}
                onChange={(e) => setNewEmpName(e.target.value)}
              />
              <button type="button" className="btn primary" onClick={() => void addEmployee()}>
                追加
              </button>
            </div>
          </section>
        </>
      ) : null}

      {section === 'correction' ? (
        <CorrectionPanel
          employees={activeEmployees}
          records={records}
          settings={settings}
          onChanged={refresh}
        />
      ) : null}

      {section === 'theme' ? (
        <section className="panel">
          <h2 className="section-title">画面の色</h2>
          <p className="hint">全員の画面に反映されます。初期値は Synqa 標準の青・ティールです。</p>
          <div
            className="theme-preview"
            style={{
              background: `linear-gradient(135deg, ${themePrimary} 0%, ${themeAccent} 100%)`,
            }}
          />
          <label className="field">
            <span>メインカラー</span>
            <div className="color-field">
              <input
                type="color"
                value={themePrimary}
                onChange={(e) => setThemePrimary(e.target.value)}
              />
              <input
                className="input"
                value={themePrimary}
                onChange={(e) => setThemePrimary(e.target.value)}
                pattern="#[0-9A-Fa-f]{6}"
              />
            </div>
          </label>
          <label className="field">
            <span>アクセントカラー</span>
            <div className="color-field">
              <input
                type="color"
                value={themeAccent}
                onChange={(e) => setThemeAccent(e.target.value)}
              />
              <input
                className="input"
                value={themeAccent}
                onChange={(e) => setThemeAccent(e.target.value)}
                pattern="#[0-9A-Fa-f]{6}"
              />
            </div>
          </label>
          <div className="btn-row">
            <button type="button" className="btn" onClick={resetTheme}>
              標準に戻す
            </button>
            <button type="button" className="btn primary grow" onClick={() => void saveTheme()}>
              色を保存
            </button>
          </div>
        </section>
      ) : null}

      {section === 'period' ? (
        <section className="panel">
          <h2 className="section-title">月次期間・管理者パスワード</h2>
          <label className="field">
            <span>月次の区切り</span>
            <select
              className="input"
              value={periodMode}
              onChange={(e) => setPeriodMode(e.target.value as PeriodMode)}
            >
              <option value="calendar_month">暦月（1日〜月末）</option>
              <option value="anchor_day">締め日（毎月○日始まり）</option>
            </select>
          </label>
          {periodMode === 'anchor_day' ? (
            <label className="field">
              <span>開始日（1〜28）</span>
              <input
                type="number"
                min={1}
                max={28}
                className="input"
                value={anchorDay}
                onChange={(e) => setAnchorDay(Number(e.target.value))}
              />
            </label>
          ) : null}
          <label className="field">
            <span>管理者パスワード（打刻修正用・空欄なら変更なし）</span>
            <input
              type="password"
              className="input"
              value={adminPw}
              onChange={(e) => setAdminPw(e.target.value)}
            />
          </label>
          <label className="field">
            <span>確認</span>
            <input
              type="password"
              className="input"
              value={adminPw2}
              onChange={(e) => setAdminPw2(e.target.value)}
            />
          </label>
          <button type="button" className="btn primary block" onClick={() => void savePeriodAndPw()}>
            保存
          </button>
        </section>
      ) : null}

      {msg ? <p className="toast-inline">{msg}</p> : null}
    </div>
  )
}
