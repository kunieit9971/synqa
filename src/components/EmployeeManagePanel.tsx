import { useEffect, useState } from 'react'
import { fetchAllEmployees, upsertEmployee } from '../api/data'
import { getSupabase } from '../supabaseClient'
import { useAppData } from '../context/AppDataContext'

type Props = {
  onMessage?: (msg: string) => void
}

export function EmployeeManagePanel({ onMessage }: Props) {
  const { profile, employees: activeEmployees, refresh } = useAppData()
  const [employees, setEmployees] = useState<{ id?: string; name: string; active: boolean }[]>(
    [],
  )
  const [myEmployeeId, setMyEmployeeId] = useState(profile?.employee_id ?? '')
  const [newEmpName, setNewEmpName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void fetchAllEmployees().then((list) =>
      setEmployees(
        list.map((e) => ({ id: e.id, name: e.display_name, active: e.active })),
      ),
    )
    setMyEmployeeId(profile?.employee_id ?? '')
  }, [profile?.employee_id, activeEmployees.length])

  const notify = (msg: string) => {
    onMessage?.(msg)
  }

  async function saveMyLink() {
    const sb = getSupabase()
    if (!sb || !profile) return
    setBusy(true)
    try {
      await sb
        .from('profiles')
        .update({ employee_id: myEmployeeId || null })
        .eq('user_id', profile.user_id)
      notify('自分の打刻担当を保存しました')
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  const saveEmployees = async () => {
    setBusy(true)
    try {
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
      notify('表示名の変更を保存しました')
      await refresh()
      const list = await fetchAllEmployees()
      setEmployees(
        list.map((e) => ({ id: e.id, name: e.display_name, active: e.active })),
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  const addEmployee = async () => {
    if (!newEmpName.trim()) return
    setBusy(true)
    try {
      await upsertEmployee({
        display_name: newEmpName.trim(),
        active: true,
        sort_order: employees.length,
      })
      setNewEmpName('')
      notify('ユーザーを追加しました')
      await refresh()
      const list = await fetchAllEmployees()
      setEmployees(
        list.map((e) => ({ id: e.id, name: e.display_name, active: e.active })),
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : '追加に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  const deactivateEmployee = async (id: string, name: string) => {
    if (!window.confirm(`「${name}」を削除（無効化）しますか？`)) return
    setBusy(true)
    try {
      await upsertEmployee({
        id,
        display_name: name,
        active: false,
        sort_order: 999,
      })
      notify('ユーザーを削除しました')
      await refresh()
      const list = await fetchAllEmployees()
      setEmployees(
        list.map((e) => ({ id: e.id, name: e.display_name, active: e.active })),
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : '削除に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-stack punch-settings-stack">
      <section className="panel">
        <h2 className="section-title">自分の打刻担当</h2>
        <p className="hint">ログインしたあなたが、どの名前で打刻するかを選びます。</p>
        <select
          className="input"
          value={myEmployeeId}
          disabled={busy}
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
        <button
          type="button"
          className="btn primary block"
          disabled={busy}
          onClick={() => void saveMyLink()}
        >
          自分の担当を保存
        </button>
      </section>

      <section className="panel">
        <h2 className="section-title">打刻ユーザー</h2>
        <p className="hint">表示名の変更・追加・削除（無効化）ができます。</p>
        <ul className="emp-edit-list">
          {employees.map((e, i) => (
            <li key={e.id ?? i}>
              <input
                className="input grow"
                value={e.name}
                disabled={!e.active || busy}
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
                  disabled={busy}
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
        <button
          type="button"
          className="btn block"
          disabled={busy}
          onClick={() => void saveEmployees()}
        >
          表示名の変更を保存
        </button>
        <div className="add-emp-row">
          <input
            className="input grow"
            placeholder="新しい表示名"
            value={newEmpName}
            disabled={busy}
            onChange={(e) => setNewEmpName(e.target.value)}
          />
          <button
            type="button"
            className="btn primary"
            disabled={busy}
            onClick={() => void addEmployee()}
          >
            追加
          </button>
        </div>
      </section>
    </div>
  )
}
