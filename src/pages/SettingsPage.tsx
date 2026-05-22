import { useEffect, useState } from 'react'
import {
  fetchAllEmployees,
  updateSettings,
  upsertEmployee,
} from '../api/data'
import { getSupabase } from '../supabaseClient'
import { useAppData } from '../context/AppDataContext'
import { hashPassword } from '../lib/password'
import type { BreakWindow, PeriodMode } from '../types'
import { DEFAULT_BREAK_WINDOWS } from '../types'

export function SettingsPage() {
  const { profile, settings, refresh } = useAppData()
  const isAdmin = profile?.role === 'admin'
  const [employees, setEmployees] = useState<{ id?: string; name: string; active: boolean }[]>(
    [],
  )
  const [periodMode, setPeriodMode] = useState<PeriodMode>(settings.period_mode)
  const [anchorDay, setAnchorDay] = useState(settings.period_anchor_day)
  const [stdHours, setStdHours] = useState(
    String(Math.floor(settings.standard_work_minutes_per_day / 60)),
  )
  const [otLimit, setOtLimit] = useState(String(settings.monthly_overtime_limit_hours))
  const [breaksJson, setBreaksJson] = useState(
    JSON.stringify(settings.break_windows, null, 2),
  )
  const [adminPw, setAdminPw] = useState('')
  const [adminPw2, setAdminPw2] = useState('')
  const [myEmployeeId, setMyEmployeeId] = useState(profile?.employee_id ?? '')
  const [newEmpName, setNewEmpName] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    void fetchAllEmployees().then((list) =>
      setEmployees(
        list.map((e) => ({ id: e.id, name: e.display_name, active: e.active })),
      ),
    )
  }, [settings.updated_at])

  const saveTenant = async () => {
    if (!isAdmin) return
    let windows: BreakWindow[] = DEFAULT_BREAK_WINDOWS
    try {
      windows = JSON.parse(breaksJson) as BreakWindow[]
    } catch {
      setMsg('休憩JSONが不正です')
      return
    }
    const patch: Parameters<typeof updateSettings>[0] = {
      period_mode: periodMode,
      period_anchor_day: anchorDay,
      standard_work_minutes_per_day: Math.max(1, Number(stdHours) || 7) * 60,
      monthly_overtime_limit_hours: Math.max(0, Number(otLimit) || 20),
      break_windows: windows,
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
    setMsg('会社設定を保存しました')
    await refresh()
  }

  const saveEmployees = async () => {
    if (!isAdmin) return
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
    if (!isAdmin || !newEmpName.trim()) return
    await upsertEmployee({
      display_name: newEmpName.trim(),
      active: true,
      sort_order: employees.length,
    })
    setNewEmpName('')
    setMsg('社員を追加しました')
    await refresh()
  }

  const saveMyLink = async () => {
    const sb = getSupabase()
    if (!sb || !profile) return
    await sb
      .from('profiles')
      .update({ employee_id: myEmployeeId || null })
      .eq('user_id', profile.user_id)
    setMsg('自分の打刻担当を保存しました')
    await refresh()
  }

  return (
    <div className="page-stack">
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
        <button type="button" className="btn primary" onClick={() => void saveMyLink()}>
          保存
        </button>
      </section>

      {isAdmin ? (
        <>
          <section className="panel">
            <h2 className="section-title">会社設定（管理者）</h2>
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
              <span>所定労働（時間/日）</span>
              <input
                className="input"
                value={stdHours}
                onChange={(e) => setStdHours(e.target.value)}
              />
            </label>
            <label className="field">
              <span>月残業上限（時間）</span>
              <input
                className="input"
                value={otLimit}
                onChange={(e) => setOtLimit(e.target.value)}
              />
            </label>
            <label className="field">
              <span>休憩帯（JSON・自動控除）</span>
              <textarea
                className="input textarea"
                rows={6}
                value={breaksJson}
                onChange={(e) => setBreaksJson(e.target.value)}
              />
            </label>
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
            <button type="button" className="btn primary" onClick={() => void saveTenant()}>
              会社設定を保存
            </button>
          </section>

          <section className="panel">
            <h2 className="section-title">社員（表示名）</h2>
            <ul className="emp-edit-list">
              {employees.map((e, i) => (
                <li key={e.id ?? i}>
                  <input
                    className="input"
                    value={e.name}
                    onChange={(ev) => {
                      const next = [...employees]
                      next[i] = { ...e, name: ev.target.value }
                      setEmployees(next)
                    }}
                  />
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={e.active}
                      onChange={(ev) => {
                        const next = [...employees]
                        next[i] = { ...e, active: ev.target.checked }
                        setEmployees(next)
                      }}
                    />
                    有効
                  </label>
                </li>
              ))}
            </ul>
            <button type="button" className="btn" onClick={() => void saveEmployees()}>
              一覧を保存
            </button>
            <div className="add-emp-row">
              <input
                className="input grow"
                placeholder="新しい表示名"
                value={newEmpName}
                onChange={(e) => setNewEmpName(e.target.value)}
              />
              <button type="button" className="btn" onClick={() => void addEmployee()}>
                追加
              </button>
            </div>
          </section>
        </>
      ) : (
        <p className="hint">会社設定の変更は管理者のみ可能です。</p>
      )}

      {msg ? <p className="toast-inline">{msg}</p> : null}
    </div>
  )
}
