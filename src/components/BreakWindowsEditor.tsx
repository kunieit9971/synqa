import type { BreakWindow } from '../types'
import { DEFAULT_BREAK_WINDOWS } from '../types'

type Props = {
  value: BreakWindow[]
  onChange: (next: BreakWindow[]) => void
}

function emptyWindow(): BreakWindow {
  return { startHour: 12, startMinute: 0, endHour: 13, endMinute: 0 }
}

export function BreakWindowsEditor({ value, onChange }: Props) {
  const windows = value.length > 0 ? value : DEFAULT_BREAK_WINDOWS

  const update = (index: number, patch: Partial<BreakWindow>) => {
    const next = windows.map((w, i) => (i === index ? { ...w, ...patch } : w))
    onChange(next)
  }

  const remove = (index: number) => {
    onChange(windows.filter((_, i) => i !== index))
  }

  const add = () => onChange([...windows, emptyWindow()])

  return (
    <div className="break-editor">
      {windows.map((w, i) => (
        <div key={i} className="break-row">
          <label className="field compact">
            <span>開始</span>
            <div className="time-pair">
              <input
                type="number"
                min={0}
                max={23}
                className="input"
                value={w.startHour}
                onChange={(e) => update(i, { startHour: Number(e.target.value) })}
              />
              <span>:</span>
              <input
                type="number"
                min={0}
                max={59}
                className="input"
                value={w.startMinute}
                onChange={(e) => update(i, { startMinute: Number(e.target.value) })}
              />
            </div>
          </label>
          <label className="field compact">
            <span>終了</span>
            <div className="time-pair">
              <input
                type="number"
                min={0}
                max={23}
                className="input"
                value={w.endHour}
                onChange={(e) => update(i, { endHour: Number(e.target.value) })}
              />
              <span>:</span>
              <input
                type="number"
                min={0}
                max={59}
                className="input"
                value={w.endMinute}
                onChange={(e) => update(i, { endMinute: Number(e.target.value) })}
              />
            </div>
          </label>
          <button type="button" className="btn danger small" onClick={() => remove(i)}>
            削除
          </button>
        </div>
      ))}
      <button type="button" className="btn ghost block" onClick={add}>
        休憩帯を追加
      </button>
      <p className="hint small">勤務時間と重なる休憩は自動で控除されます。</p>
    </div>
  )
}
