'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, type Drop } from '@/lib/api'
import { toast } from 'sonner'
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props { drops: Drop[]; loadDrops: () => Promise<void>; theme: 'light' | 'dark' | 'black' }

const THEME_STYLES = {
  light: {
    bg: '#f8f5ff',
    card: '#fff',
    border: '#e9e3ff',
    text: '#1e1b4b',
    muted: '#6b7280',
    inputBg: '#f3eeff',
    inputBorder: '#e0d5f5',
    accentSolid: '#8b5cf6',
    accentLight: 'rgba(139,92,246,0.08)',
    shadow: '0 1px 3px rgba(139, 92, 246, 0.06)',
  },
  dark: {
    bg: '#0f0d1a',
    card: '#1a1730',
    border: '#2d2a4a',
    text: '#e2e0ff',
    muted: '#9ca3af',
    inputBg: '#15122a',
    inputBorder: '#2d2a4a',
    accentSolid: '#8b5cf6',
    accentLight: 'rgba(139,92,246,0.12)',
    shadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  black: {
    bg: '#000',
    card: '#111',
    border: '#222',
    text: '#fff',
    muted: '#888',
    inputBg: '#0a0a0a',
    inputBorder: '#222',
    accentSolid: '#8b5cf6',
    accentLight: 'rgba(139,92,246,0.08)',
    shadow: '0 1px 3px rgba(0,0,0,0.5)',
  },
}

const ACCION_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  crear:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: '✅ Creado' },
  editar:   { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: '✏️ Editado' },
  eliminar: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: '🗑️ Eliminado' },
  estado:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: '🔄 Estado' },
}

const ENTIDAD_ICON: Record<string, string> = {
  venta: '💰', pedido: '📦', cliente: '👥', producto: '👕',
  drop: '🎯', gasto: '💸', proveedor: '🏭', nota: '📝', meta: '🎯',
}

const ENTIDADES = ['venta', 'pedido', 'cliente', 'producto', 'drop', 'gasto', 'proveedor', 'nota', 'meta']
const ACCIONES = ['crear', 'editar', 'eliminar', 'estado']

interface HistorialItem {
  id: string
  accion: string
  entidad: string
  entidadId: string
  descripcion: string
  usuario: string
  createdAt: string
}

interface HistorialResponse {
  items: HistorialItem[]
  total: number
  page: number
  limit: number
  pages: number
}

