'use client'

import { useState, useCallback } from 'react'
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
import { api, type Drop } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Calendar, Target, Loader2 } from 'lucide-react'

interface Props {
  drops: Drop[]
  loadDrops: () => Promise<void>
  theme: 'light' | 'dark' | 'black'
}

// ── Theme helpers ──────────────────────────────────────────
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
    statPurple: '#8b5cf6',
    statGreen: '#16a34a',
    statAmber: '#d97706',
    statusActivoBg: '#dcfce7',
    statusActivoText: '#15803d',
    statusProxBg: '#fef3c7',
    statusProxText: '#a16207',
    statusCerradoBg: '#fee2e2',
    statusCerradoText: '#b91c1c',
    emptyIcon: '#c4b5fd',
    deleteBtnBg: '#fef2f2',
    deleteBtnBorder: '#fecaca',
    deleteBtnText: '#dc2626',
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
    statPurple: '#a78bfa',
    statGreen: '#4ade80',
    statAmber: '#fbbf24',
    statusActivoBg: 'rgba(34,197,94,0.15)',
    statusActivoText: '#4ade80',
    statusProxBg: 'rgba(251,191,36,0.15)',
    statusProxText: '#fbbf24',
    statusCerradoBg: 'rgba(239,68,68,0.15)',
    statusCerradoText: '#f87171',
    emptyIcon: '#6d5f99',
    deleteBtnBg: 'rgba(239,68,68,0.1)',
    deleteBtnBorder: 'rgba(239,68,68,0.25)',
    deleteBtnText: '#f87171',
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
    statPurple: '#a78bfa',
    statGreen: '#4ade80',
    statAmber: '#fbbf24',
    statusActivoBg: 'rgba(34,197,94,0.12)',
    statusActivoText: '#4ade80',
    statusProxBg: 'rgba(251,191,36,0.12)',
    statusProxText: '#fbbf24',
    statusCerradoBg: 'rgba(239,68,68,0.12)',
    statusCerradoText: '#f87171',
    emptyIcon: '#444',
    deleteBtnBg: 'rgba(239,68,68,0.08)',
    deleteBtnBorder: 'rgba(239,68,68,0.2)',
    deleteBtnText: '#f87171',
  },
}

// ── Format helpers ─────────────────────────────────────────
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

