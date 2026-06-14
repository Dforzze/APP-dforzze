'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { api, type Proveedor, type Compra, type Drop } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Loader2, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react'

interface Props { drops: Drop[]; loadDrops: () => Promise<void>; theme: 'light' | 'dark' | 'black' }

const THEME_STYLES = {
  light: { bg: '#f8f5ff', card: '#fff', border: '#e9e3ff', text: '#1e1b4b', muted: '#6b7280', input: '#f8f5ff', hover: '#f3eeff' },
  dark: { bg: '#0f0d1a', card: '#1a1730', border: '#2d2a4a', text: '#e2e0ff', muted: '#9ca3af', input: '#0f0d1a', hover: '#231f3d' },
  black: { bg: '#000', card: '#111', border: '#222', text: '#fff', muted: '#888', input: '#000', hover: '#1a1a1a' },
}

const CATEGORIAS = ['Tela', 'Confección', 'Bordado', 'Diseño', 'Transporte', 'Empaque', 'Otros']
const ESTADOS = ['pagado', 'pendiente', 'parcial']
const fmt = (n: number) => 'S/ ' + n.toFixed(2)

export default function ProveedoresTab({ theme }: Props) {
  const s = THEME_STYLES[theme]
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editProv, setEditProv] = useState<Proveedor | null>(null)
  const [compraOpen, setCompraOpen] = useState(false)
  const [compraProvId, setCompraProvId] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Proveedor form
  const [pName, setPName] = useState('')
  const [pContacto, setPContacto] = useState('')
  const [pTel, setPTel] = useState('')
  const [pCat, setPCat] = useState('Otros')
  const [pNotas, setPNotas] = useState('')

  // Compra form
  const [cDesc, setCDesc] = useState('')
  const [cMonto, setCMonto] = useState('')
  const [cFecha, setCFecha] = useState(new Date().toISOString().slice(0, 10))
  const [cEstado, setCEstado] = useState('pagado')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.proveedores.list()
      setProveedores(data)
    } catch { toast.error('Error al cargar proveedores') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditProv(null); setPName(''); setPContacto(''); setPTel(''); setPCat('Otros'); setPNotas(''); setDialogOpen(true) }
  const openEdit = (p: Proveedor) => { setEditProv(p); setPName(p.name); setPContacto(p.contacto); setPTel(p.telefono); setPCat(p.categoria); setPNotas(p.notas); setDialogOpen(true) }

  const handleSaveProv = async () => {
    if (!pName.trim()) { toast.error('El nombre es requerido'); return }
    setSaving(true)
    try {
      if (editProv) {
        await api.proveedores.update(editProv.id, { name: pName, contacto: pContacto, telefono: pTel, categoria: pCat, notas: pNotas })
        toast.success('Proveedor actualizado ✓')
      } else {
        await api.proveedores.create({ name: pName, contacto: pContacto, telefono: pTel, categoria: pCat, notas: pNotas })
        toast.success('Proveedor agregado ✓')
      }
      setDialogOpen(false); await load()
    } catch (e: any) { toast.error(e.message || 'Error al guardar') }
    finally { setSaving(false) }
  }

  const openCompra = (provId: string) => { setCompraProvId(provId); setCDesc(''); setCMonto(''); setCFecha(new Date().toISOString().slice(0, 10)); setCEstado('pagado'); setCompraOpen(true) }

  const handleSaveCompra = async () => {
    if (!cDesc.trim() || !cMonto || !cFecha) { toast.error('Completá todos los campos'); return }
    setSaving(true)
    try {
      await api.compras.create({ proveedorId: compraProvId, desc: cDesc, monto: parseFloat(cMonto), fecha: cFecha, estado: cEstado })
      toast.success('Compra registrada ✓')
      setCompraOpen(false); await load()
    } catch (e: any) { toast.error(e.message || 'Error al guardar') }
    finally { setSaving(false) }
  }

  const handleDeleteProv = async (id: string) => {
    try {
      await api.proveedores.delete(id)
      toast.success('Proveedor eliminado ✓')
      setDeleteConfirm(null); await load()
    } catch (e: any) { toast.error(e.message || 'Error al eliminar') }
  }

  const inputStyle = { background: s.input, border: `1px solid ${s.border}`, color: s.text, borderRadius: '10px', padding: '8px 12px', fontSize: '13px', outline: 'none', width: '100%' }
  const selectStyle = { ...inputStyle }

  const totalCompras = (p: Proveedor) => (p.compras || []).reduce((sum, c) => sum + c.monto, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: s.muted }}>🏭 Proveedores</h2>
        <Button onClick={openCreate} className="text-white font-semibold rounded-xl h-9 text-sm" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo proveedor
        </Button>
      </div>

      {loading ? (
        <div style={{ color: s.muted, textAlign: 'center', padding: '40px' }}>Cargando...</div>
      ) : proveedores.length === 0 ? (
        <Card className="rounded-2xl" style={{ background: s.card, border: `1px solid ${s.border}` }}>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-2">🏭</div>
            <p style={{ color: s.muted }}>No hay proveedores registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proveedores.map(p => (
            <Card key={p.id} className="rounded-2xl" style={{ background: s.card, border: `1px solid ${s.border}` }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: s.text }}>{p.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>{p.categoria}</span>
                    </div>
                    {p.contacto && <div className="text-xs mt-1" style={{ color: s.muted }}>👤 {p.contacto}</div>}
                    {p.telefono && <div className="text-xs" style={{ color: s.muted }}>📞 {p.telefono}</div>}
                    <div className="text-xs mt-1 font-semibold" style={{ color: '#10b981' }}>Total compras: {fmt(totalCompras(p))}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openCompra(p.id)} className="px-2 py-1 rounded-lg text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>+ Compra</button>
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg" style={{ color: s.muted }}>✏️</button>
                    {deleteConfirm === p.id ? (
                      <button onClick={() => handleDeleteProv(p.id)} className="p-1.5 rounded-lg text-red-500 text-xs font-bold">✓</button>
                    ) : (
                      <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded-lg" style={{ color: s.muted }}>🗑️</button>
                    )}
                    <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="p-1.5 rounded-lg" style={{ color: s.muted }}>
                      {expanded === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expanded === p.id && (p.compras || []).length > 0 && (
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${s.border}` }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: s.muted }}>HISTORIAL DE COMPRAS</p>
                    <div className="space-y-1">
                      {(p.compras || []).map(c => (
                        <div key={c.id} className="flex items-center justify-between text-xs" style={{ color: s.text }}>
                          <span>{c.fecha} · {c.desc}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold" style={{ color: '#10b981' }}>{fmt(c.monto)}</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{
                              background: c.estado === 'pagado' ? 'rgba(16,185,129,0.1)' : c.estado === 'pendiente' ? 'rgba(245,158,11,0.1)' : 'rgba(139,92,246,0.1)',
                              color: c.estado === 'pagado' ? '#10b981' : c.estado === 'pendiente' ? '#f59e0b' : '#a78bfa'
                            }}>{c.estado}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Proveedor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl" style={{ background: s.card, border: `1px solid ${s.border}`, color: s.text }}>
          <DialogHeader>
            <DialogTitle>{editProv ? '✏️ Editar Proveedor' : '🏭 Nuevo Proveedor'}</DialogTitle>
            <DialogDescription style={{ color: s.muted }}>Registrá los datos del proveedor</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label style={{ color: s.muted }}>Nombre *</Label><input style={inputStyle} value={pName} onChange={e => setPName(e.target.value)} placeholder="Nombre del proveedor" /></div>
            <div><Label style={{ color: s.muted }}>Contacto</Label><input style={inputStyle} value={pContacto} onChange={e => setPContacto(e.target.value)} placeholder="Nombre de la persona" /></div>
            <div><Label style={{ color: s.muted }}>Teléfono / WhatsApp</Label><input style={inputStyle} value={pTel} onChange={e => setPTel(e.target.value)} placeholder="Número de contacto" /></div>
            <div><Label style={{ color: s.muted }}>Categoría</Label><select style={selectStyle} value={pCat} onChange={e => setPCat(e.target.value)}>{CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><Label style={{ color: s.muted }}>Notas</Label><input style={inputStyle} value={pNotas} onChange={e => setPNotas(e.target.value)} placeholder="Observaciones..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} style={{ borderColor: s.border, color: s.text }}>Cancelar</Button>
            <Button onClick={handleSaveProv} disabled={saving} className="text-white font-semibold" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editProv ? '✓ Guardar' : '+ Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compra Dialog */}
      <Dialog open={compraOpen} onOpenChange={setCompraOpen}>
        <DialogContent className="rounded-2xl" style={{ background: s.card, border: `1px solid ${s.border}`, color: s.text }}>
          <DialogHeader>
            <DialogTitle>🧾 Registrar Compra</DialogTitle>
            <DialogDescription style={{ color: s.muted }}>Registrá una compra a este proveedor</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label style={{ color: s.muted }}>Descripción *</Label><input style={inputStyle} value={cDesc} onChange={e => setCDesc(e.target.value)} placeholder="Ej: 20 metros de tela" /></div>
            <div><Label style={{ color: s.muted }}>Monto (S/) *</Label><input type="number" style={inputStyle} value={cMonto} onChange={e => setCMonto(e.target.value)} placeholder="0.00" /></div>
            <div><Label style={{ color: s.muted }}>Fecha *</Label><input type="date" style={inputStyle} value={cFecha} onChange={e => setCFecha(e.target.value)} /></div>
            <div><Label style={{ color: s.muted }}>Estado</Label><select style={selectStyle} value={cEstado} onChange={e => setCEstado(e.target.value)}>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompraOpen(false)} style={{ borderColor: s.border, color: s.text }}>Cancelar</Button>
            <Button onClick={handleSaveCompra} disabled={saving} className="text-white font-semibold" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : '+ Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
