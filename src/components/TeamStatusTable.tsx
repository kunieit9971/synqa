import { resolveTodayStatus } from '../lib/metrics'
import type { AttendanceRecord, Employee } from '../types'

type Props = {
  employees: Employee[]
  records: AttendanceRecord[]
  workDate: string
}

export function TeamStatusTable({ employees, records, workDate }: Props) {
  const rows = employees.map((e) => ({
    employee: e,
    status: resolveTodayStatus(records, e.id, workDate),
  }))
  rows.sort((a, b) => {
    const rank = (s: typeof a.status) => (s === 'in' ? 0 : s === 'out' ? 1 : 2)
    const d = rank(a.status) - rank(b.status)
    if (d !== 0) return d
    return a.employee.display_name.localeCompare(b.employee.display_name, 'ja')
  })

  return (
    <div className="team-status-wrap">
      <h3 className="subsection-title">全員一覧</h3>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>担当</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ employee, status }) => (
              <tr key={employee.id}>
                <td>{employee.display_name}</td>
                <td>
                  {status === 'in' ? (
                    <span className="badge badge-in">出勤中</span>
                  ) : status === 'out' ? (
                    <span className="badge badge-out">退勤済み</span>
                  ) : (
                    <span className="badge badge-none">未打刻</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