// ── Component ──────────────────────────────────────────────
export default function DropsTab({ drops, loadDrops, theme }: Props) {
  const t = themes[theme]

  // Form state (create card)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('activo')
  const [creating, setCreating] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editDrop, setEditDrop] = useState<Drop | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editStatus, setEditStatus] = useState('activo')
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteDrop, setDeleteDrop] = useState<Drop | null>(null)
  const [deleting, setDeleting] = useState(false)

  const clearForm = useCallback(() => {
    setName('')
    setDesc('')
    setDate('')
    setStatus('activo')
  }, [])

  // ── Create ─────────────────────────────────────────────
  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    setCreating(true)
    try {
      await api.drops.create({ name, desc, date, status })
      toast.success('Drop creado correctamente')
      clearForm()
      await loadDrops()
    } catch (err: any) {
      toast.error(err.message || 'Error al crear drop')
    } finally {
      setCreating(false)
    }
  }

  // ── Edit ───────────────────────────────────────────────
  const openEdit = (drop: Drop) => {
    setEditDrop(drop)
    setEditName(drop.name)
    setEditDesc(drop.desc)
    setEditDate(drop.date)
    setEditStatus(drop.status)
    setEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editName.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    setSaving(true)
    try {
      await api.drops.update(editDrop!.id, {
        name: editName,
        desc: editDesc,
        date: editDate,
        status: editStatus,
      })
      toast.success('Drop actualizado')
      setEditOpen(false)
      await loadDrops()
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────
  const openDelete = (drop: Drop) => {
    setDeleteDrop(drop)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.drops.delete(deleteDrop!.id)
      toast.success('Drop eliminado')
      setDeleteOpen(false)
      await loadDrops()
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  // ── Status badge ───────────────────────────────────────
  const statusBadge = (s: string) => {
    switch (s) {
      case 'activo':
        return (
          <Badge
            className="border-0 font-semibold text-xs px-2.5 py-0.5"
            style={{ background: t.statusActivoBg, color: t.statusActivoText }}
          >
            Activo
          </Badge>
        )
      case 'proximamente':
        return (
          <Badge
            className="border-0 font-semibold text-xs px-2.5 py-0.5"
            style={{ background: t.statusProxBg, color: t.statusProxText }}
          >
            Próximamente
          </Badge>
        )
      case 'cerrado':
        return (
          <Badge
            className="border-0 font-semibold text-xs px-2.5 py-0.5"
            style={{ background: t.statusCerradoBg, color: t.statusCerradoText }}
          >
            Cerrado
          </Badge>
        )
      default:
        return <Badge variant="outline">{s}</Badge>
    }
  }

  // ── Loading skeleton ───────────────────────────────────
  if (!drops) {
    return (
      <div className="space-y-4" style={{ background: t.bg }}>
        <Skeleton className="h-52 w-full rounded-2xl" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const inputStyle = {
    background: t.inputBg,
    borderColor: t.inputBorder,
    color: t.text,
  }

  return (
    <div className="space-y-6">
      {/* ─── Create Drop Form Card ──────────────────────── */}
      <Card
        className="rounded-2xl border transition-shadow"
        style={{ background: t.card, borderColor: t.border }}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
            >
              <Plus className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-bold" style={{ color: t.text }}>
              Nuevo Drop
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium" style={{ color: t.textSec }}>
                Nombre
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Drop Verano 2025"
                className="rounded-xl h-10"
                style={inputStyle}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium" style={{ color: t.textSec }}>
                Descripción
              </Label>
              <Input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Colección de verano"
                className="rounded-xl h-10"
                style={inputStyle}
              />
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium" style={{ color: t.textSec }}>
                Fecha lanzamiento
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl h-10"
                style={inputStyle}
              />
            </div>

            {/* Estado */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium" style={{ color: t.textSec }}>
                Estado
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl h-10" style={inputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="proximamente">Próximamente</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="rounded-xl px-6 h-10 text-white font-semibold border-0 shadow-md hover:shadow-lg transition-shadow"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Agregar drop
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Drops List ─────────────────────────────────── */}
      {drops.length === 0 ? (
        <Card
          className="rounded-2xl border"
          style={{ background: t.card, borderColor: t.border }}
        >
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <p className="text-base font-semibold" style={{ color: t.text }}>
              No hay drops creados aún
            </p>
            <p className="text-sm mt-1" style={{ color: t.textMuted }}>
              Crea tu primera colección.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drops.map((drop) => (
            <Card
              key={drop.id}
              className="rounded-2xl border transition-all duration-200 hover:shadow-lg"
              style={{ background: t.card, borderColor: t.border }}
            >
              <CardContent className="p-5">
                {/* Header: name + status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 shrink-0" style={{ color: t.statPurple }} />
                      <h4 className="font-bold text-sm truncate" style={{ color: t.text }}>
                        {drop.name}
                      </h4>
                    </div>
                    {drop.desc && (
                      <p className="text-xs mt-1 truncate pl-6" style={{ color: t.textMuted }}>
                        {drop.desc}
                      </p>
                    )}
                  </div>
                  {statusBadge(drop.status)}
                </div>

                {/* Date */}
                {drop.date && (
                  <div className="flex items-center gap-1.5 mb-4 pl-0.5">
                    <Calendar className="w-3.5 h-3.5" style={{ color: t.textMuted }} />
                    <span className="text-xs" style={{ color: t.textSec }}>
                      {fd(drop.date)}
                    </span>
                  </div>
                )}

                {!drop.date && <div className="mb-4" />}

                {/* Stats */}
                <div
                  className="grid grid-cols-3 gap-2 rounded-xl p-3 mb-4"
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}
                >
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-semibold tracking-wide" style={{ color: t.statAmber }}>
                      Ventas S/
                    </p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: t.statAmber }}>
                      {fmt(drop.totalVentas || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-semibold tracking-wide" style={{ color: t.statGreen }}>
                      Ventas
                    </p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: t.statGreen }}>
                      {drop.ventasCount || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-semibold tracking-wide" style={{ color: t.statPurple }}>
                      Variantes
                    </p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: t.statPurple }}>
                      {drop.productosCount || 0}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl text-xs h-8 border"
                    style={{
                      borderColor: t.border,
                      color: t.textSec,
                      background: 'transparent',
                    }}
                    onClick={() => openEdit(drop)}
                  >
                    <Edit2 className="w-3 h-3 mr-1.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs h-8 border"
                    style={{
                      borderColor: t.deleteBtnBorder,
                      color: t.deleteBtnText,
                      background: t.deleteBtnBg,
                    }}
                    onClick={() => openDelete(drop)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Edit Drop Dialog ───────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          className="rounded-2xl border"
          style={{ background: t.card, borderColor: t.border, color: t.text }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: t.text }}>Editar Drop</DialogTitle>
            <DialogDescription style={{ color: t.textMuted }}>
              Modifica los datos del drop.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label style={{ color: t.textSec }}>Nombre</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-xl"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: t.textSec }}>Descripción</Label>
              <Input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="rounded-xl"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: t.textSec }}>Fecha lanzamiento</Label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="rounded-xl"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: t.textSec }}>Estado</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="rounded-xl" style={inputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="proximamente">Próximamente</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="rounded-xl"
              style={{ borderColor: t.border, color: t.textSec }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={saving}
              className="rounded-xl text-white font-semibold border-0"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          className="rounded-2xl border"
          style={{ background: t.card, borderColor: t.border, color: t.text }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: t.text }}>Eliminar Drop</DialogTitle>
            <DialogDescription style={{ color: t.textMuted }}>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {deleteDrop && (
            <div
              className="rounded-xl p-4 space-y-3 my-2"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: t.statPurple }} />
                <span className="font-bold text-sm" style={{ color: t.text }}>
                  {deleteDrop.name}
                </span>
                {statusBadge(deleteDrop.status)}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] uppercase font-semibold" style={{ color: t.statAmber }}>
                    Ventas S/
                  </p>
                  <p className="text-sm font-bold" style={{ color: t.statAmber }}>
                    {fmt(deleteDrop.totalVentas || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold" style={{ color: t.statGreen }}>
                    Ventas
                  </p>
                  <p className="text-sm font-bold" style={{ color: t.statGreen }}>
                    {deleteDrop.ventasCount || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold" style={{ color: t.statPurple }}>
                    Variantes
                  </p>
                  <p className="text-sm font-bold" style={{ color: t.statPurple }}>
                    {deleteDrop.productosCount || 0}
                  </p>
                </div>
              </div>

              <p className="text-xs text-center" style={{ color: t.textMuted }}>
                Se eliminarán todos los datos asociados a este drop.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
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
              className="rounded-xl text-white font-semibold border-0 bg-red-500 hover:bg-red-600"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
