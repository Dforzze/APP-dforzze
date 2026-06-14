// Shared theme styles for all tabs
export type ThemeMode = 'light' | 'dark' | 'black'

export const THEME_STYLES: Record<ThemeMode, {
  bg: string
  card: string
  border: string
  text: string
  muted: string
  input: string
  hover: string
  grid: string
  tooltip: string
  tooltipText: string
}> = {
  light: {
    bg: '#f8f5ff',
    card: '#fff',
    border: '#e9e3ff',
    text: '#1e1b4b',
    muted: '#6b7280',
    input: '#f8f5ff',
    hover: '#f3eeff',
    grid: '#f0edff',
    tooltip: '#fff',
    tooltipText: '#1e1b4b',
  },
  dark: {
    bg: '#0f0d1a',
    card: '#1a1730',
    border: '#2d2a4a',
    text: '#e2e0ff',
    muted: '#9ca3af',
    input: '#0f0d1a',
    hover: '#231f3d',
    grid: '#2d2a4a',
    tooltip: '#1a1730',
    tooltipText: '#e2e0ff',
  },
  black: {
    bg: '#000',
    card: '#111',
    border: '#222',
    text: '#fff',
    muted: '#888',
    input: '#000',
    hover: '#1a1a1a',
    grid: '#222',
    tooltip: '#222',
    tooltipText: '#fff',
  },
}

export const inputStyle = (theme: ThemeMode) => ({
  background: THEME_STYLES[theme].input,
  border: `1px solid ${THEME_STYLES[theme].border}`,
  color: THEME_STYLES[theme].text,
  borderRadius: '10px',
  padding: '8px 12px',
  fontSize: '13px',
  outline: 'none',
  width: '100%',
} as React.CSSProperties)

export const fmt = (n: number) => 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const fd = (dateStr: string) => dateStr ? new Date(dateStr + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
export const fmtShort = (n: number) => 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export const COLOR_MAP: Record<string, string> = {
  'negro': '#222', 'black': '#222', 'blanco': '#f5f5f5', 'white': '#f5f5f5',
  'rojo': '#ef4444', 'red': '#ef4444', 'azul': '#3b82f6', 'blue': '#3b82f6',
  'verde': '#22c55e', 'green': '#22c55e', 'amarillo': '#eab308', 'yellow': '#eab308',
  'rosado': '#ec4899', 'pink': '#ec4899', 'morado': '#8b5cf6', 'purple': '#8b5cf6',
  'naranja': '#f97316', 'orange': '#f97316', 'gris': '#9ca3af', 'gray': '#9ca3af',
  'plomo': '#6b7280', 'marrón': '#92400e', 'brown': '#92400e',
  'beige': '#d4a574', 'crema': '#fef3c7', 'celeste': '#7dd3fc',
  'vino': '#7f1d1d', 'mostaza': '#a16207', 'oliva': '#4d7c0f',
  'turquesa': '#2dd4bf', 'coral': '#fb7185', 'lavanda': '#a78bfa',
}

export function colorSwatch(color: string): string {
  const hex = COLOR_MAP[color.toLowerCase()] || '#8b5cf6'
  return `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${hex};border:1px solid rgba(0,0,0,0.1);vertical-align:middle;margin-right:4px;"></span>`
}