export default function HistorialTab({ theme }: Props) {
  const s = THEME_STYLES[theme]
  const [items, setItems] = useState<HistorialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  // Filters
  const [search, setSearch] = useState('')
  const [filterAccion, setFilterAccion] = useState('all')
  const [filterEntidad, setFilterEntidad] = useState('all')
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters = filterAccion !== 'all' || filterEntidad !== 'all' || filterFechaDesde || filterFechaHasta

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterAccion !== 'all') params.set('accion', filterAccion)
      if (filterEntidad !== 'all') params.set('entidad', filterEntidad)
      if (filterFechaDesde) params.set('fechaDesde', filterFechaDesde)
      if (filterFechaHasta) params.set('fechaHasta', filterFechaHasta)
      params.set('page', String(page))
      params.set('limit', '50')

      const res = await fetch(`/api/historial?${params}`)
      if (!res.ok) throw new Error()
      const data: HistorialResponse = await res.json()
      setItems(data.items)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      toast.error('Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }, [search, filterAccion, filterEntidad, filterFechaDesde, filterFechaHasta, page])

  useEffect(() => {
    // Reset to page 1 when filters change
    setPage(1)
  }, [search, filterAccion, filterEntidad, filterFechaDesde, filterFechaHasta])

  useEffect(() => { load() }, [load])

  const clearFilters = () => {
    setFilterAccion('all')
    setFilterEntidad('all')
    setFilterFechaDesde('')
    setFilterFechaHasta('')
    setSearch('')
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `hace ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `hace ${days}d`
    return new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const selectStyle = {
    background: s.inputBg,
    borderColor: s.inputBorder,
    color: s.text,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: s.muted }}>
            📋 Historial de cambios
          </h2>
          {total > 0 && (
            <p className="text-xs mt-0.5" style={{ color: s.muted }}>
              {total} registros encontrados
            </p>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border"
          style={{
            background: (showFilters || hasActiveFilters) ? s.accentLight : 'transparent',
            borderColor: (showFilters || hasActiveFilters) ? s.accentSolid : s.border,
            color: (showFilters || hasActiveFilters) ? s.accentSolid : s.muted,
          }}
        >
          <Filter className="w-3.5 h-3.5" />
          Filtros
          {hasActiveFilters && (
            <span
              className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
              style={{ background: s.accentSolid }}
            >
              {[filterAccion !== 'all', filterEntidad !== 'all', !!filterFechaDesde, !!filterFechaHasta].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: s.muted }} />
        <Input
          placeholder="Buscar en historial..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-xl pl-9 border-0"
          style={{ background: s.inputBg, color: s.text, borderColor: s.inputBorder }}
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2"
            onClick={() => setSearch('')}
          >
            <X className="w-4 h-4" style={{ color: s.muted }} />
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div
          className="rounded-2xl p-4 space-y-3 border"
          style={{ background: s.card, borderColor: s.border, boxShadow: s.shadow }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs" style={{ color: s.muted }}>Acción</Label>
              <Select value={filterAccion} onValueChange={setFilterAccion}>
                <SelectTrigger className="rounded-xl h-9 text-xs" style={selectStyle}>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {ACCIONES.map(a => (
                    <SelectItem key={a} value={a}>
                      {ACCION_CONFIG[a]?.label || a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs" style={{ color: s.muted }}>Entidad</Label>
              <Select value={filterEntidad} onValueChange={setFilterEntidad}>
                <SelectTrigger className="rounded-xl h-9 text-xs" style={selectStyle}>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {ENTIDADES.map(e => (
                    <SelectItem key={e} value={e}>
                      {ENTIDAD_ICON[e]} {e.charAt(0).toUpperCase() + e.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs" style={{ color: s.muted }}>Desde</Label>
              <Input
                type="date"
                value={filterFechaDesde}
                onChange={e => setFilterFechaDesde(e.target.value)}
                className="rounded-xl h-9 text-xs"
                style={selectStyle}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs" style={{ color: s.muted }}>Hasta</Label>
              <Input
                type="date"
                value={filterFechaHasta}
                onChange={e => setFilterFechaHasta(e.target.value)}
                className="rounded-xl h-9 text-xs"
                style={selectStyle}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: '#ef4444' }}
            >
              <X className="w-3.5 h-3.5" />
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" style={{ background: s.accentLight }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="rounded-2xl" style={{ background: s.card, border: `1px solid ${s.border}` }}>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-2">📋</div>
            <p style={{ color: s.muted }}>
              {hasActiveFilters || search ? 'No hay resultados para los filtros seleccionados.' : 'No hay actividad registrada aún.'}
            </p>
            {(hasActiveFilters || search) && (
              <button
                onClick={clearFilters}
                className="mt-3 text-xs font-medium underline"
                style={{ color: s.accentSolid }}
              >
                Limpiar filtros
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {items.map(item => {
              const accion = ACCION_CONFIG[item.accion] || { color: s.muted, bg: 'transparent', label: item.accion }
              const icon = ENTIDAD_ICON[item.entidad] || '📄'
              return (
                <div
                  key={item.id}
                  style={{
                    background: s.card,
                    border: `1px solid ${s.border}`,
                    borderRadius: '14px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontSize: '20px', lineHeight: 1, marginTop: '2px' }}>{icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: accion.bg,
                        color: accion.color,
                      }}>
                        {accion.label}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: s.text, textTransform: 'capitalize' }}>
                        {item.entidad}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: s.text, marginTop: '4px' }}>{item.descripcion}</p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '11px', color: s.muted }}>
                      {item.usuario && <span>👤 {item.usuario}</span>}
                      <span title={new Date(item.createdAt).toLocaleString('es-PE')}>
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs" style={{ color: s.muted }}>
                Página {page} de {pages} · {total} registros
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg"
                  style={{ borderColor: s.border, color: s.muted }}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg"
                  style={{ borderColor: s.border, color: s.muted }}
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
