import { useMemo } from 'react'
import { formatClock } from '../lib/dates'
import { resolveTodayStatus } from '../lib/metrics'
import type { AttendanceRecord, Employee } from '../types'

type Props = {
  employees: Employee[]
  records: AttendanceRecord[]
  workDate: string
}

export function PunchStatusTable({ employees, records, workDate }: Props) {
  const rows = useMemo(() => {
    const list = employees
      .map((e) => {
        const status = resolveTodayStatus(records, e.id, workDate)
        const rec =
          records.find(
            (r) => r.employee_id === e.id && r.work_date === workDate,
          ) ?? null
        return { employee: e, status, rec }
      })
      .filter((r) => r.status === 'in' || r.status === 'out')
    list.sort((a, b) => {
      const rank = (s: typeof a.status) => (s === 'in' ? 0 : 1)
      const d = rank(a.status) - rank(b.status)
      if (d !== 0) return d
      return a.employee.display_name.localeCompare(b.employee.display_name, 'ja')
    })
    return list
  }, [employees, records, workDate])

  return (
    <section className="panel punch-status-panel">
      <h2 className="section-title">出勤中・退勤済み</h2>
      {rows.length === 0 ? (
        <p className="hint">いま出勤中・退勤済みの方はいません。</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>担当</th>
                <th>状態</th>
                <th>出勤</th>
                <th>退勤</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ employee, status, rec }) => (
                <tr key={employee.id}>
                  <td>{employee.display_name}</td>
                  <td>
                    {status === 'in' ? (
                      <span className="badge badge-in">出勤中</span>
                    ) : (
                      <span className="badge badge-out">退勤済み</span>
                    )}
                  </td>
                  <td>{rec ? formatClock(rec.clock_in_at) : '—'}</td>
                  <td>
                    {rec?.clock_out_at ? formatClock(rec.clock_out_at) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
