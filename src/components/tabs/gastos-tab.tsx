'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api, type Gasto, type Drop } from '@/lib/api'
import { toast } from 'sonner'
import {
  TrendingDown,
  TrendingUp,
  ArrowDownCircle,
  Plus,
  Search,
  Edit2,
  Trash2,
  DollarSign,
  Briefcase,
  Wallet,
  Loader2,
  X,
} from 'lucide-react'

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  drops: Drop[]
  loadDrops: () => Promise<void>
  theme: 'light' | 'dark' | 'black'
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TIPOS = [
  { value: 'gasto', label: '💸 Gasto operativo' },
  { value: 'inversion', label: '💼 Inversión' },
  { value: 'retiro', label: '💵 Retiro de caja' },
]

const CATEGORIAS = [
  'Mercadería',
  'Logística',
  'Marketing',
  'Alquiler',
  'Servicios',
  'Impuestos',
  'Personal',
  'Otros',
]

// ─── Theme system ───────────────────────────────────────────────────────────

const themes = {
  light: {
    bg: '#f8f5ff',
    card: '#ffffff',
    cardHover: '#faf8ff',
    border: '#e9e3ff',
    text: '#1a1230',
    textSec: '#6b6080',
    textMuted: '#9b8fb0',
    inputBg: '#f3efff',
    inputBorder: '#ddd6f3',
    gastoIcon: '#ef4444',
    gastoBg: '#fef2f2',
    gastoBorder: '#fecaca',
    gastoText: '#dc2626',
    inversionIcon: '#3b82f6',
    inversionBg: '#eff6ff',
    inversionBorder: '#bfdbfe',
    inversionText: '#2563eb',
    retiroIcon: '#f59e0b',
    retiroBg: '#fffbeb',
    retiroBorder: '#fde68a',
    retiroText: '#d97706',
    emptyIcon: '#c4b5fd',
    deleteBtnBg: '#fef2f2',
    deleteBtnBorder: '#fecaca',
    deleteBtnText: '#dc2626',
    summaryGastoBg: '#fef2f2',
    summaryGastoBorder: '#fecaca',
    summaryInversionBg: '#eff6ff',
    summaryInversionBorder: '#bfdbfe',
    summaryRetiroBg: '#fffbeb',
    summaryRetiroBorder: '#fde68a',
    tagBg: '#f3efff',
    tagText: '#7c3aed',
    dropTagBg: '#ede9fe',
    dropTagText: '#6d28d9',
  },
  dark: {
    bg: '#0f0d1a',
    card: '#1a1730',
    cardHover: '#221f3a',
    border: '#2d2a4a',
    text: '#eee8ff',
    textSec: '#a99fc0',
    textMuted: '#706888',
    inputBg: '#14112a',
    inputBorder: '#2d2a4a',
    gastoIcon: '#f87171',
    gastoBg: 'rgba(239,68,68,0.12)',
    gastoBorder: 'rgba(239,68,68,0.25)',
    gastoText: '#f87171',
    inversionIcon: '#60a5fa',
    inversionBg: 'rgba(59,130,246,0.12)',
    inversionBorder: 'rgba(59,130,246,0.25)',
    inversionText: '#60a5fa',
    retiroIcon: '#fbbf24',
    retiroBg: 'rgba(245,158,11,0.12)',
    retiroBorder: 'rgba(245,158,11,0.25)',
    retiroText: '#fbbf24',
    emptyIcon: '#6d5f99',
    deleteBtnBg: 'rgba(239,68,68,0.1)',
    deleteBtnBorder: 'rgba(239,68,68,0.25)',
    deleteBtnText: '#f87171',
    summaryGastoBg: 'rgba(239,68,68,0.1)',
    summaryGastoBorder: 'rgba(239,68,68,0.2)',
    summaryInversionBg: 'rgba(59,130,246,0.1)',
    summaryInversionBorder: 'rgba(59,130,246,0.2)',
    summaryRetiroBg: 'rgba(245,158,11,0.1)',
    summaryRetiroBorder: 'rgba(245,158,11,0.2)',
    tagBg: 'rgba(139,92,246,0.12)',
    tagText: '#c4b5fd',
    dropTagBg: 'rgba(109,40,217,0.15)',
    dropTagText: '#a78bfa',
  },
  black: {
    bg: '#000',
    card: '#111',
    cardHover: '#1a1a1a',
    border: '#222',
    text: '#f0eef5',
    textSec: '#8a8698',
    textMuted: '#555',
    inputBg: '#0a0a0a',
    inputBorder: '#222',
    gastoIcon: '#f87171',
    gastoBg: 'rgba(239,68,68,0.08)',
    gastoBorder: 'rgba(239,68,68,0.18)',
    gastoText: '#f87171',
    inversionIcon: '#60a5fa',
    inversionBg: 'rgba(59,130,246,0.08)',
    inversionBorder: 'rgba(59,130,246,0.18)',
    inversionText: '#60a5fa',
    retiroIcon: '#fbbf24',
    retiroBg: 'rgba(245,158,11,0.08)',
    retiroBorder: 'rgba(245,158,11,0.18)',
    retiroText: '#fbbf24',
    emptyIcon: '#444',
    deleteBtnBg: 'rgba(239,68,68,0.08)',
    deleteBtnBorder: 'rgba(239,68,68,0.2)',
    deleteBtnText: '#f87171',
    summaryGastoBg: 'rgba(239,68,68,0.06)',
    summaryGastoBorder: 'rgba(239,68,68,0.15)',
    summaryInversionBg: 'rgba(59,130,246,0.06)',
    summaryInversionBorder: 'rgba(59,130,246,0.15)',
    summaryRetiroBg: 'rgba(245,158,11,0.06)',
    summaryRetiroBorder: 'rgba(245,158,11,0.15)',
    tagBg: 'rgba(139,92,246,0.08)',
    tagText: '#a78bfa',
    dropTagBg: 'rgba(109,40,217,0.1)',
    dropTagText: '#8b5cf6',
  },
}

