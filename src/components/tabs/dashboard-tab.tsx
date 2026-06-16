'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { api, type DashboardData, type Drop } from '@/lib/api'
import {
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Banknote,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'

// ─── Theme Config ──────────────────────────────────────────────────────────

interface ThemeColors {
  bg: string
  card: string
  border: string
  text: string
  muted: string
}

const THEMES: Record<string, ThemeColors> = {
  light: { bg: '#f8f5ff', card: '#ffffff', border: '#e9e3ff', text: '#1e1b4b', muted: '#6b7280' },
  dark: { bg: '#0f0d1a', card: '#1a1730', border: '#2d2a4a', text: '#e2e0ff', muted: '#9ca3af' },
  black: { bg: '#000000', card: '#111111', border: '#222222', text: '#ffffff', muted: '#888888' },
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface Props {
  drops: Drop[]
  loadDrops: () => Promise<void>
  theme: 'light' | 'dark' | 'black'
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function DashboardTab({ drops, loadDrops, theme }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cajaDialogOpen, setCajaDialogOpen] = useState(false)
  const [cajaInput, setCajaInput] = useState('')
  const [cajaSaving, setCajaSaving] = useState(false)

  const t = THEMES[theme] ?? THEMES.dark

  // ── Load data ──
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const dashboardData = await api.dashboard.get()
      setData(dashboardData)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Helpers ──
  const fmt = (n: number | string) => {
    const num = typeof n === 'string' ? parseFloat(n) : n
    if (isNaN(num)) return 'S/ 0.00'
    return 'S/ ' + num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const fd = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`

  // ── Caja edit ──
  const openCajaDialog = () => {
    if (!data) return
    setCajaInput(String(data.cajaManual))
    setCajaDialogOpen(true)
  }

  const saveCaja = async () => {
    const val = parseFloat(cajaInput)
    if (isNaN(val)) {
      toast.error('Ingresa un número válido')
      return
    }
    try {
      setCajaSaving(true)
      await api.business.update({ cajaManual: val })
      toast.success('Caja manual actualizada')
      setCajaDialogOpen(false)
      await loadData()
    } catch {
      toast.error('Error al actualizar caja')
    } finally {
      setCajaSaving(false)
    }
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl" style={{ background: t.card, borderColor: t.border }}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" style={{ background: `${t.muted}22` }} />
                <Skeleton className="h-8 w-20" style={{ background: `${t.muted}22` }} />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-2xl" style={{ background: t.card, borderColor: t.border }}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" style={{ background: `${t.muted}22` }} />
                <Skeleton className="h-8 w-16" style={{ background: `${t.muted}22` }} />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" style={{ background: `${t.muted}15` }} />
      </div>
    )
  }

  if (!data) return null

  // ── Period Summary Cards ──
  const periodCards = [
    {
      emoji: '📅',
      label: 'Esta semana',
      value: fmt(data.period.semana.total),
      sub: `${data.period.semana.qty} vendidas`,
      color: '#8b5cf6',
    },
    {
      emoji: '📆',
      label: 'Este mes',
      value: fmt(data.period.mes.total),
      sub: `${data.period.mes.qty} vendidas · Gastos ${fmt(data.period.mes.gastos)}`,
      color: '#6366f1',
    },
    {
      emoji: '📈',
      label: 'Crecimiento',
      value: pct(data.period.growth),
      sub: 'vs mes anterior',
      color: data.period.growth >= 0 ? '#10b981' : '#ef4444',
    },
    {
      emoji: '💰',
      label: 'Margen mensual',
      value: fmt(data.period.margenMensual),
      sub: 'Ventas − Gastos',
      color: data.period.margenMensual >= 0 ? '#10b981' : '#ef4444',
    },
  ]

  // ── Main Stats Grid ──
  const mainStats = [
    {
      label: 'Productos',
      value: String(data.productos.total),
      icon: Package,
      color: '#8b5cf6',
      sub: `${data.productos.lowStock} bajo · ${data.productos.outOfStock} sin stock`,
    },
    {
      label: 'Valor Stock',
      value: fmt(data.productos.stockValue),
      icon: Wallet,
      color: '#6366f1',
      sub: 'Inventario total',
    },
    {
      label: 'Ventas',
      value: fmt(data.ventas.revenue),
      icon: DollarSign,
      color: '#10b981',
      sub: `${data.ventas.total} transacciones`,
    },
    {
      label: 'Gastos',
      value: fmt(data.gastos.gastos + data.gastos.inversiones),
      icon: ShoppingCart,
      color: '#ef4444',
      sub: `Inv: ${fmt(data.gastos.inversiones)}`,
    },
    {
      label: 'Caja',
      value: fmt(data.caja),
      icon: Banknote,
      color: '#f59e0b',
      sub: `Retiros: ${fmt(data.gastos.retiros)}`,
      onClick: openCajaDialog,
    },
    {
      label: 'ROI',
      value: pct(data.roi),
      icon: data.roi >= 0 ? ArrowUpRight : ArrowDownRight,
      color: data.roi >= 0 ? '#10b981' : '#ef4444',
      sub: 'Retorno inversión',
    },
  ]

  // ── Financial Summary ──
  const financialCards = [
    { label: 'Ingresos', value: fmt(data.ventas.revenue), color: '#10b981', bg: theme === 'light' ? '#ecfdf5' : theme === 'dark' ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)' },
    { label: 'Gastos', value: fmt(data.gastos.gastos), color: '#ef4444', bg: theme === 'light' ? '#fef2f2' : theme === 'dark' ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)' },
    { label: 'Inversiones', value: fmt(data.gastos.inversiones), color: '#3b82f6', bg: theme === 'light' ? '#eff6ff' : theme === 'dark' ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)' },
    { label: 'Comisiones', value: fmt(data.ventas.comisiones), color: '#8b5cf6', bg: theme === 'light' ? '#f5f3ff' : theme === 'dark' ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.08)' },
  ]

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* ═══ Period Summary Cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {periodCards.map((card, i) => (
          <Card
            key={i}
            className="rounded-2xl transition-shadow hover:shadow-lg"
            style={{
              background: t.card,
              borderColor: t.border,
              borderLeft: `3px solid ${card.color}`,
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{card.emoji}</span>
                <span className="text-xs font-medium" style={{ color: t.muted }}>{card.label}</span>
              </div>
              <p className="text-xl font-bold truncate" style={{ color: card.color }}>
                {card.value}
              </p>
              <p className="text-[11px] mt-1 truncate" style={{ color: t.muted }}>
                {card.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ Main Stats Grid ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {mainStats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card
              key={i}
              className="rounded-2xl transition-shadow hover:shadow-lg cursor-default"
              style={{
                background: t.card,
                borderColor: t.border,
                borderLeft: `3px solid ${stat.color}`,
                ...(stat.onClick ? { cursor: 'pointer' } : {}),
              }}
              onClick={stat.onClick}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${stat.color}18` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <span className="text-xs font-medium truncate" style={{ color: t.muted }}>
                    {stat.label}
                  </span>
                </div>
                <p className="text-lg font-bold truncate" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-[10px] truncate" style={{ color: t.muted }}>
                    {stat.sub}
                  </p>
                  {stat.onClick && (
                    <Edit2 className="w-3 h-3 shrink-0" style={{ color: t.muted }} />
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ═══ Middle Section: Stock Alerts + Top Products ═══ */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Stock Alerts */}
        <Card
          className="rounded-2xl"
          style={{ background: t.card, borderColor: t.border }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: t.text }}>
              <span>⚠️</span> Alertas de Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Out of stock products */}
            {data.productos.outOfStockProducts.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    className="text-[10px] font-bold"
                    style={{
                      background: 'rgba(239,68,68,0.15)',
                      color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.25)',
                    }}
                  >
                    AGOTADO
                  </Badge>
                  <span className="text-xs" style={{ color: t.muted }}>
                    {data.productos.outOfStockProducts.length} producto{data.productos.outOfStockProducts.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                  {data.productos.outOfStockProducts.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 px-3 rounded-lg"
                      style={{ background: 'rgba(239,68,68,0.06)', borderLeft: '3px solid #ef4444' }}
                    >
                      <span className="text-sm font-medium truncate" style={{ color: t.text }}>
                        {p.name}
                      </span>
                      <span className="text-[11px] whitespace-nowrap ml-2" style={{ color: t.muted }}>
                        {p.color} · {p.talla}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Low stock products */}
            {data.productos.lowStockProducts.length > 0 && (
              <div className="mb-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    className="text-[10px] font-bold"
                    style={{
                      background: 'rgba(245,158,11,0.15)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245,158,11,0.25)',
                    }}
                  >
                    BAJO STOCK
                  </Badge>
                  <span className="text-xs" style={{ color: t.muted }}>
                    {data.productos.lowStockProducts.length} producto{data.productos.lowStockProducts.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                  {data.productos.lowStockProducts.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 px-3 rounded-lg"
                      style={{ background: 'rgba(245,158,11,0.06)', borderLeft: '3px solid #f59e0b' }}
                    >
                      <span className="text-sm font-medium truncate" style={{ color: t.text }}>
                        {p.name}
                      </span>
                      <span className="text-[11px] whitespace-nowrap ml-2" style={{ color: t.muted }}>
                        {p.color} · {p.talla} · Stock: {p.stock}/{p.minStock}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All OK */}
            {data.productos.outOfStock === 0 && data.productos.lowStock === 0 && (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-sm font-medium" style={{ color: t.muted }}>
                  Todo OK — Stock saludable
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card
          className="rounded-2xl"
          style={{ background: t.card, borderColor: t.border }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: t.text }}>
              <span>🏆</span> Top Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm" style={{ color: t.muted }}>
                  No hay datos de ventas aún
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.topProducts.slice(0, 8).map((p: any, i: number) => {
                  const rankColors = ['#f59e0b', '#9ca3af', '#b45309']
                  const rankColor = i < 3 ? rankColors[i] : t.muted
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 rounded-lg transition-colors"
                      style={{
                        background: i === 0 ? `${theme === 'light' ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)'}` : 'transparent',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            color: rankColor,
                            background: i < 3 ? `${rankColor}18` : `${t.muted}12`,
                          }}
                        >
                          #{i + 1}
                        </span>
                        <span className="text-sm font-medium truncate" style={{ color: t.text }}>
                          {p.name}
                        </span>
                      </div>
                      <span
                        className="text-sm font-bold whitespace-nowrap ml-2"
                        style={{ color: '#10b981' }}
                      >
                        {fmt(p.total || p.revenue || 0)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ Recent Ventas ═══ */}
      <Card
        className="rounded-2xl"
        style={{ background: t.card, borderColor: t.border }}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2" style={{ color: t.text }}>
            <span>🛒</span> Ventas Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data.recentVentas || data.recentVentas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🛍️</p>
              <p className="text-sm" style={{ color: t.muted }}>
                No hay ventas registradas aún
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    <th className="text-left py-2.5 px-2 font-semibold text-xs" style={{ color: t.muted }}>
                      Cliente
                    </th>
                    <th className="text-left py-2.5 px-2 font-semibold text-xs" style={{ color: t.muted }}>
                      Fecha
                    </th>
                    <th className="text-right py-2.5 px-2 font-semibold text-xs" style={{ color: t.muted }}>
                      Total
                    </th>
                    <th className="text-center py-2.5 px-2 font-semibold text-xs" style={{ color: t.muted }}>
                      Pago
                    </th>
                    <th className="text-right py-2.5 px-2 font-semibold text-xs" style={{ color: t.muted }}>
                      Items
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentVentas.map((v: any) => (
                    <tr
                      key={v.id}
                      className="transition-colors"
                      style={{ borderBottom: `1px solid ${t.border}44` }}
                    >
                      <td className="py-2.5 px-2 font-medium" style={{ color: t.text }}>
                        {v.cliente}
                      </td>
                      <td className="py-2.5 px-2" style={{ color: t.muted }}>
                        {fd(v.fecha)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold" style={{ color: '#10b981' }}>
                        {fmt(v.total)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium"
                          style={{
                            borderColor: `${t.border}`,
                            color: t.muted,
                          }}
                        >
                          {v.metodoPago}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2 text-right text-xs" style={{ color: t.muted }}>
                        {v.items?.length ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Financial Summary ═══ */}
      <Card
        className="rounded-2xl"
        style={{ background: t.card, borderColor: t.border }}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2" style={{ color: t.text }}>
            <span>💳</span> Resumen Financiero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {financialCards.map((fc, i) => (
              <div
                key={i}
                className="text-center p-4 rounded-xl"
                style={{ background: fc.bg }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: t.muted }}>
                  {fc.label}
                </p>
                <p className="text-lg font-bold" style={{ color: fc.color }}>
                  {fc.value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══ Charts Section ═══ */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Ventas por mes */}
        {data.topProducts && data.topProducts.length > 0 && (
          <Card className="rounded-2xl" style={{ background: t.card, borderColor: t.border }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2" style={{ color: t.text }}>
                🏆 Top Productos por Ingreso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.topProducts.slice(0, 6)} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: t.muted }} tickFormatter={v => `S/${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: t.text }} width={60} />
                  <Tooltip
                    formatter={(v: number) => [`S/ ${v.toFixed(0)}`, 'Ingresos']}
                    contentStyle={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                    {data.topProducts.slice(0, 6).map((_: any, i: number) => (
                      <Cell key={i} fill={['#8b5cf6','#ec4899','#6366f1','#10b981','#f59e0b','#3b82f6'][i % 6]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Colores */}
        {data.topColors && data.topColors.length > 0 && (
          <Card className="rounded-2xl" style={{ background: t.card, borderColor: t.border }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2" style={{ color: t.text }}>
                🎨 Ventas por Color
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.topColors.slice(0, 6)}
                    dataKey="qty"
                    nameKey="color"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ color, percent }) => `${color} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.topColors.slice(0, 6).map((_: any, i: number) => (
                      <Cell key={i} fill={['#8b5cf6','#ec4899','#f97316','#10b981','#3b82f6','#f59e0b'][i % 6]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [v, 'unidades']}
                    contentStyle={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ═══ Top Tallas ═══ */}
      {data.topTallas && data.topTallas.length > 0 && (
        <Card className="rounded-2xl" style={{ background: t.card, borderColor: t.border }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: t.text }}>
              📏 Ventas por Talla
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.topTallas} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <XAxis dataKey="talla" tick={{ fontSize: 11, fill: t.text }} />
                <YAxis tick={{ fontSize: 10, fill: t.muted }} />
                <Tooltip
                  formatter={(v: number) => [v, 'unidades']}
                  contentStyle={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="qty" radius={[6, 6, 0, 0]}>
                  {data.topTallas.map((_: any, i: number) => (
                    <Cell key={i} fill={['#8b5cf6','#ec4899','#6366f1','#10b981','#f59e0b','#3b82f6'][i % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ═══ Caja Manual Edit Dialog ═══ */}
      <Dialog open={cajaDialogOpen} onOpenChange={setCajaDialogOpen}>
        <DialogContent
          style={{
            background: t.card,
            borderColor: t.border,
            color: t.text,
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: t.text }}>
              <Banknote className="w-5 h-5" style={{ color: '#f59e0b' }} />
              Editar Caja Manual
            </DialogTitle>
            <DialogDescription style={{ color: t.muted }}>
              Ingresa el monto de caja manual. Esto ajusta tu caja disponible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: t.muted }}>
                Monto de caja manual
              </label>
              <Input
                type="number"
                step="0.01"
                value={cajaInput}
                onChange={(e) => setCajaInput(e.target.value)}
                placeholder="0.00"
                className="text-lg font-semibold"
                style={{
                  background: t.bg,
                  borderColor: t.border,
                  color: t.text,
                }}
              />
            </div>

            <Separator style={{ background: t.border }} />

            {/* Formula display */}
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ background: theme === 'light' ? 'rgba(139,92,246,0.05)' : 'rgba(139,92,246,0.08)', border: `1px solid ${theme === 'light' ? '#e9e3ff' : 'rgba(139,92,246,0.15)'}` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: t.muted }}>Tu caja</span>
                <span className="text-sm font-semibold" style={{ color: t.text }}>
                  {fmt(parseFloat(cajaInput) || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: t.muted }}>− Retiros</span>
                <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                  −{fmt(data.gastos.retiros)}
                </span>
              </div>
              <Separator style={{ background: t.border }} />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: t.text }}>= Disponible</span>
                <span className="text-sm font-bold" style={{ color: '#10b981' }}>
                  {fmt((parseFloat(cajaInput) || 0) - data.gastos.retiros)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCajaDialogOpen(false)}
                style={{
                  borderColor: t.border,
                  color: t.text,
                  background: 'transparent',
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={saveCaja}
                disabled={cajaSaving}
                style={{
                  background: '#8b5cf6',
                  color: '#fff',
                }}
              >
                {cajaSaving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
