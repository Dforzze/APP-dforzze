'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { api, type Cliente, type Venta, type Drop } from '@/lib/api'
import { toast } from 'sonner'
import { Users, Plus, Edit2, Trash2, Phone, Star, Loader2, Search, Merge, Gem, Crown } from 'lucide-react'

interface Props {
  drops: Drop[]
  loadDrops: () => Promise<void>
  theme: 'light' | 'dark' | 'black'
}

const THEME_STYLES = {
  light: { bg: '#f8f5ff', card: '#fff', border: '#e9e3ff', text: '#1e1b4b', muted: '#6b7280', input: '#f8f5ff', hover: '#f3eeff' },
  dark: { bg: '#0f0d1a', card: '#1a1730', border: '#2d2a4a', text: '#e2e0ff', muted: '#9ca3af', input: '#0f0d1a', hover: '#231f3d' },
  black: { bg: '#000', card: '#111', border: '#222', text: '#fff', muted: '#888', input: '#000', hover: '#1a1a1a' },
}

function getLoyaltyLevel(totalSpent: number): { level: string; emoji: string; color: string; bgColor: string; textColor: string } {
  if (totalSpent >= 10000) return { level: 'Diamante', emoji: '💎', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.12)', textColor: '#a78bfa' }
  if (totalSpent >= 5000) return { level: 'Oro', emoji: '🥇', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)', textColor: '#fbbf24' }
  if (totalSpent >= 2000) return { level: 'Plata', emoji: '🥈', color: '#6b7280', bgColor: 'rgba(107,114,128,0.12)', textColor: '#9ca3af' }
  if (totalSpent >= 500) return { level: 'Bronce', emoji: '🥉', color: '#92400e', bgColor: 'rgba(146,64,14,0.12)', textColor: '#d97706' }
  return { level: 'Nuevo', emoji: '🆕', color: '#10b981', bgColor: 'rgba(16,185,129,0.12)', textColor: '#34d399' }
}

