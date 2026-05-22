import { useEffect, useState } from 'react'
import { EmployeeManagePanel } from './EmployeeManagePanel'

type Props = {
  open: boolean
  onClose: () => void
}

export function PunchSettingsOverlay({ open, onClose }: Props) {
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setMsg(null)
  }, [open])

  if (!open) return null

  return (
    <div className="punch-settings-overlay" role="dialog" aria-modal="true" aria-label="打刻の設定">
      <button
        type="button"
        className="punch-settings-backdrop"
        aria-label="設定を閉じる"
        onClick={onClose}
      />
      <div className="punch-settings-sheet">
        <header className="punch-settings-head">
          <h2>打刻の設定</h2>
          <button type="button" className="btn ghost small" onClick={onClose}>
            閉じる
          </button>
        </header>
        <EmployeeManagePanel onMessage={setMsg} />
        {msg ? <p className="toast-inline punch-settings-toast">{msg}</p> : null}
      </div>
    </div>
  )
}