// ─── Tipo visual config ─────────────────────────────────────────────────────

function getTipoStyle(tipo: string, t: (typeof themes)['light']) {
  switch (tipo) {
    case 'gasto':
      return { icon: TrendingDown, emoji: '💸', color: t.gastoText, bg: t.gastoBg, border: t.gastoBorder, iconColor: t.gastoIcon }
    case 'inversion':
      return { icon: TrendingUp, emoji: '💼', color: t.inversionText, bg: t.inversionBg, border: t.inversionBorder, iconColor: t.inversionIcon }
    case 'retiro':
      return { icon: ArrowDownCircle, emoji: '💵', color: t.retiroText, bg: t.retiroBg, border: t.retiroBorder, iconColor: t.retiroIcon }
    default:
      return { icon: DollarSign, emoji: '💸', color: t.gastoText, bg: t.gastoBg, border: t.gastoBorder, iconColor: t.gastoIcon }
  }
}

// ─── Format helpers ─────────────────────────────────────────────────────────

const fmt = (n: number) =>
  'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fd = (dateStr: string) =>
  dateStr
    ? new Date(dateStr + 'T12:00:00').toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : ''

// ─── Component ──────────────────────────────────────────────────────────────

export default function GastosTab({ drops, loadDrops, theme }: Props) {
  const t = themes[theme]

  // ── State ─────────────────────────────────────────────────────────────
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('all')
  const [filterCategoria, setFilterCategoria] = useState('all')
  const [filterDrop, setFilterDrop] = useState('all')

  // Form (create / edit)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null)
  const [saving, setSaving] = useState(false)
  const [tipo, setTipo] = useState('gasto')
  const [desc, setDesc] = useState('')
  const [categoria, setCategoria] = useState('Otros')
  const [dropId, setDropId] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteGasto, setDeleteGasto] = useState<Gasto | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Load gastos ──────────────────────────────────────────────────────
  const loadGastos = useCallback(async () => {
    try {
      setLoading(true)
      const filters: Record<string, string> = {}
      if (filterTipo && filterTipo !== 'all') filters.tipo = filterTipo
      if (filterCategoria && filterCategoria !== 'all') filters.categoria = filterCategoria
      if (search) filters.search = search
      if (filterDrop && filterDrop !== 'all') filters.dropId = filterDrop
      const data = await api.gastos.list(filters)
      setGastos(data)
    } catch {
      toast.error('Error al cargar gastos')
    } finally {
      setLoading(false)
    }
  }, [filterTipo, filterCategoria, search, filterDrop])

  useEffect(() => {
    loadGastos()
  }, [loadGastos])

  // ── Form helpers ─────────────────────────────────────────────────────
  const initForm = () => {
    setTipo('gasto')
    setDesc('')
    setCategoria('Otros')
    setDropId('')
    setMonto('')
    setFecha(new Date().toISOString().split('T')[0])
  }

  const openCreate = () => {
    setEditingGasto(null)
    initForm()
    setDialogOpen(true)
  }

  const openEdit = (g: Gasto) => {
    setEditingGasto(g)
    setTipo(g.tipo)
    setDesc(g.desc)
    setCategoria(g.categoria || 'Otros')
    setDropId(g.dropId || '')
    setMonto(String(g.monto))
    setFecha(g.fecha)
    setDialogOpen(true)
  }

  // ── Save ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!desc.trim()) {
      toast.error('La descripción es requerida')
      return
    }
    if (!monto || parseFloat(monto) <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, any> = {
        tipo,
        desc: desc.trim(),
        monto: parseFloat(monto),
        fecha,
      }
      // Only send categoria if tipo is not retiro
      if (tipo !== 'retiro') {
        payload.categoria = categoria
      }
      // Only send dropId if tipo is inversion
      if (tipo === 'inversion') {
        payload.dropId = dropId || null
      }

      if (editingGasto) {
        await api.gastos.update(editingGasto.id, payload)
        toast.success('Gasto actualizado')
      } else {
        await api.gastos.create(payload)
        toast.success('Gasto registrado')
      }
      setDialogOpen(false)
      await loadGastos()
      await loadDrops()
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────
  const openDelete = (g: Gasto) => {
    setDeleteGasto(g)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteGasto) return
    setDeleting(true)
    try {
      await api.gastos.delete(deleteGasto.id)
      toast.success('Gasto eliminado')
      setDeleteOpen(false)
      setDeleteGasto(null)
      await loadGastos()
      await loadDrops()
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────
  const totalGastos = gastos.filter(g => g.tipo === 'gasto').reduce((s, g) => s + g.monto, 0)
  const totalInversiones = gastos.filter(g => g.tipo === 'inversion').reduce((s, g) => s + g.monto, 0)
  const totalRetiros = gastos.filter(g => g.tipo === 'retiro').reduce((s, g) => s + g.monto, 0)

  // ─── Gradient accent ─────────────────────────────────────────────────
  const gradientBtn: React.CSSProperties = {
    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    color: '#fff',
    border: 'none',
  }

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold" style={{ color: t.text }}>
          Gastos
        </h2>
        <Button onClick={openCreate} className="rounded-xl" style={gradientBtn}>
          <Plus className="w-4 h-4 mr-1.5" /> Registrar Gasto
        </Button>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Gastos */}
        <Card
          className="rounded-2xl border-0 shadow-sm transition-shadow hover:shadow-md"
          style={{ background: t.summaryGastoBg, borderColor: t.summaryGastoBorder }}
        >
          <CardContent className="p-4 text-center">
            <div
              className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
              style={{ background: t.gastoBg, border: `1px solid ${t.gastoBorder}` }}
            >
              <TrendingDown className="w-5 h-5" style={{ color: t.gastoIcon }} />
            </div>
            <p className="text-xs font-medium" style={{ color: t.textMuted }}>
              💸 Total Gastos
            </p>
            <p className="text-lg font-bold mt-0.5" style={{ color: t.gastoText }}>
              {fmt(totalGastos)}
            </p>
          </CardContent>
        </Card>

        {/* Total Inversiones */}
        <Card
          className="rounded-2xl border-0 shadow-sm transition-shadow hover:shadow-md"
          style={{ background: t.summaryInversionBg, borderColor: t.summaryInversionBorder }}
        >
          <CardContent className="p-4 text-center">
            <div
              className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
              style={{ background: t.inversionBg, border: `1px solid ${t.inversionBorder}` }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: t.inversionIcon }} />
            </div>
            <p className="text-xs font-medium" style={{ color: t.textMuted }}>
              💼 Total Inversiones
            </p>
            <p className="text-lg font-bold mt-0.5" style={{ color: t.inversionText }}>
              {fmt(totalInversiones)}
            </p>
          </CardContent>
        </Card>

        {/* Total Retiros */}
        <Card
          className="rounded-2xl border-0 shadow-sm transition-shadow hover:shadow-md"
          style={{ background: t.summaryRetiroBg, borderColor: t.summaryRetiroBorder }}
        >
          <CardContent className="p-4 text-center">
            <div
              className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
              style={{ background: t.retiroBg, border: `1px solid ${t.retiroBorder}` }}
            >
              <ArrowDownCircle className="w-5 h-5" style={{ color: t.retiroIcon }} />
            </div>
            <p className="text-xs font-medium" style={{ color: t.textMuted }}>
              💵 Total Retiros
            </p>
            <p className="text-lg font-bold mt-0.5" style={{ color: t.retiroText }}>
              {fmt(totalRetiros)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Register Gasto Form ─────────────────────────────────────────── */}
      <Card className="rounded-2xl border-0 shadow-sm" style={{ background: t.card, border: `1px solid ${t.border}` }}>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: t.text }}>
            <DollarSign className="w-4 h-4" style={{ color: '#8b5cf6' }} />
            Registrar Gasto
          </h3>

          <div className="space-y-3">
            {/* Tipo selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={{ color: t.textSec }}>
                Tipo
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {TIPOS.map((tp) => {
                  const ts = getTipoStyle(tp.value, t)
                  const active = tipo === tp.value
                  return (
                    <button
                      key={tp.value}
                      onClick={() => setTipo(tp.value)}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: active ? ts.bg : t.inputBg,
                        border: active ? `1.5px solid ${ts.iconColor}` : `1px solid ${t.inputBorder}`,
                        color: active ? ts.color : t.textSec,
                      }}
                    >
                      <span>{tp.emoji}</span>
                      <span className="hidden sm:inline">
                        {tp.value === 'gasto' ? 'Gasto' : tp.value === 'inversion' ? 'Inversión' : 'Retiro'}
                      </span>
                      <span className="sm:hidden">
                        {tp.value === 'gasto' ? 'Gasto' : tp.value === 'inversion' ? 'Inv.' : 'Retiro'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={{ color: t.textSec }}>
                Descripción *
              </Label>
              <Input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Descripción del gasto"
                className="rounded-xl"
                style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
              />
            </div>

            {/* Monto + Fecha */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: t.textSec }}>
                  Monto *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="rounded-xl"
                  style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: t.textSec }}>
                  Fecha
                </Label>
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="rounded-xl"
                  style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
                />
              </div>
            </div>

            {/* Categoría — hidden when tipo is retiro */}
            {tipo !== 'retiro' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: t.textSec }}>
                  Categoría
                </Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger
                    className="rounded-xl"
                    style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Drop — only when tipo is inversion */}
            {tipo === 'inversion' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: t.textSec }}>
                  Drop (opcional)
                </Label>
                <Select value={dropId || 'none'} onValueChange={(v) => setDropId(v === 'none' ? '' : v)}>
                  <SelectTrigger
                    className="rounded-xl"
                    style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
                  >
                    <SelectValue placeholder="Sin drop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin drop</SelectItem>
                    {drops.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={openCreate}
              className="w-full rounded-xl py-2.5 font-semibold text-sm"
              style={gradientBtn}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Registrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Filters Bar ─────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-0 shadow-sm" style={{ background: t.card, border: `1px solid ${t.border}` }}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: t.textMuted }} />
              <Input
                placeholder="Buscar por descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl pl-9"
                style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
              />
            </div>

            {/* Filter tipo */}
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger
                className="rounded-xl w-full sm:w-40"
                style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
              >
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="gasto">💸 Gasto</SelectItem>
                <SelectItem value="inversion">💼 Inversión</SelectItem>
                <SelectItem value="retiro">💵 Retiro</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter categoría */}
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger
                className="rounded-xl w-full sm:w-40"
                style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
              >
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter drop */}
            <Select value={filterDrop} onValueChange={setFilterDrop}>
              <SelectTrigger
                className="rounded-xl w-full sm:w-40"
                style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
              >
                <SelectValue placeholder="Drop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="none">Sin drop</SelectItem>
                {drops.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Gastos List ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" style={{ background: t.inputBg }} />
          ))}
        </div>
      ) : gastos.length === 0 ? (
        <Card
          className="rounded-2xl border-0 shadow-sm"
          style={{ background: t.card, border: `1px solid ${t.border}` }}
        >
          <CardContent className="py-16 text-center">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: t.gastoBg, border: `1px solid ${t.gastoBorder}` }}
            >
              <span className="text-3xl">💸</span>
            </div>
            <p className="font-medium" style={{ color: t.textSec }}>
              No hay gastos registrados
            </p>
            <p className="text-sm mt-1" style={{ color: t.textMuted }}>
              Registra tu primer gasto para comenzar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
          {gastos.map((g) => {
            const ts = getTipoStyle(g.tipo, t)
            const TipoIcon = ts.icon
            const assignedDrop = g.drop || drops.find((d) => d.id === g.dropId)
            return (
              <Card
                key={g.id}
                className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all"
                style={{ background: t.card, border: `1px solid ${t.border}` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    {/* Left side: icon + info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Type icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: ts.bg, border: `1px solid ${ts.border}` }}
                      >
                        <TipoIcon className="w-5 h-5" style={{ color: ts.iconColor }} />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: t.text }}>
                          {g.desc}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {/* Tipo badge */}
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold"
                            style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}
                          >
                            {ts.emoji}{' '}
                            {g.tipo === 'gasto'
                              ? 'Gasto'
                              : g.tipo === 'inversion'
                                ? 'Inversión'
                                : 'Retiro'}
                          </span>

                          {/* Categoría tag — only for non-retiro */}
                          {g.tipo !== 'retiro' && g.categoria && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium"
                              style={{ background: t.tagBg, color: t.tagText }}
                            >
                              {g.categoria}
                            </span>
                          )}

                          {/* Drop tag */}
                          {assignedDrop && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium"
                              style={{ background: t.dropTagBg, color: t.dropTagText }}
                            >
                              📦 {assignedDrop.name}
                            </span>
                          )}

                          {/* Fecha */}
                          <span className="text-[11px]" style={{ color: t.textMuted }}>
                            {fd(g.fecha)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: monto + actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-base sm:text-lg font-bold" style={{ color: ts.color }}>
                        {fmt(g.monto)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => openEdit(g)}
                      >
                        <Edit2 className="w-3.5 h-3.5" style={{ color: t.textMuted }} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => openDelete(g)}
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: t.deleteBtnText }} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Create / Edit Dialog ────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl" style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: t.text }}>
              {editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
            </DialogTitle>
            <DialogDescription style={{ color: t.textMuted }}>
              {editingGasto ? 'Modifica los datos del gasto' : 'Completa los datos para registrar un nuevo gasto'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tipo selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={{ color: t.textSec }}>
                Tipo
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {TIPOS.map((tp) => {
                  const ts = getTipoStyle(tp.value, t)
                  const active = tipo === tp.value
                  return (
                    <button
                      key={tp.value}
                      onClick={() => setTipo(tp.value)}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: active ? ts.bg : t.inputBg,
                        border: active ? `1.5px solid ${ts.iconColor}` : `1px solid ${t.inputBorder}`,
                        color: active ? ts.color : t.textSec,
                      }}
                    >
                      <span>{tp.emoji}</span>
                      <span>
                        {tp.value === 'gasto'
                          ? 'Gasto'
                          : tp.value === 'inversion'
                            ? 'Inversión'
                            : 'Retiro'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={{ color: t.textSec }}>
                Descripción *
              </Label>
              <Input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Descripción del gasto"
                className="rounded-xl"
                style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
              />
            </div>

            {/* Monto + Fecha */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: t.textSec }}>
                  Monto *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="rounded-xl"
                  style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: t.textSec }}>
                  Fecha
                </Label>
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="rounded-xl"
                  style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
                />
              </div>
            </div>

            {/* Categoría — hidden when retiro */}
            {tipo !== 'retiro' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: t.textSec }}>
                  Categoría
                </Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger
                    className="rounded-xl"
                    style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Drop — only for inversion */}
            {tipo === 'inversion' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: t.textSec }}>
                  Drop (opcional)
                </Label>
                <Select value={dropId || 'none'} onValueChange={(v) => setDropId(v === 'none' ? '' : v)}>
                  <SelectTrigger
                    className="rounded-xl"
                    style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
                  >
                    <SelectValue placeholder="Sin drop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin drop</SelectItem>
                    {drops.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl"
              style={{ borderColor: t.border, color: t.textSec }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl" style={gradientBtn}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : null}
              {editingGasto ? 'Guardar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ──────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl" style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: t.text }}>Eliminar Gasto</DialogTitle>
            <DialogDescription style={{ color: t.textMuted }}>
              ¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {deleteGasto && (
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: t.gastoBg, border: `1px solid ${t.gastoBorder}` }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: t.deleteBtnBg,
                  border: `1px solid ${t.deleteBtnBorder}`,
                }}
              >
                <Trash2 className="w-4 h-4" style={{ color: t.deleteBtnText }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: t.text }}>
                  {deleteGasto.desc}
                </p>
                <p className="text-xs" style={{ color: t.textMuted }}>
                  {fmt(deleteGasto.monto)} · {fd(deleteGasto.fecha)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="rounded-xl"
              style={{ borderColor: t.border, color: t.textSec }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl"
              style={{ background: t.deleteBtnBg, border: `1px solid ${t.deleteBtnBorder}`, color: t.deleteBtnText }}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom scrollbar + purple/pink gradient utilities */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #7c3aed, #db2777);
        }
      `}</style>
    </div>
  )
}
