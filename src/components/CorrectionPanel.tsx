import { useMemo, useState } from 'react'
import { deleteRecord, saveRecordCorrection } from '../api/data'
import { verifyPassword } from '../lib/password'
import { formatDateJa, isoDaysAgo, todayIsoDate } from '../lib/dates'
import type { AttendanceRecord, Employee, TenantSettings } from '../types'

type Props = {
  employees: Employee[]
  records: AttendanceRecord[]
  settings: TenantSettings
  onChanged: () => Promise<void>
}

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(v: string): string | null {
  if (!v.trim()) return null
  const t = Date.parse(v)
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}

export function CorrectionPanel({
  employees,
  records,
  settings,
  onChanged,
}: Props) {
  const [unlocked, setUnlocked] = useState(false)
  const [pw, setPw] = useState('')
  const [range, setRange] = useState<'today' | 'week' | 'month'>('week')
  const today = todayIsoDate()

  const visible = useMemo(() => {
    const sorted = [...records].sort((a, b) => b.work_date.localeCompare(a.work_date))
    if (range === 'today') return sorted.filter((r) => r.work_date === today)
    const min = isoDaysAgo(range === 'week' ? 6 : 30)
    return sorted.filter((r) => r.work_date >= min && r.work_date <= today)
  }, [records, range, today])

  const nameOf = (id: string) =>
    employees.find((e) => e.id === id)?.display_name ?? '不明'

  const tryUnlock = async () => {
    const ok = await verifyPassword(pw, settings.admin_password_hash)
    if (!ok) {
      alert('管理者パスワードが違います')
      return
    }
    setUnlocked(true)
    setPw('')
  }

  if (!unlocked) {
    return (
      <section className="panel">
        <h2 className="section-title">打刻修正（管理者）</h2>
        <p className="hint">設定タブで登録した管理者パスワードで解除します。</p>
        <label className="field">
          <span>管理者パスワード</span>
          <input
            type="password"
            className="input"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </label>
        <button type="button" className="btn primary" onClick={() => void tryUnlock()}>
          解除
        </button>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2 className="section-title">打刻修正（管理者）</h2>
      <div className="chip-row">
        <button
          type="button"
          className={`chip ${range === 'today' ? 'active' : ''}`}
          onClick={() => setRange('today')}
        >
          当日
        </button>
        <button
          type="button"
          className={`chip ${range === 'week' ? 'active' : ''}`}
          onClick={() => setRange('week')}
        >
          過去7日
        </button>
        <button
          type="button"
          className={`chip ${range === 'month' ? 'active' : ''}`}
          onClick={() => setRange('month')}
        >
          過去31日
        </button>
      </div>
      {visible.length === 0 ? (
        <p className="hint">該当する打刻がありません</p>
      ) : (
        <ul className="correction-list">
          {visible.map((r) => (
            <CorrectionItem
              key={r.id}
              record={r}
              name={nameOf(r.employee_id)}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function CorrectionItem({
  record,
  name,
  onChanged,
}: {
  record: AttendanceRecord
  name: string
  onChanged: () => Promise<void>
}) {
  const [inVal, setInVal] = useState(toLocalInput(record.clock_in_at))
  const [outVal, setOutVal] = useState(
    record.clock_out_at ? toLocalInput(record.clock_out_at) : '',
  )

  const save = async () => {
    const inIso = fromLocalInput(inVal)
    if (!inIso) {
      alert('出勤時刻が不正です')
      return
    }
    const outIso = outVal.trim() ? fromLocalInput(outVal) : null
    const wd = inIso.slice(0, 10)
    await saveRecordCorrection(record.id, inIso, outIso, wd)
    await onChanged()
  }

  const remove = async () => {
    if (!window.confirm('この打刻を削除しますか？')) return
    await deleteRecord(record.id)
    await onChanged()
  }

  return (
    <li className="correction-item">
      <p>
        <strong>{name}</strong> {formatDateJa(record.work_date)}
      </p>
      <label className="field">
        <span>出勤</span>
        <input
          type="datetime-local"
          className="input"
          value={inVal}
          onChange={(e) => setInVal(e.target.value)}
        />
      </label>
      <label className="field">
        <span>退勤</span>
        <input
          type="datetime-local"
          className="input"
          value={outVal}
          onChange={(e) => setOutVal(e.target.value)}
        />
      </label>
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={() => void save()}>
          保存
        </button>
        <button type="button" className="btn danger" onClick={() => void remove()}>
          削除
        </button>
      </div>
    </li>
  )
}
