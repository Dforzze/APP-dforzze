'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { api, type Pedido, type Venta, type VentaItem, type Drop } from '@/lib/api'
import { toast } from 'sonner'
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Search,
  Edit2,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Props {
  drops: Drop[]
  loadDrops: () => Promise<void>
  theme: 'light' | 'dark' | 'black'
}

interface GroupedPedido {
  cliente: string
  pedidos: Pedido[]
  totalAmount: number
  latestDate: Date
  statusSummary: Record<string, number>
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_FLOW = ['pendiente', 'confirmado', 'enviado', 'entregado'] as const

const STATUS_CONFIG: Record<string, { emoji: string; label: string; color: string; bgLight: string; bgDark: string; bgBlack: string; textLight: string; textDark: string }> = {
  pendiente: {
    emoji: '🕐',
    label: 'Pendiente',
    color: '#f59e0b',
    bgLight: '#fffbeb',
    bgDark: 'rgba(245, 158, 11, 0.12)',
    bgBlack: 'rgba(245, 158, 11, 0.1)',
    textLight: '#92400e',
    textDark: '#fbbf24',
  },
  confirmado: {
    emoji: '✅',
    label: 'Confirmado',
    color: '#8b5cf6',
    bgLight: '#f5f3ff',
    bgDark: 'rgba(139, 92, 246, 0.12)',
    bgBlack: 'rgba(139, 92, 246, 0.1)',
    textLight: '#6d28d9',
    textDark: '#a78bfa',
  },
  enviado: {
    emoji: '🚚',
    label: 'Enviado',
    color: '#3b82f6',
    bgLight: '#eff6ff',
    bgDark: 'rgba(59, 130, 246, 0.12)',
    bgBlack: 'rgba(59, 130, 246, 0.1)',
    textLight: '#1d4ed8',
    textDark: '#60a5fa',
  },
  entregado: {
    emoji: '📦',
    label: 'Entregado',
    color: '#10b981',
    bgLight: '#ecfdf5',
    bgDark: 'rgba(16, 185, 129, 0.12)',
    bgBlack: 'rgba(16, 185, 129, 0.1)',
    textLight: '#047857',
    textDark: '#34d399',
  },
  cancelado: {
    emoji: '❌',
    label: 'Cancelado',
    color: '#ef4444',
    bgLight: '#fef2f2',
    bgDark: 'rgba(239, 68, 68, 0.12)',
    bgBlack: 'rgba(239, 68, 68, 0.1)',
    textLight: '#b91c1c',
    textDark: '#f87171',
  },
}

const STATUS_ICONS: Record<string, any> = {
  pendiente: Clock,
  confirmado: CheckCircle,
  enviado: Truck,
  entregado: CheckCircle,
  cancelado: XCircle,
}

const METODOS_PAGO = ['Efectivo', 'Transferencia', 'MercadoPago', 'Tarjeta', 'Otro']

// ─── Theme Config ───────────────────────────────────────────────────────────

const THEME_STYLES = {
  light: {
    bg: '#f8f5ff',
    card: '#ffffff',
    cardHover: '#faf7ff',
    border: '#e9e3ff',
    textPrimary: '#1a1333',
    textSecondary: '#5a4d7a',
    textMuted: '#7c6f9b',
    inputBg: '#f3eeff',
    inputBorder: '#e0d5f5',
    accent: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    accentSolid: '#8b5cf6',
    accentLight: 'rgba(139, 92, 246, 0.08)',
    accentMedium: 'rgba(139, 92, 246, 0.15)',
    dangerBg: '#fef2f2',
    dangerText: '#dc2626',
    successBg: '#f0fdf4',
    successText: '#16a34a',
    shadow: '0 1px 3px rgba(139, 92, 246, 0.06)',
    shadowHover: '0 4px 12px rgba(139, 92, 246, 0.12)',
    summaryBg: '#ffffff',
    summaryBorder: '#e9e3ff',
    summaryActiveBorder: '#8b5cf6',
    summaryActiveShadow: '0 0 0 2px rgba(139, 92, 246, 0.2)',
    dialogBg: '#ffffff',
    pipelineTrack: '#ede9fe',
    pipelineActive: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  },
  dark: {
    bg: '#0f0d1a',
    card: '#1a1730',
    cardHover: '#221f3a',
    border: '#2d2a4a',
    textPrimary: '#e8e0f0',
    textSecondary: '#a99cc4',
    textMuted: '#8b82a8',
    inputBg: '#15122a',
    inputBorder: '#2d2a4a',
    accent: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    accentSolid: '#8b5cf6',
    accentLight: 'rgba(139, 92, 246, 0.12)',
    accentMedium: 'rgba(139, 92, 246, 0.2)',
    dangerBg: 'rgba(220, 38, 38, 0.12)',
    dangerText: '#f87171',
    successBg: 'rgba(22, 163, 74, 0.12)',
    successText: '#4ade80',
    shadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
    shadowHover: '0 4px 12px rgba(139, 92, 246, 0.15)',
    summaryBg: '#1a1730',
    summaryBorder: '#2d2a4a',
    summaryActiveBorder: '#8b5cf6',
    summaryActiveShadow: '0 0 0 2px rgba(139, 92, 246, 0.3)',
    dialogBg: '#1a1730',
    pipelineTrack: '#2d2a4a',
    pipelineActive: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  },
  black: {
    bg: '#000000',
    card: '#111111',
    cardHover: '#1a1a1a',
    border: '#222222',
    textPrimary: '#e0e0e0',
    textSecondary: '#999999',
    textMuted: '#777777',
    inputBg: '#0a0a0a',
    inputBorder: '#222222',
    accent: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    accentSolid: '#8b5cf6',
    accentLight: 'rgba(139, 92, 246, 0.08)',
    accentMedium: 'rgba(139, 92, 246, 0.15)',
    dangerBg: 'rgba(220, 38, 38, 0.1)',
    dangerText: '#f87171',
    successBg: 'rgba(22, 163, 74, 0.1)',
    successText: '#4ade80',
    shadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
    shadowHover: '0 4px 12px rgba(139, 92, 246, 0.1)',
    summaryBg: '#111111',
    summaryBorder: '#222222',
    summaryActiveBorder: '#8b5cf6',
    summaryActiveShadow: '0 0 0 2px rgba(139, 92, 246, 0.25)',
    dialogBg: '#111111',
    pipelineTrack: '#222222',
    pipelineActive: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  },
} as const

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function getNextStatus(currentStatus: string): string | null {
  const idx = STATUS_FLOW.indexOf(currentStatus as any)
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null
  return STATUS_FLOW[idx + 1]
}

function getStatusBg(status: string, theme: 'light' | 'dark' | 'black'): string {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return 'transparent'
  if (theme === 'light') return cfg.bgLight
  if (theme === 'dark') return cfg.bgDark
  return cfg.bgBlack
}

function getStatusText(status: string, theme: 'light' | 'dark' | 'black'): string {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return '#999'
  if (theme === 'light') return cfg.textLight
  return cfg.textDark
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusPipeline({ currentStatus, s }: { currentStatus: string; s: typeof THEME_STYLES.light }) {
  const currentIdx = STATUS_FLOW.indexOf(currentStatus as any)
  const isCancelled = currentStatus === 'cancelado'
  const isDelivered = currentStatus === 'entregado'

  return (
    <div className="flex items-center gap-1 mt-2">
      {STATUS_FLOW.map((step, i) => {
        const isActive = isCancelled ? false : (isDelivered ? true : i <= currentIdx)
        const isCurrent = !isCancelled && step === currentStatus

        return (
          <div key={step} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all"
                style={{
                  background: isActive ? s.pipelineActive : s.pipelineTrack,
                  boxShadow: isCurrent ? '0 0 8px rgba(139, 92, 246, 0.4)' : 'none',
                }}
              >
                {isActive ? (
                  <CheckCircle style={{ width: 14, height: 14, color: '#fff' }} />
                ) : (
                  <ChevronRight style={{ width: 12, height: 12, color: s.textMuted }} />
                )}
              </div>
              <span
                className="text-[9px] mt-0.5 capitalize"
                style={{ color: isCurrent ? s.accentSolid : s.textMuted }}
              >
                {step.slice(0, 4)}
              </span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div
                className="h-0.5 w-4 mt-[-12px]"
                style={{
                  background: !isCancelled && i < currentIdx ? s.pipelineActive : s.pipelineTrack,
                  borderRadius: 2,
                }}
              />
            )}
          </div>
        )
      })}
      {isCancelled && (
        <div className="flex items-center gap-1 ml-2">
          <XCircle style={{ width: 16, height: 16, color: STATUS_CONFIG.cancelado.color }} />
          <span className="text-[10px] font-medium" style={{ color: s.dangerText }}>
            Cancelado
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function PedidosTab({ drops, loadDrops, theme }: Props) {
  const s = THEME_STYLES[theme]

  // ── State ──
  const [allPedidos, setAllPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDrop, setFilterDrop] = useState('all')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null)
  const [editMetodoPago, setEditMetodoPago] = useState('')
  const [editVendedor, setEditVendedor] = useState('')
  const [editNota, setEditNota] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Track pedidos being updated to avoid flash
  const updatingIds = useRef<Set<string>>(new Set())

  // ── Load ALL pedidos (unfiltered for counts) ──
  const loadPedidos = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.pedidos.list()
      setAllPedidos(data)
    } catch {
      toast.error('Error al cargar pedidos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPedidos()
  }, [loadPedidos])

  // ── Status counts (from ALL pedidos, not filtered) ──
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      pendiente: 0,
      confirmado: 0,
      enviado: 0,
      entregado: 0,
      cancelado: 0,
    }
    allPedidos.forEach(p => {
      if (counts[p.status] !== undefined) counts[p.status]++
    })
    return counts
  }, [allPedidos])

  const totalCount = allPedidos.length

  // ── Filtered pedidos (for display) ──
  const filteredPedidos = useMemo(() => {
    let result = allPedidos

    if (filterStatus && filterStatus !== 'all') {
      result = result.filter(p => p.status === filterStatus)
    }

    if (filterDrop && filterDrop !== 'all') {
      result = result.filter(p => {
        const venta = p.venta as Venta | undefined
        return venta?.dropId === filterDrop
      })
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p => {
        const venta = p.venta as Venta | undefined
        return (
          venta?.cliente?.toLowerCase().includes(q) ||
          venta?.vendedor?.toLowerCase().includes(q) ||
          venta?.items?.some((item: VentaItem) =>
            item.productName?.toLowerCase().includes(q) ||
            item.color?.toLowerCase().includes(q)
          )
        )
      })
    }

    return result
  }, [allPedidos, filterStatus, filterDrop, search])

  // ── Group pedidos by cliente ──
  const groupedPedidos = useMemo(() => {
    const groups = new Map<string, GroupedPedido>()

    filteredPedidos.forEach(p => {
      const venta = p.venta as Venta | undefined
      const cliente = venta?.cliente || 'Sin cliente'
      const key = cliente.toLowerCase().trim()

      if (!groups.has(key)) {
        groups.set(key, {
          cliente,
          pedidos: [],
          totalAmount: 0,
          latestDate: new Date(p.createdAt),
          statusSummary: {},
        })
      }

      const group = groups.get(key)!
      group.pedidos.push(p)
      group.totalAmount += venta?.total || 0

      if (new Date(p.createdAt) > group.latestDate) {
        group.latestDate = new Date(p.createdAt)
      }

      group.statusSummary[p.status] = (group.statusSummary[p.status] || 0) + 1
    })

    // Sort groups by latest date
    return Array.from(groups.values()).sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime())
  }, [filteredPedidos])

  // ── Handlers ──
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    // Optimistic update: update local state immediately
    setAllPedidos(prev => prev.map(p =>
      p.id === id ? { ...p, status: newStatus } : p
    ))
    updatingIds.current.add(id)

    try {
      await api.pedidos.update(id, { status: newStatus })
      toast.success(`Pedido marcado como ${STATUS_CONFIG[newStatus]?.label || newStatus}`)
      // Reload in background to sync with server, but don't show loading
      const data = await api.pedidos.list()
      setAllPedidos(data)
    } catch (err: unknown) {
      // Revert on error
      setAllPedidos(prev => prev.map(p => {
        if (p.id === id) {
          const original = allPedidos.find(op => op.id === id)
          return original || p
        }
        return p
      }))
      const message = err instanceof Error ? err.message : 'Error al actualizar'
      toast.error(message)
    } finally {
      updatingIds.current.delete(id)
    }
  }

  const openEditDialog = (pedido: Pedido) => {
    setEditingPedido(pedido)
    const venta = pedido.venta as Venta | undefined
    setEditMetodoPago(venta?.metodoPago || '')
    setEditVendedor(venta?.vendedor || '')
    setEditNota(venta?.nota || '')
    setEditOpen(true)
  }

  const handleEditSave = async () => {
    if (!editingPedido?.ventaId) return
    try {
      setEditSaving(true)
      await api.ventas.update(editingPedido.ventaId, {
        metodoPago: editMetodoPago,
        vendedor: editVendedor,
        nota: editNota,
      })
      toast.success('Pedido actualizado')
      setEditOpen(false)
      // Reload in background
      const data = await api.pedidos.list()
      setAllPedidos(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar'
      toast.error(message)
    } finally {
      setEditSaving(false)
    }
  }

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // ── Render ──
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold" style={{ color: s.textPrimary }}>
          Pedidos
        </h2>
        <span
          className="text-sm px-2.5 py-0.5 rounded-full font-semibold"
          style={{
            background: s.accentMedium,
            color: s.accentSolid,
          }}
        >
          {totalCount}
        </span>
      </div>

      {/* ── Status Summary Bar ── */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {/* "Todos" button */}
        <button
          onClick={() => setFilterStatus('all')}
          className="flex-shrink-0 px-3 py-2.5 rounded-xl text-center transition-all border-2"
          style={{
            background: filterStatus === 'all' ? s.accentMedium : s.summaryBg,
            borderColor: filterStatus === 'all' ? s.summaryActiveBorder : s.summaryBorder,
            boxShadow: filterStatus === 'all' ? s.summaryActiveShadow : s.shadow,
          }}
        >
          <p className="text-lg font-bold" style={{ color: filterStatus === 'all' ? s.accentSolid : s.textPrimary }}>
            {totalCount}
          </p>
          <p className="text-[10px] font-medium" style={{ color: s.textMuted }}>
            Todos
          </p>
        </button>

        {/* Status counters */}
        {['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'].map(status => {
          const cfg = STATUS_CONFIG[status]
          const isActive = filterStatus === status
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(isActive ? 'all' : status)}
              className="flex-shrink-0 px-3 py-2.5 rounded-xl text-center transition-all border-2"
              style={{
                background: isActive ? getStatusBg(status, theme) : s.summaryBg,
                borderColor: isActive ? cfg.color : s.summaryBorder,
                boxShadow: isActive ? `0 0 0 2px ${cfg.color}33` : s.shadow,
              }}
            >
              <p className="text-lg font-bold" style={{ color: isActive ? cfg.color : s.textPrimary }}>
                {statusCounts[status] || 0}
              </p>
              <p className="text-[10px] font-medium" style={{ color: isActive ? getStatusText(status, theme) : s.textMuted }}>
                {cfg.emoji} {cfg.label}
              </p>
            </button>
          )
        })}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: s.textMuted }} />
          <Input
            placeholder="Buscar por cliente, vendedor, producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-xl pl-9"
            style={{
              background: s.inputBg,
              borderColor: s.inputBorder,
              color: s.textPrimary,
            }}
          />
        </div>
        <Select value={filterDrop} onValueChange={setFilterDrop}>
          <SelectTrigger
            className="rounded-xl w-full sm:w-48"
            style={{
              background: s.inputBg,
              borderColor: s.inputBorder,
              color: s.textPrimary,
            }}
          >
            <SelectValue placeholder="Filtrar por drop" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los drops</SelectItem>
            {drops.map(d => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Pedidos List (Grouped by Client) ── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-36 rounded-2xl"
              style={{ background: s.accentLight }}
            />
          ))}
        </div>
      ) : filteredPedidos.length === 0 ? (
        <Card
          className="rounded-2xl border-0"
          style={{ background: s.card, boxShadow: s.shadow }}
        >
          <CardContent className="py-16 text-center">
            <span className="text-5xl">📦</span>
            <p className="mt-3 text-base font-medium" style={{ color: s.textSecondary }}>
              No hay pedidos
            </p>
            <p className="mt-1 text-sm" style={{ color: s.textMuted }}>
              Los pedidos aparecerán aquí cuando registres ventas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          {groupedPedidos.map(group => {
            const groupKey = group.cliente.toLowerCase().trim()
            const isExpanded = expandedGroups.has(groupKey) || group.pedidos.length === 1
            const hasMultiplePedidos = group.pedidos.length > 1

            // Get worst status for the group badge
            const worstStatus = ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'].find(
              s => group.statusSummary[s] > 0
            ) || 'pendiente'
            const worstCfg = STATUS_CONFIG[worstStatus]

            // All items from all pedidos in this group
            const allItems = group.pedidos.flatMap(p => {
              const venta = p.venta as Venta | undefined
              return venta?.items || []
            })

            // Get vendedor and metodo from most recent pedido
            const latestVenta = (group.pedidos[0]?.venta as Venta | undefined)

            return (
              <Card
                key={groupKey}
                className="rounded-2xl border-0 transition-all"
                style={{
                  background: s.card,
                  boxShadow: s.shadow,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = s.shadowHover
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = s.shadow
                }}
              >
                <CardContent className="p-4">
                  {/* ── Group Header (Client Name + Summary) ── */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => hasMultiplePedidos && toggleGroup(groupKey)}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: s.accent }}
                      >
                        {group.cliente.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold truncate" style={{ color: s.textPrimary }}>
                            {group.cliente}
                          </span>
                          {hasMultiplePedidos && (
                            <Badge
                              className="text-[10px] font-semibold border-0 px-1.5 py-0"
                              style={{
                                background: s.accentLight,
                                color: s.accentSolid,
                              }}
                            >
                              {group.pedidos.length} pedidos
                            </Badge>
                          )}
                        </div>

                        {/* Items summary line */}
                        <div className="flex items-center gap-2 mt-0.5">
                          {allItems.length > 0 && (
                            <span className="text-xs truncate" style={{ color: s.textSecondary }}>
                              {allItems.map((item, i) => (
                                <span key={i}>
                                  {i > 0 && <span style={{ color: s.textMuted }}> · </span>}
                                  {item.productName} x{item.qty}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Total */}
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: s.accentSolid }}>
                          {fmt(group.totalAmount)}
                        </p>
                        <div className="flex items-center gap-1 justify-end">
                          {/* Status badges for group */}
                          {Object.entries(group.statusSummary).map(([status, count]) => {
                            if (count === 0) return null
                            const cfg = STATUS_CONFIG[status]
                            return (
                              <span
                                key={status}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                                style={{
                                  background: getStatusBg(status, theme),
                                  color: getStatusText(status, theme),
                                }}
                              >
                                {cfg.emoji} {count}
                              </span>
                            )
                          })}
                        </div>
                      </div>

                      {/* Expand/collapse arrow for groups */}
                      {hasMultiplePedidos && (
                        <div style={{ color: s.textMuted }}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Expanded: Individual Pedidos ── */}
                  {isExpanded && (
                    <div className="mt-3 space-y-2.5">
                      {group.pedidos.map(p => {
                        const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pendiente
                        const StatusIcon = STATUS_ICONS[p.status] || Clock
                        const nextStatus = getNextStatus(p.status)
                        const venta = p.venta as Venta | undefined
                        const isUpdating = updatingIds.current.has(p.id)

                        return (
                          <div
                            key={p.id}
                            className="rounded-xl p-3 transition-opacity"
                            style={{
                              background: theme === 'light' ? '#f8f5ff' : theme === 'dark' ? '#14112a' : '#0a0a0a',
                              border: `1px solid ${s.border}`,
                              opacity: isUpdating ? 0.6 : 1,
                            }}
                          >
                            {/* Top: status + items */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    className="text-[10px] font-semibold capitalize border-0 gap-1 px-2 py-0.5"
                                    style={{
                                      background: getStatusBg(p.status, theme),
                                      color: getStatusText(p.status, theme),
                                    }}
                                  >
                                    <StatusIcon className="w-3 h-3" />
                                    {cfg.label}
                                  </Badge>
                                  {hasMultiplePedidos && venta?.metodoPago && (
                                    <span
                                      className="px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                                      style={{
                                        background: s.accentLight,
                                        color: s.accentSolid,
                                      }}
                                    >
                                      {venta.metodoPago}
                                    </span>
                                  )}
                                </div>

                                {/* Items */}
                                {venta?.items && venta.items.length > 0 && (
                                  <div className="mt-1.5 space-y-0.5">
                                    {venta.items.map((item: VentaItem, i: number) => (
                                      <p key={i} className="text-xs" style={{ color: s.textSecondary }}>
                                        <span className="font-medium">{item.productName}</span>
                                        <span style={{ color: s.textMuted }}> · </span>
                                        <span style={{ color: s.textMuted }}>{item.color}/{item.talla}</span>
                                        <span style={{ color: s.textMuted }}> · </span>
                                        <span className="font-semibold" style={{ color: s.textSecondary }}>x{item.qty}</span>
                                      </p>
                                    ))}
                                  </div>
                                )}

                                {/* Info row */}
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: s.textMuted }}>
                                  {!hasMultiplePedidos && venta?.total !== undefined && (
                                    <span className="font-bold text-sm" style={{ color: s.accentSolid }}>
                                      {fmt(venta.total)}
                                    </span>
                                  )}
                                  {hasMultiplePedidos && venta?.total !== undefined && (
                                    <span className="font-semibold" style={{ color: s.accentSolid }}>
                                      {fmt(venta.total)}
                                    </span>
                                  )}
                                  {venta?.vendedor && (
                                    <span>👤 {venta.vendedor}</span>
                                  )}
                                  <span>
                                    {new Date(p.createdAt).toLocaleDateString('es-PE', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </div>

                                {/* Status pipeline */}
                                <StatusPipeline currentStatus={p.status} s={s} />
                              </div>

                              {/* Action buttons */}
                              <div className="flex flex-col gap-1.5 shrink-0">
                                {nextStatus && (
                                  <Button
                                    size="sm"
                                    className="rounded-xl text-xs text-white h-8 font-semibold border-0"
                                    style={{ background: s.accent }}
                                    onClick={() => handleStatusUpdate(p.id, nextStatus)}
                                    disabled={isUpdating}
                                  >
                                    <ArrowRight className="w-3 h-3 mr-1" />
                                    {STATUS_CONFIG[nextStatus]?.label || nextStatus}
                                  </Button>
                                )}
                                {p.status !== 'cancelado' && p.status !== 'entregado' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl text-xs h-8 font-medium border-0"
                                    style={{
                                      background: s.dangerBg,
                                      color: s.dangerText,
                                    }}
                                    onClick={() => handleStatusUpdate(p.id, 'cancelado')}
                                    disabled={isUpdating}
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Cancelar
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-xl text-xs h-8"
                                  style={{ color: s.textMuted }}
                                  onClick={() => openEditDialog(p)}
                                >
                                  <Edit2 className="w-3 h-3 mr-1" />
                                  Editar
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* ── Collapsed: Quick action buttons for single-item groups ── */}
                  {!isExpanded && hasMultiplePedidos && (
                    <div className="mt-2 flex items-center gap-2">
                      {/* Show action buttons for the worst-status pedido */}
                      {(() => {
                        const pendingPedido = group.pedidos.find(p => p.status === 'pendiente')
                          || group.pedidos.find(p => p.status === 'confirmado')
                          || group.pedidos.find(p => p.status === 'enviado')
                          || group.pedidos[0]
                        if (!pendingPedido) return null

                        const nextStatus = getNextStatus(pendingPedido.status)
                        return (
                          <>
                            {nextStatus && (
                              <Button
                                size="sm"
                                className="rounded-xl text-xs text-white h-7 font-semibold border-0"
                                style={{ background: s.accent }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusUpdate(pendingPedido.id, nextStatus)
                                }}
                              >
                                <ArrowRight className="w-3 h-3 mr-1" />
                                {STATUS_CONFIG[nextStatus]?.label}
                              </Button>
                            )}
                            <span className="text-[10px]" style={{ color: s.textMuted }}>
                              Click para ver detalles
                            </span>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent style={{ background: s.dialogBg, borderColor: s.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: s.textPrimary }}>
              Editar Pedido
            </DialogTitle>
            <DialogDescription style={{ color: s.textMuted }}>
              Modifica la información del pedido
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Metodo de pago */}
            <div className="space-y-1.5">
              <Label style={{ color: s.textSecondary }}>Método de pago</Label>
              <Select value={editMetodoPago} onValueChange={setEditMetodoPago}>
                <SelectTrigger
                  className="rounded-xl"
                  style={{
                    background: s.inputBg,
                    borderColor: s.inputBorder,
                    color: s.textPrimary,
                  }}
                >
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map(m => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vendedor */}
            <div className="space-y-1.5">
              <Label style={{ color: s.textSecondary }}>Vendedor</Label>
              <Input
                placeholder="Nombre del vendedor"
                value={editVendedor}
                onChange={e => setEditVendedor(e.target.value)}
                className="rounded-xl"
                style={{
                  background: s.inputBg,
                  borderColor: s.inputBorder,
                  color: s.textPrimary,
                }}
              />
            </div>

            {/* Nota */}
            <div className="space-y-1.5">
              <Label style={{ color: s.textSecondary }}>Nota</Label>
              <Input
                placeholder="Notas adicionales..."
                value={editNota}
                onChange={e => setEditNota(e.target.value)}
                className="rounded-xl"
                style={{
                  background: s.inputBg,
                  borderColor: s.inputBorder,
                  color: s.textPrimary,
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              style={{
                borderColor: s.border,
                color: s.textSecondary,
              }}
              onClick={() => setEditOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-xl text-white font-semibold border-0"
              style={{ background: s.accent }}
              onClick={handleEditSave}
              disabled={editSaving}
            >
              {editSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
