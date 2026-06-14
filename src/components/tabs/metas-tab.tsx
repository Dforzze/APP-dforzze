'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { api, type Meta, type Drop } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Loader2, Target } from 'lucide-react'

interface Props { drops: Drop[]; loadDrops: () => Promise<void>; theme: 'light' | 'dark' | 'black' }

const THEME_STYLES = {
  light: { bg: '#f8f5ff', card: '#fff', border: '#e9e3ff', text: '#1e1b4b', muted: '#6b7280', input: '#f8f5ff' },
  dark: { bg: '#0f0d1a', card: '#1a1730', border: '#2d2a4a', text: '#e2e0ff', muted: '#9ca3af', input: '#0f0d1a' },
  black: { bg: '#000', card: '#111', border: '#222', text: '#fff', muted: '#888', input: '#000' },
}

const TIPOS = [
  { value: 'ventas', label: '🛍️ Cantidad de ventas', unit: 'ventas' },
  { value: 'ingresos', label: '💰 Ingresos (S/)', unit: 'S/' },
  { value: 'clientes', label: '👥 Clientes nuevos', unit: 'clientes' },
  { value: 'pedidos', label: '📦 Pedidos entregados', unit: 'pedidos' },
]

const fmt = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

export default function MetasTab({ theme }: Props) {
  const s = THEME_STYLES[theme]
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Progreso simulado (en producción se calcularía con datos reales)
  const [progreso, setProgreso] = useState<Record<string, number>>({})

  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('ventas')
  const [objetivo, setObjetivo] = useState('')
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7))

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [metasData, ventasData, pedidosData, clientesData] = await Promise.all([
        api.metas.list(),
        api.ventas.list(),
        api.pedidos.list(),
        api.clientes.list(),
      ])
      setMetas(metasData)

      // Calcular progreso real por meta
      const prog: Record<string, number> = {}
      metasData.forEach((m: Meta) => {
        const [year, month] = m.periodo.split('-')
        const mesVentas = ventasData.filter(v => v.fecha.startsWith(m.periodo))
        const mesPedidos = pedidosData.filter(p => p.createdAt.startsWith(year + '-' + month) && p.status === 'entregado')
        const mesClientes = clientesData.filter(c => c.createdAt.startsWith(year + '-' + month))

        if (m.tipo === 'ventas') prog[m.id] = mesVentas.length
        else if (m.tipo === 'ingresos') prog[m.id] = mesVentas.reduce((s, v) => s + v.total, 0)
        else if (m.tipo === 'pedidos') prog[m.id] = mesPedidos.length
        else if (m.tipo === 'clientes') prog[m.id] = mesClientes.length
        else prog[m.id] = 0
      })
      setProgreso(prog)
    } catch { toast.error('Error al cargar metas') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!nombre.trim() || !objetivo || !periodo) { toast.error('Completá todos los campos'); return }
    setSaving(true)
    try {
      await api.metas.create({ nombre, tipo, objetivo: parseFloat(objetivo), periodo })
      toast.success('Meta creada ✓')
      setDialogOpen(false); await load()
    } catch (e: any) { toast.error(e.message || 'Error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try { await api.metas.delete(id); toast.success('Meta eliminada ✓'); setDeleteConfirm(null); await load() }
    catch (e: any) { toast.error(e.message || 'Error') }
  }

  const inputStyle = { background: s.input, border: `1px solid ${s.border}`, color: s.text, borderRadius: '10px', padding: '8px 12px', fontSize: '13px', outline: 'none', width: '100%' }

  const getColor = (pct: number) => {
    if (pct >= 100) return '#10b981'
    if (pct >= 60) return '#8b5cf6'
    if (pct >= 30) return '#f59e0b'
    return '#ef4444'
  }

  const getMesLabel = (periodo: string) => {
    const [y, m] = periodo.split('-')
    const date = new Date(parseInt(y), parseInt(m) - 1, 1)
    return date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: s.muted }}>🎯 Metas de ventas</h2>
        <Button onClick={() => { setNombre(''); setTipo('ventas'); setObjetivo(''); setPeriodo(new Date().toISOString().slice(0, 7)); setDialogOpen(true) }}
          className="text-white font-semibold rounded-xl h-9 text-sm" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
          <Plus className="w-4 h-4 mr-1" /> Nueva meta
        </Button>
      </div>

      {loading ? (
        <div style={{ color: s.muted, textAlign: 'center', padding: '40px' }}>Cargando...</div>
      ) : metas.length === 0 ? (
        <Card className="rounded-2xl" style={{ background: s.card, border: `1px solid ${s.border}` }}>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-2">🎯</div>
            <p style={{ color: s.muted }}>No hay metas. ¡Creá una para motivarte!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metas.map(m => {
            const actual = progreso[m.id] || 0
            const pct = Math.min(100, Math.round((actual / m.objetivo) * 100))
            const color = getColor(pct)
            const tipoInfo = TIPOS.find(t => t.value === m.tipo) || TIPOS[0]
            return (
              <Card key={m.id} className="rounded-2xl" style={{ background: s.card, border: `1px solid ${s.border}` }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-sm" style={{ color: s.text }}>{m.nombre}</div>
                      <div className="text-xs mt-0.5" style={{ color: s.muted }}>{tipoInfo.label} · {getMesLabel(m.periodo)}</div>
                    </div>
                    <div className="flex gap-1">
                      {deleteConfirm === m.id ? (
                        <button onClick={() => handleDelete(m.id)} style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700', padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}>✓ Eliminar</button>
                      ) : (
                        <button onClick={() => setDeleteConfirm(m.id)} style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}>🗑️</button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ height: '8px', background: s.border, borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: s.muted }}>
                      {m.tipo === 'ingresos' ? `S/ ${fmt(actual)}` : `${fmt(actual)} ${tipoInfo.unit}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span style={{ fontWeight: '700', color, fontSize: '16px' }}>{pct}%</span>
                      <span style={{ color: s.muted }}>
                        de {m.tipo === 'ingresos' ? `S/ ${fmt(m.objetivo)}` : `${fmt(m.objetivo)} ${tipoInfo.unit}`}
                      </span>
                    </div>
                  </div>

                  {pct >= 100 && (
                    <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                      🎉 ¡Meta alcanzada!
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl" style={{ background: s.card, border: `1px solid ${s.border}`, color: s.text }}>
          <DialogHeader>
            <DialogTitle>🎯 Nueva Meta</DialogTitle>
            <DialogDescription style={{ color: s.muted }}>Definí un objetivo para este mes</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label style={{ color: s.muted }}>Nombre de la meta *</Label><input style={inputStyle} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Ventas de mayo" /></div>
            <div><Label style={{ color: s.muted }}>Tipo</Label>
              <select style={inputStyle} value={tipo} onChange={e => setTipo(e.target.value)}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><Label style={{ color: s.muted }}>Objetivo *</Label><input type="number" style={inputStyle} value={objetivo} onChange={e => setObjetivo(e.target.value)} placeholder="Ej: 50" /></div>
            <div><Label style={{ color: s.muted }}>Periodo (mes) *</Label><input type="month" style={inputStyle} value={periodo} onChange={e => setPeriodo(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} style={{ borderColor: s.border, color: s.text }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="text-white font-semibold" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : '+ Crear meta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
