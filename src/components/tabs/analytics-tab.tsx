'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api, type AnalyticsData, type Drop } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, ComposedChart, Area } from 'recharts'

interface Props {
  drops: Drop[]
  loadDrops: () => Promise<void>
  theme: 'light' | 'dark' | 'black'
}

const THEME_STYLES = {
  light: { bg: '#f8f5ff', card: '#fff', border: '#e9e3ff', text: '#1e1b4b', muted: '#6b7280', grid: '#f0edff', tooltip: '#fff', tooltipText: '#1e1b4b' },
  dark: { bg: '#0f0d1a', card: '#1a1730', border: '#2d2a4a', text: '#e2e0ff', muted: '#9ca3af', grid: '#2d2a4a', tooltip: '#1a1730', tooltipText: '#e2e0ff' },
  black: { bg: '#000', card: '#111', border: '#222', text: '#fff', muted: '#888', grid: '#222', tooltip: '#222', tooltipText: '#fff' },
}

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#a855f7']

const fmt = (n: number) => 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`

export default function AnalyticsTab({ drops, loadDrops, theme }: Props) {
  const s = THEME_STYLES[theme]
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const analyticsData = await api.analytics.get()
      setData(analyticsData)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (!data) return null

  const hasData = (data.salesByColor?.length > 0) || (data.salesByMonth?.length > 0) || (data.salesByProduct?.length > 0)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-xl p-3 shadow-lg text-xs" style={{ background: s.tooltip, border: `1px solid ${s.border}`, color: s.tooltipText }}>
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!hasData ? (
        <Card className="rounded-2xl border-0 shadow-sm" style={{ background: s.card, border: `1px solid ${s.border}` }}>
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-3">📈</div>
            <p className="text-lg font-semibold" style={{ color: s.text }}>No hay datos de analytics</p>
            <p className="text-sm" style={{ color: s.muted }}>Registra algunas ventas para ver estadísticas</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Prediction Card */}
          {data.prediction && data.prediction.estimatedRevenue > 0 && (
            <Card className="rounded-2xl border-0 shadow-sm overflow-hidden" style={{ background: s.card, border: `1px solid ${s.border}` }}>
              <div className="h-1" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: s.muted }}>🔮 Predicción próximo mes</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#8b5cf6' }}>{fmt(data.prediction.estimatedRevenue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: s.muted }}>Promedio móvil simple</p>
                    <p className="text-sm font-semibold" style={{ color: '#10b981' }}>
                      Basado en {data.prediction.dataPoints || 3} meses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {/* Sales by Month */}
            {data.salesByMonth && data.salesByMonth.length > 0 && (
              <Card className="rounded-2xl border-0 shadow-sm" style={{ background: s.card, border: `1px solid ${s.border}` }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold" style={{ color: s.text }}>📅 Ventas por Mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={data.salesByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke={s.grid} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: s.muted }} />
                      <YAxis tick={{ fontSize: 10, fill: s.muted }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" name="Ventas" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.8} />
                      <Line type="monotone" dataKey="revenue" name="Tendencia" stroke="#ec4899" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Sales by Color */}
            {data.salesByColor && data.salesByColor.length > 0 && (
              <Card className="rounded-2xl border-0 shadow-sm" style={{ background: s.card, border: `1px solid ${s.border}` }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold" style={{ color: s.text }}>🎨 Ventas por Color</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={data.salesByColor}
                        dataKey="revenue"
                        nameKey="color"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ color, percent }: any) => `${color} ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.salesByColor.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Sales by Day of Week */}
            {data.salesByDayOfWeek && data.salesByDayOfWeek.length > 0 && (
              <Card className="rounded-2xl border-0 shadow-sm" style={{ background: s.card, border: `1px solid ${s.border}` }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold" style={{ color: s.text }}>📊 Ventas por Día de la Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.salesByDayOfWeek}>
                      <CartesianGrid strokeDasharray="3 3" stroke={s.grid} />
                      <XAxis dataKey="day" tick={{ fontSize: 9, fill: s.muted }} />
                      <YAxis tick={{ fontSize: 10, fill: s.muted }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" name="Ventas" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Sales by Talla */}
            {data.salesByTalla && data.salesByTalla.length > 0 && (
              <Card className="rounded-2xl border-0 shadow-sm" style={{ background: s.card, border: `1px solid ${s.border}` }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold" style={{ color: s.text }}>📏 Ventas por Talla</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.salesByTalla}>
                      <CartesianGrid strokeDasharray="3 3" stroke={s.grid} />
                      <XAxis dataKey="talla" tick={{ fontSize: 11, fill: s.muted }} />
                      <YAxis tick={{ fontSize: 10, fill: s.muted }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" name="Ventas" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Top Products */}
            {data.salesByProduct && data.salesByProduct.length > 0 && (
              <Card className="rounded-2xl border-0 shadow-sm" style={{ background: s.card, border: `1px solid ${s.border}` }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold" style={{ color: s.text }}>🏆 Top Productos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.salesByProduct.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={s.grid} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: s.muted }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: s.muted }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" name="Ventas" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Income vs Expenses by Drop */}
            {data.incomeVsExpensesByDrop && data.incomeVsExpensesByDrop.length > 0 && (
              <Card className="rounded-2xl border-0 shadow-sm" style={{ background: s.card, border: `1px solid ${s.border}` }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold" style={{ color: s.text }}>💼 Ingresos vs Gastos por Drop</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.incomeVsExpensesByDrop}>
                      <CartesianGrid strokeDasharray="3 3" stroke={s.grid} />
                      <XAxis dataKey="dropName" tick={{ fontSize: 10, fill: s.muted }} />
                      <YAxis tick={{ fontSize: 10, fill: s.muted }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, color: s.muted }} />
                      <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="inversiones" name="Inversiones" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Ranking & Commissions */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Top Clients Ranking */}
            {data.topClients && data.topClients.length > 0 && (
              <Card className="rounded-2xl border-0 shadow-sm" style={{ background: s.card, border: `1px solid ${s.border}` }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold" style={{ color: s.text }}>👑 Ranking de Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.topClients.slice(0, 10).map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl transition-colors"
                        style={{ background: i < 3 ? 'rgba(139,92,246,0.06)' : 'transparent' }}>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#92400e' : COLORS[i % COLORS.length] }}>
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium" style={{ color: s.text }}>{c.name || c.cliente}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold" style={{ color: '#10b981' }}>{fmt(c.totalSpent || c.total || 0)}</span>
                          <span className="text-xs ml-2" style={{ color: s.muted }}>{c.purchaseCount || 0} compras</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Seller Commissions */}
            {data.sellerCommissions && data.sellerCommissions.length > 0 && (
              <Card className="rounded-2xl border-0 shadow-sm" style={{ background: s.card, border: `1px solid ${s.border}` }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold" style={{ color: s.text }}>💰 Comisiones por Vendedor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.sellerCommissions.map((sc: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: s.text }}>{sc.seller}</p>
                            <p className="text-xs" style={{ color: s.muted }}>{sc.totalSales || 0} ventas · {fmt(sc.totalRevenue || 0)} en ventas</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold" style={{ color: '#8b5cf6' }}>{fmt(sc.commission || 0)}</p>
                            <p className="text-[10px]" style={{ color: s.muted }}>comisión</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Margin by Product */}
          {data.marginByProduct && data.marginByProduct.length > 0 && (
            <Card className="rounded-2xl border-0 shadow-sm" style={{ background: s.card, border: `1px solid ${s.border}` }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold" style={{ color: s.text }}>📊 Margen por Producto (Top 15)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {data.marginByProduct.slice(0, 15).map((p: any, i: number) => {
                    const marginPct = p.marginPct || (p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue * 100) : 0)
                    const marginColor = marginPct > 50 ? '#10b981' : marginPct > 30 ? '#f59e0b' : '#ef4444'
                    return (
                      <div key={i} className="flex items-center gap-3 py-2">
                        <span className="text-sm min-w-0 flex-1 truncate" style={{ color: s.text }}>{p.name}</span>
                        <div className="w-28 h-2 rounded-full overflow-hidden" style={{ background: s.bg }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, marginPct))}%`, background: marginColor }} />
                        </div>
                        <span className="text-sm font-semibold w-14 text-right" style={{ color: marginColor }}>
                          {marginPct.toFixed(0)}%
                        </span>
                        <span className="text-xs w-24 text-right" style={{ color: s.muted }}>
                          {fmt(p.margin || 0)} margen
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
