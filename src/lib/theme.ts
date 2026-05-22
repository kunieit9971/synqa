import type { TenantSettings } from '../types'

export const DEFAULT_THEME_PRIMARY = '#0066FF'
export const DEFAULT_THEME_ACCENT = '#00C9A7'

const HEX_RE = /^#([0-9A-Fa-f]{6})$/

export function normalizeHexColor(raw: string | undefined, fallback: string): string {
  const t = (raw ?? '').trim()
  return HEX_RE.test(t) ? t : fallback
}

export function themeFromSettings(settings: TenantSettings) {
  return {
    primary: normalizeHexColor(settings.theme_primary_color, DEFAULT_THEME_PRIMARY),
    accent: normalizeHexColor(settings.theme_accent_color, DEFAULT_THEME_ACCENT),
  }
}

/** CSS 変数を document に適用 */
export function applyTheme(settings: TenantSettings): void {
  const { primary, accent } = themeFromSettings(settings)
  const root = document.documentElement
  root.style.setProperty('--accent', primary)
  root.style.setProperty('--accent-teal', accent)
  root.style.setProperty('--accent-soft', hexAlpha(primary, 0.12))
  root.style.setProperty('--teal-soft', hexAlpha(accent, 0.12))
  root.style.setProperty(
    '--bg-mesh',
    `radial-gradient(ellipse 120% 80% at 0% -20%, ${hexAlpha(primary, 0.14)}, transparent 55%),
    radial-gradient(ellipse 90% 60% at 100% 0%, ${hexAlpha(accent, 0.1)}, transparent 50%),
    #eef2f8`,
  )
}

function hexAlpha(hex: string, alpha: number): string {
  const m = hex.match(HEX_RE)
  if (!m) return `rgba(0, 102, 255, ${alpha})`
  const r = parseInt(m[1].slice(0, 2), 16)
  const g = parseInt(m[1].slice(2, 4), 16)
  const b = parseInt(m[1].slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
