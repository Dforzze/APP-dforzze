'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { api, type Nota, type Drop } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'

interface Props { drops: Drop[]; loadDrops: () => Promise<void>; theme: 'light' | 'dark' | 'black' }

const THEME_STYLES = {
  light: { bg: '#f8f5ff', card: '#fff', border: '#e9e3ff', text: '#1e1b4b', muted: '#6b7280', input: '#f8f5ff' },
  dark: { bg: '#0f0d1a', card: '#1a1730', border: '#2d2a4a', text: '#e2e0ff', muted: '#9ca3af', input: '#0f0d1a' },
  black: { bg: '#000', card: '#111', border: '#222', text: '#fff', muted: '#888', input: '#000' },
}

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#6b7280']

export default function NotasTab({ theme }: Props) {
  const s = THEME_STYLES[theme]
  const [notas, setNotas] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editNota, setEditNota] = useState<Nota | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [color, setColor] = useState('#8b5cf6')

  const load = useCallback(async () => {
    try { setLoading(true); const data = await api.notas.list(); setNotas(data) }
    catch { toast.error('Error al cargar notas') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditNota(null); setTitulo(''); setContenido(''); setColor('#8b5cf6'); setDialogOpen(true) }
  const openEdit = (n: Nota) => { setEditNota(n); setTitulo(n.titulo); setContenido(n.contenido); setColor(n.color); setDialogOpen(true) }

  const handleSave = async () => {
    if (!contenido.trim()) { toast.error('El contenido es requerido'); return }
    setSaving(true)
    try {
      if (editNota) {
        await api.notas.update(editNota.id, { titulo, contenido, color })
        toast.success('Nota actualizada ✓')
      } else {
        await api.notas.create({ titulo, contenido, color })
        toast.success('Nota creada ✓')
      }
      setDialogOpen(false); await load()
    } catch (e: any) { toast.error(e.message || 'Error al guardar') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try { await api.notas.delete(id); toast.success('Nota eliminada ✓'); setDeleteConfirm(null); await load() }
    catch (e: any) { toast.error(e.message || 'Error') }
  }

  const inputStyle = { background: s.input, border: `1px solid ${s.border}`, color: s.text, borderRadius: '10px', padding: '8px 12px', fontSize: '13px', outline: 'none', width: '100%' }
  const textareaStyle = { ...inputStyle, minHeight: '100px', resize: 'vertical' as const }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `hace ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    return `hace ${Math.floor(hrs / 24)}d`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: s.muted }}>📝 Notas rápidas</h2>
        <Button onClick={openCreate} className="text-white font-semibold rounded-xl h-9 text-sm" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
          <Plus className="w-4 h-4 mr-1" /> Nueva nota
        </Button>
      </div>

      {loading ? (
        <div style={{ color: s.muted, textAlign: 'center', padding: '40px' }}>Cargando...</div>
      ) : notas.length === 0 ? (
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: '16px', padding: '48px', textAlign: 'center', color: s.muted }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>📝</div>
          <p>No hay notas. ¡Creá una!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {notas.map(n => (
            <div key={n.id} style={{ background: s.card, border: `2px solid ${n.color}22`, borderRadius: '16px', padding: '16px', position: 'relative' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.color, marginBottom: '8px' }} />
              {n.titulo && <div style={{ fontWeight: '700', fontSize: '14px', color: s.text, marginBottom: '6px' }}>{n.titulo}</div>}
              <p style={{ fontSize: '13px', color: s.text, whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: '12px' }}>{n.contenido}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: s.muted }}>{timeAgo(n.updatedAt)}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => openEdit(n)} style={{ padding: '4px', borderRadius: '6px', cursor: 'pointer', background: 'transparent', border: 'none' }}>✏️</button>
                  {deleteConfirm === n.id ? (
                    <button onClick={() => handleDelete(n.id)} style={{ padding: '4px', borderRadius: '6px', cursor: 'pointer', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: '700', fontSize: '12px' }}>✓</button>
                  ) : (
                    <button onClick={() => setDeleteConfirm(n.id)} style={{ padding: '4px', borderRadius: '6px', cursor: 'pointer', background: 'transparent', border: 'none' }}>🗑️</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl" style={{ background: s.card, border: `1px solid ${s.border}`, color: s.text }}>
          <DialogHeader>
            <DialogTitle>{editNota ? '✏️ Editar nota' : '📝 Nueva nota'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label style={{ fontSize: '12px', color: s.muted }}>Título (opcional)</label>
              <input style={inputStyle} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título de la nota..." />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: s.muted }}>Contenido *</label>
              <textarea style={textareaStyle} value={contenido} onChange={e => setContenido(e.target.value)} placeholder="Escribe aquí tu nota..." />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: s.muted, display: 'block', marginBottom: '8px' }}>Color</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer', outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} style={{ borderColor: s.border, color: s.text }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="text-white font-semibold" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editNota ? '✓ Guardar' : '+ Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