const fmt = (n: number) => 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fd = (dateStr: string) => dateStr ? new Date(dateStr + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : ''

export default function ClientesTab({ drops, loadDrops, theme }: Props) {
  const s = THEME_STYLES[theme]
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [mergeOpen, setMergeOpen] = useState(false)

  // Form
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  const loadClientes = useCallback(async () => {
    try {
      setLoading(true)
      const [clientesData, ventasData] = await Promise.all([
        api.clientes.list(),
        api.ventas.list(),
      ])
      setClientes(clientesData)
      setVentas(ventasData)
    } catch {
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadClientes() }, [loadClientes])

  // Compute client stats from ventas
  const clientStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number; lastDate: string }> = {}
    ventas.forEach(v => {
      const key = v.cliente.toLowerCase().trim()
      if (!stats[key]) stats[key] = { count: 0, total: 0, lastDate: '' }
      stats[key].count++
      stats[key].total += v.total
      if (v.fecha > stats[key].lastDate) stats[key].lastDate = v.fecha
    })
    return stats
  }, [ventas])

  // Detect duplicates
  const duplicateGroups = useMemo(() => {
    const names: Record<string, Cliente[]> = {}
    clientes.forEach(c => {
      const key = c.name.toLowerCase().trim()
      if (!names[key]) names[key] = []
      names[key].push(c)
    })
    return Object.values(names).filter(g => g.length > 1)
  }, [clientes])

  const initForm = () => { setName(''); setPhone(''); setNotes('') }

  const openCreate = () => { setEditingCliente(null); initForm(); setDialogOpen(true) }

  const openEdit = (c: Cliente) => {
    setEditingCliente(c)
    setName(c.name)
    setPhone(c.phone)
    setNotes(c.notes)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('El nombre es requerido'); return }
    setSaving(true)
    try {
      if (editingCliente) {
        await api.clientes.update(editingCliente.id, { name, phone, notes })
        toast.success('Cliente actualizado ✓')
      } else {
        await api.clientes.create({ name, phone, notes })
        toast.success('Cliente creado ✓')
      }
      setDialogOpen(false)
      await loadClientes()
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.clientes.delete(id)
      toast.success('Cliente eliminado ✓')
      setDeleteConfirm(null)
      await loadClientes()
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar')
    }
  }

  const handleMerge = async (group: Cliente[]) => {
    if (group.length < 2) return
    const main = group[0]
    // Merge phone/notes from duplicates
    let mergedPhone = main.phone
    let mergedNotes = main.notes
    for (let i = 1; i < group.length; i++) {
      if (!mergedPhone && group[i].phone) mergedPhone = group[i].phone
      if (group[i].notes && !mergedNotes.includes(group[i].notes)) {
        mergedNotes = mergedNotes ? mergedNotes + ' | ' + group[i].notes : group[i].notes
      }
    }
    try {
      // Update main client
      await api.clientes.update(main.id, { phone: mergedPhone, notes: mergedNotes })
      // Update all ventas that reference duplicate names
      const duplicates = group.slice(1)
      for (const dup of duplicates) {
        // Update ventas referencing duplicate name
        const dupVentas = ventas.filter(v => v.cliente.toLowerCase().trim() === dup.name.toLowerCase().trim())
        for (const v of dupVentas) {
          await api.ventas.update(v.id, { cliente: main.name })
        }
        // Delete duplicate client
        await api.clientes.delete(dup.id)
      }
      toast.success(`Clientes fusionados en "${main.name}" ✓`)
      setMergeOpen(false)
      await loadClientes()
    } catch (err: any) {
      toast.error(err.message || 'Error al fusionar')
    }
  }

  const filteredClientes = clientes.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.toLowerCase().includes(search.toLowerCase())
  )

  const inputStyle = { background: s.input, border: `1px solid ${s.border}`, color: s.text, borderRadius: '10px', padding: '8px 12px', fontSize: '13px', outline: 'none', width: '100%' }

  return (
    <div className="space-y-4">
      {/* Header */}
      <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: s.muted, letterSpacing: '1.5px' }}>
        👥 Base de clientes
      </h2>

      {/* Create Form */}
      <Card className="rounded-2xl border-0 shadow-sm" style={{ background: s.card, border: `1px solid ${s.border}` }}>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: s.text }}>Registrar nuevo cliente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <Label className="text-xs" style={{ color: s.muted }}>Nombre *</Label>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div>
              <Label className="text-xs" style={{ color: s.muted }}>Teléfono / Instagram</Label>
              <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="@usuario o número…" />
            </div>
            <div>
              <Label className="text-xs" style={{ color: s.muted }}>Notas</Label>
              <input style={inputStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Talla habitual, preferencias…" />
            </div>
          </div>
          <Button onClick={openCreate} disabled={!name.trim()} className="text-white font-semibold rounded-xl h-9 text-sm"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
            <Plus className="w-4 h-4 mr-1" /> Agregar cliente
          </Button>
        </CardContent>
      </Card>

      {/* Search + Merge */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: s.muted }} />
          <input style={{ ...inputStyle, paddingLeft: '32px' }} value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar cliente…" />
        </div>
        {duplicateGroups.length > 0 && (
          <Button variant="outline" size="sm" className="rounded-xl" style={{ borderColor: s.border, color: s.text }}
            onClick={() => setMergeOpen(true)}>
            <Merge className="w-4 h-4 mr-1" /> Fusionar ({duplicateGroups.length})
          </Button>
        )}
      </div>

      {/* Clientes Table */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : filteredClientes.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm" style={{ background: s.card, border: `1px solid ${s.border}` }}>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-2">👥</div>
            <p style={{ color: s.muted }}>No hay clientes registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-0 shadow-sm overflow-hidden" style={{ background: s.card, border: `1px solid ${s.border}` }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: s.text }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${s.border}` }}>
                  <th className="text-left py-3 px-4 font-semibold text-xs" style={{ color: s.muted }}>Cliente</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs" style={{ color: s.muted }}>Contacto</th>
                  <th className="text-center py-3 px-4 font-semibold text-xs" style={{ color: s.muted }}>Compras</th>
                  <th className="text-right py-3 px-4 font-semibold text-xs" style={{ color: s.muted }}>Total gastado</th>
                  <th className="text-center py-3 px-4 font-semibold text-xs" style={{ color: s.muted }}>Nivel</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs" style={{ color: s.muted }}>Último pedido</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs" style={{ color: s.muted }}>Notas</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map(c => {
                  const stats = clientStats[c.name.toLowerCase().trim()] || { count: 0, total: 0, lastDate: '' }
                  const loyalty = getLoyaltyLevel(stats.total)
                  return (
                    <tr key={c.id} className="transition-colors" style={{ borderBottom: `1px solid ${s.border}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = s.hover)}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <td className="py-3 px-4 font-semibold">{c.name}</td>
                      <td className="py-3 px-4" style={{ color: s.muted }}>
                        {c.phone ? <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span> : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold" style={{ color: '#8b5cf6' }}>{stats.count}</td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: '#10b981' }}>{fmt(stats.total)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: loyalty.bgColor, color: loyalty.textColor }}>
                          {loyalty.emoji} {loyalty.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: s.muted }}>{stats.lastDate ? fd(stats.lastDate) : '—'}</td>
                      <td className="py-3 px-4 text-xs max-w-[120px] truncate" style={{ color: s.muted }}>{c.notes || '—'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button onClick={() => openEdit(c)} className="p-1 rounded-lg transition-colors hover:bg-purple-500/10" title="Editar">✏️</button>
                        {deleteConfirm === c.id ? (
                          <button onClick={() => handleDelete(c.id)} className="p-1 rounded-lg text-xs font-semibold text-red-500" title="Confirmar">✓</button>
                        ) : (
                          <button onClick={() => setDeleteConfirm(c.id)} className="p-1 rounded-lg transition-colors hover:bg-red-500/10" title="Eliminar">🗑️</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl" style={{ background: s.card, border: `1px solid ${s.border}`, color: s.text }}>
          <DialogHeader>
            <DialogTitle>{editingCliente ? '✏️ Editar Cliente' : '👥 Nuevo Cliente'}</DialogTitle>
            <DialogDescription style={{ color: s.muted }}>
              {editingCliente ? 'Modifica los datos del cliente' : 'Agrega un nuevo cliente a tu base'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label style={{ color: s.muted }}>Nombre *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del cliente"
                className="rounded-xl" style={{ background: s.input, border: `1px solid ${s.border}`, color: s.text }} />
            </div>
            <div className="space-y-2">
              <Label style={{ color: s.muted }}>Teléfono / Instagram</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="@usuario o número…"
                className="rounded-xl" style={{ background: s.input, border: `1px solid ${s.border}`, color: s.text }} />
            </div>
            <div className="space-y-2">
              <Label style={{ color: s.muted }}>Notas</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Talla habitual, preferencias…"
                className="rounded-xl" style={{ background: s.input, border: `1px solid ${s.border}`, color: s.text }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl"
              style={{ borderColor: s.border, color: s.text }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingCliente ? '✓ Guardar' : '+ Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Duplicates Dialog */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="rounded-2xl" style={{ background: s.card, border: `1px solid ${s.border}`, color: s.text }}>
          <DialogHeader>
            <DialogTitle>🔗 Fusionar clientes duplicados</DialogTitle>
            <DialogDescription style={{ color: s.muted }}>
              Se encontraron {duplicateGroups.length} grupo(s) con el mismo nombre. Fusionar combinará los datos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto py-2">
            {duplicateGroups.map((group, gi) => {
              const main = group[0]
              const totalVentas = group.reduce((s, c) => s + (clientStats[c.name.toLowerCase().trim()]?.count || 0), 0)
              return (
                <div key={gi} className="p-3 rounded-xl" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <div className="font-semibold text-sm">{main.name}</div>
                      <div className="text-xs" style={{ color: s.muted }}>{group.length} registros · {totalVentas} ventas totales</div>
                      <div className="text-[10px] mt-1" style={{ color: s.muted }}>
                        {group.map(c => c.name + (c.phone ? ` (${c.phone})` : '')).join(' / ')}
                      </div>
                    </div>
                    <Button size="sm" className="text-white rounded-xl text-xs"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
                      onClick={() => handleMerge(group)}>
                      🔗 Fusionar
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)} className="rounded-xl"
              style={{ borderColor: s.border, color: s.text }}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
