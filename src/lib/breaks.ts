import type { BreakWindow } from '../types'

function localDateAt(
  workDate: string,
  hour: number,
  minute: number,
): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) return null
  const [y, m, d] = workDate.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d, hour, minute, 0, 0)
}

export function breakMinutesInWorkSpan(
  workDate: string,
  clockInIso: string,
  clockOutIso: string,
  windows: BreakWindow[],
): number {
  const workStart = Date.parse(clockInIso)
  const workEnd = Date.parse(clockOutIso)
  if (!Number.isFinite(workStart) || !Number.isFinite(workEnd) || workEnd <= workStart) {
    return 0
  }
  let total = 0
  for (const w of windows) {
    const bStart = localDateAt(workDate, w.startHour, w.startMinute)
    const bEnd = localDateAt(workDate, w.endHour, w.endMinute)
    if (!bStart || !bEnd) continue
    const overlapStart = Math.max(workStart, bStart.getTime())
    const overlapEnd = Math.min(workEnd, bEnd.getTime())
    if (overlapEnd > overlapStart) {
      total += Math.round((overlapEnd - overlapStart) / 60000)
    }
  }
  return total
}
