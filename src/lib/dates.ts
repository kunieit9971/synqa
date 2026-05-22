export function todayIsoDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDateJa(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return `${y}年${m}月${d}日`
}

const WEEKDAY_JA = ['日', '月', '火', '水', '木', '金', '土'] as const

export function formatDateJaWithWeekday(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const day = new Date(y, m - 1, d).getDay()
  return `${y}年${m}月${d}日（${WEEKDAY_JA[day]}）`
}

export function formatLiveClockParts(date: Date): { h: string; m: string; s: string } {
  return {
    h: String(date.getHours()).padStart(2, '0'),
    m: String(date.getMinutes()).padStart(2, '0'),
    s: String(date.getSeconds()).padStart(2, '0'),
  }
}

export function formatClock(iso: string | null): string {
  if (!iso) return '—'
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return '—'
  return t.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}
