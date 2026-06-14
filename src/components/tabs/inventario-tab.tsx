'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, type Producto, type Drop } from '@/lib/api'
import { toast } from 'sonner'
import {
  Plus,
  Minus,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Package,
  Edit2,
  Loader2,
  X,
  Palette,
  Layers,
  AlertTriangle,
  CheckCircle2,
  SkipForward,
  Merge,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Props {
  drops: Drop[]
  loadDrops: () => Promise<void>
  theme: 'light' | 'dark' | 'black'
}

interface ColorRow {
  id: string
  colorName: string
  minStock: number
  sizes: Record<string, number>
}

interface DuplicateVariant {
  existing: Producto
  newStock: number
  action: 'skip' | 'merge'
}

// ─── Color Swatch Map ───────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  negro: '#222',
  black: '#222',
  blanco: '#f5f5f5',
  white: '#f5f5f5',
  rojo: '#ef4444',
  red: '#ef4444',
  azul: '#3b82f6',
  blue: '#3b82f6',
  verde: '#22c55e',
  green: '#22c55e',
  amarillo: '#eab308',
  yellow: '#eab308',
  rosado: '#ec4899',
  pink: '#ec4899',
  morado: '#8b5cf6',
  purple: '#8b5cf6',
  naranja: '#f97316',
  orange: '#f97316',
  gris: '#9ca3af',
  gray: '#9ca3af',
  plomo: '#6b7280',
  marrón: '#92400e',
  marron: '#92400e',
  brown: '#92400e',
  beige: '#d4a574',
  crema: '#fef3c7',
  celeste: '#7dd3fc',
  vino: '#7f1d1d',
  mostaza: '#a16207',
  oliva: '#4d7c0f',
  turquesa: '#2dd4bf',
  coral: '#fb7185',
  lavanda: '#a78bfa',
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const

// ─── Theme Config ────────────────────────────────────────────────────────────

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
    warningBg: '#fffbeb',
    warningText: '#d97706',
    colorRowBg: '#faf7ff',
    colorRowBorder: '#ede9fe',
    bulkSectionBg: '#f5f0ff',
    bulkSectionBorder: '#ddd6fe',
    tagBg: 'rgba(139, 92, 246, 0.1)',
    tagText: '#7c3aed',
    shadow: '0 1px 3px rgba(139, 92, 246, 0.06)',
    shadowHover: '0 4px 12px rgba(139, 92, 246, 0.12)',
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
    warningBg: 'rgba(217, 119, 6, 0.12)',
    warningText: '#fbbf24',
    colorRowBg: '#1f1b35',
    colorRowBorder: '#36305a',
    bulkSectionBg: '#1a1635',
    bulkSectionBorder: '#36305a',
    tagBg: 'rgba(139, 92, 246, 0.15)',
    tagText: '#a78bfa',
    shadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
    shadowHover: '0 4px 12px rgba(139, 92, 246, 0.15)',
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
    warningBg: 'rgba(217, 119, 6, 0.1)',
    warningText: '#fbbf24',
    colorRowBg: '#141414',
    colorRowBorder: '#2a2a2a',
    bulkSectionBg: '#0d0d0d',
    bulkSectionBorder: '#2a2a2a',
    tagBg: 'rgba(139, 92, 246, 0.12)',
    tagText: '#a78bfa',
    shadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
    shadowHover: '0 4px 12px rgba(139, 92, 246, 0.1)',
  },
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

let rowIdCounter = 0
function createColorRow(): ColorRow {
  rowIdCounter++
  return {
    id: `cr-${rowIdCounter}-${Date.now()}`,
    colorName: '',
    minStock: 2,
    sizes: Object.fromEntries(SIZES.map(s => [s, 0])),
  }
}

function getColorHex(colorName: string): string {
  const normalized = colorName.toLowerCase().trim()
  return COLOR_MAP[normalized] || '#8b5cf6'
}

function getColorSwatch(colorName: string, size = 14): React.CSSProperties {
  const hex = getColorHex(colorName)
  const isLight = ['#f5f5f5', '#fef3c7'].includes(hex)
  return {
    width: size,
    height: size,
    borderRadius: '50%',
    background: hex,
    border: isLight ? '1.5px solid #d1d5db' : '1.5px solid rgba(255,255,255,0.15)',
    flexShrink: 0,
    boxShadow: `0 0 0 1px rgba(0,0,0,0.05)`,
  }
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(n)
}

function calcMargen(precio: number, costo: number): number {
  if (!costo || costo === 0) return 0
  return Math.round(((precio - costo) / costo) * 100)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InventarioTab({ drops, loadDrops, theme }: Props) {
  const s = THEME_STYLES[theme]

  // ── Product data ──
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  // ── Filters ──
  const [search, setSearch] = useState('')
  const [filterDrop, setFilterDrop] = useState('all')
  const [filterColor, setFilterColor] = useState('all')
  const [filterStock, setFilterStock] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // ── Bulk creation form ──
  const [bulkFormOpen, setBulkFormOpen] = useState(false)
  const [bulkName, setBulkName] = useState('')
  const [bulkPrecio, setBulkPrecio] = useState('')
  const [bulkPrecioMayor, setBulkPrecioMayor] = useState('')
  const [bulkCosto, setBulkCosto] = useState('')
  const [bulkDropId, setBulkDropId] = useState('')
  const [colorRows, setColorRows] = useState<ColorRow[]>([createColorRow()])
  const [savingBulk, setSavingBulk] = useState(false)

  // ── Edit dialog ──
  const [editOpen, setEditOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editTalla, setEditTalla] = useState('')
  const [editStock, setEditStock] = useState('0')
  const [editPrecio, setEditPrecio] = useState('')
  const [editPrecioMayor, setEditPrecioMayor] = useState('')
  const [editCosto, setEditCosto] = useState('')
  const [editMinStock, setEditMinStock] = useState('2')
  const [editDropId, setEditDropId] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // ── Delete ──
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // ── Batch ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const [batchDeleting, setBatchDeleting] = useState(false)

  // ── Duplicate detection ──
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [duplicates, setDuplicates] = useState<DuplicateVariant[]>([])
  const [pendingBulkData, setPendingBulkData] = useState<{
    name: string
    dropId: string | null
    precio: number
    precioMayor: number
    costo: number
    colorRows: ColorRow[]
  } | null>(null)

  // ── Load productos ──
  const loadProductos = useCallback(async () => {
    try {
      setLoading(true)
      const filters: Record<string, string> = {}
      if (search) filters.search = search
      if (filterDrop && filterDrop !== 'all') filters.dropId = filterDrop
      if (filterColor && filterColor !== 'all') filters.color = filterColor
      if (filterStock && filterStock !== 'all') filters.stock = filterStock
      const data = await api.productos.list(filters)
      setProductos(data)
    } catch {
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }, [search, filterDrop, filterColor, filterStock])

  useEffect(() => {
    loadProductos()
  }, [loadProductos])

  // ── Derived ──
  const uniqueColors = useMemo(
    () => [...new Set(productos.map(p => p.color))].filter(Boolean).sort(),
    [productos]
  )

  const allSelected = productos.length > 0 && selectedIds.size === productos.length
  const someSelected = selectedIds.size > 0 && !allSelected

  // ── Stock adjust ──
  const handleStockAdjust = async (id: string, adjust: number) => {
    try {
      await api.productos.update(id, {
        stockAdjust: `${adjust >= 0 ? '+' : ''}${adjust}`,
      })
      await loadProductos()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al ajustar stock')
    }
  }

  // ── Delete single ──
  const handleDelete = async (id: string) => {
    try {
      await api.productos.delete(id)
      toast.success('Producto eliminado')
      setDeleteConfirm(null)
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      await loadProductos()
      await loadDrops()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  // ── Batch delete ──
  const handleBatchDelete = async () => {
    setBatchDeleting(true)
    try {
      for (const id of selectedIds) {
        await api.productos.delete(id)
      }
      toast.success(`${selectedIds.size} productos eliminados`)
      setSelectedIds(new Set())
      setBatchDeleteOpen(false)
      await loadProductos()
      await loadDrops()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setBatchDeleting(false)
    }
  }

  // ── Toggle select ──
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(productos.map(p => p.id)))
    }
  }

  // ── Bulk form helpers ──
  const addColorRow = () => {
    setColorRows(prev => [...prev, createColorRow()])
  }

  const removeColorRow = (id: string) => {
    setColorRows(prev => prev.filter(r => r.id !== id))
  }

  const updateColorRow = (id: string, field: keyof ColorRow, value: string | number) => {
    setColorRows(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const updateSizeInput = (rowId: string, size: string, value: number) => {
    setColorRows(prev =>
      prev.map(r =>
        r.id === rowId ? { ...r, sizes: { ...r.sizes, [size]: value } } : r
      )
    )
  }

  const clearBulkForm = () => {
    setBulkName('')
    setBulkPrecio('')
    setBulkPrecioMayor('')
    setBulkCosto('')
    setBulkDropId('')
    setColorRows([createColorRow()])
  }

  // ── Bulk submit ──
  const handleBulkSubmit = async () => {
    if (!bulkName.trim()) {
      toast.error('El nombre del producto es requerido')
      return
    }

    const validRows = colorRows.filter(r => r.colorName.trim())
    if (validRows.length === 0) {
      toast.error('Agrega al menos un color')
      return
    }

    const hasAnySize = validRows.some(r =>
      SIZES.some(s => (r.sizes[s] || 0) > 0)
    )
    if (!hasAnySize) {
      toast.error('Agrega stock en al menos una talla')
      return
    }

    const precio = parseFloat(bulkPrecio) || 0
    const precioMayor = parseFloat(bulkPrecioMayor) || 0
    const costo = parseFloat(bulkCosto) || 0

    // Build all variants to create
    const variants: { name: string; color: string; talla: string; stock: number; minStock: number }[] = []
    for (const row of validRows) {
      for (const size of SIZES) {
        const qty = row.sizes[size] || 0
        if (qty > 0) {
          variants.push({
            name: bulkName.trim(),
            color: row.colorName.trim(),
            talla: size,
            stock: qty,
            minStock: row.minStock,
          })
        }
      }
    }

    if (variants.length === 0) {
      toast.error('No hay variantes para crear')
      return
    }

    // Check for duplicates
    const foundDuplicates: DuplicateVariant[] = []
    const newVariants: typeof variants = []

    for (const v of variants) {
      const existing = productos.find(
        p =>
          p.name.toLowerCase() === v.name.toLowerCase() &&
          p.color.toLowerCase() === v.color.toLowerCase() &&
          p.talla.toLowerCase() === v.talla.toLowerCase()
      )
      if (existing) {
        foundDuplicates.push({
          existing,
          newStock: v.stock,
          action: 'merge',
        })
      } else {
        newVariants.push(v)
      }
    }

    if (foundDuplicates.length > 0) {
      setDuplicates(foundDuplicates)
      setPendingBulkData({
        name: bulkName.trim(),
        dropId: bulkDropId || null,
        precio,
        precioMayor,
        costo,
        colorRows: validRows,
      })
      setDuplicateDialogOpen(true)
      return
    }

    // No duplicates — create all
    await executeBulkCreate(variants, bulkDropId || null, precio, precioMayor, costo)
  }

  const executeBulkCreate = async (
    variants: { name: string; color: string; talla: string; stock: number; minStock: number }[],
    dropId: string | null,
    precio: number,
    precioMayor: number,
    costo: number
  ) => {
    setSavingBulk(true)
    try {
      let created = 0
      for (const v of variants) {
        await api.productos.create({
          name: v.name,
          color: v.color,
          talla: v.talla,
          stock: v.stock,
          minStock: v.minStock,
          dropId,
          precio,
          precioMayor,
          costo,
        })
        created++
      }
      toast.success(`${created} variante${created !== 1 ? 's' : ''} creada${created !== 1 ? 's' : ''}`)
      setBulkFormOpen(false)
      clearBulkForm()
      await loadProductos()
      await loadDrops()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear variantes')
    } finally {
      setSavingBulk(false)
    }
  }

  const handleDuplicateResolution = async () => {
    if (!pendingBulkData) return

    setSavingBulk(true)
    try {
      const { name, dropId, precio, precioMayor, costo, colorRows: pDataRows } = pendingBulkData

      // Create non-duplicate variants
      const newVariants: { name: string; color: string; talla: string; stock: number; minStock: number }[] = []
      for (const row of pDataRows) {
        for (const size of SIZES) {
          const qty = row.sizes[size] || 0
          if (qty > 0) {
            const isDup = duplicates.find(
              d =>
                d.existing.name.toLowerCase() === name.toLowerCase() &&
                d.existing.color.toLowerCase() === row.colorName.trim().toLowerCase() &&
                d.existing.talla.toLowerCase() === size.toLowerCase()
            )
            if (!isDup) {
              newVariants.push({
                name,
                color: row.colorName.trim(),
                talla: size,
                stock: qty,
                minStock: row.minStock,
              })
            }
          }
        }
      }

      let totalCreated = 0

      // Create new variants
      for (const v of newVariants) {
        await api.productos.create({
          name: v.name,
          color: v.color,
          talla: v.talla,
          stock: v.stock,
          minStock: v.minStock,
          dropId,
          precio,
          precioMayor,
          costo,
        })
        totalCreated++
      }

      // Handle duplicates based on action
      for (const dup of duplicates) {
        if (dup.action === 'merge') {
          await api.productos.update(dup.existing.id, {
            stockAdjust: `+${dup.newStock}`,
          })
          totalCreated++
        }
        // 'skip' — do nothing
      }

      const merged = duplicates.filter(d => d.action === 'merge').length
      const skipped = duplicates.filter(d => d.action === 'skip').length

      let msg = `${totalCreated} variante${totalCreated !== 1 ? 's' : ''} procesada${totalCreated !== 1 ? 's' : ''}`
      if (merged > 0) msg += ` · ${merged} fusionada${merged !== 1 ? 's' : ''}`
      if (skipped > 0) msg += ` · ${skipped} omitida${skipped !== 1 ? 's' : ''}`

      toast.success(msg)
      setDuplicateDialogOpen(false)
      setDuplicates([])
      setPendingBulkData(null)
      setBulkFormOpen(false)
      clearBulkForm()
      await loadProductos()
      await loadDrops()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al procesar variantes')
    } finally {
      setSavingBulk(false)
    }
  }

  // ── Edit product ──
  const openEdit = (p: Producto) => {
    setEditingProducto(p)
    setEditName(p.name)
    setEditColor(p.color)
    setEditTalla(p.talla)
    setEditStock(String(p.stock))
    setEditPrecio(String(p.precio))
    setEditPrecioMayor(String(p.precioMayor))
    setEditCosto(String(p.costo))
    setEditMinStock(String(p.minStock))
    setEditDropId(p.dropId || '')
    setEditOpen(true)
  }

  const handleEditSave = async () => {
    if (!editingProducto) return
    if (!editName.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    setSavingEdit(true)
    try {
      await api.productos.update(editingProducto.id, {
        name: editName,
        dropId: editDropId || null,
        color: editColor,
        talla: editTalla,
        stock: parseInt(editStock) || 0,
        precio: parseFloat(editPrecio) || 0,
        precioMayor: parseFloat(editPrecioMayor) || 0,
        costo: parseFloat(editCosto) || 0,
        minStock: parseInt(editMinStock) || 2,
      })
      toast.success('Producto actualizado')
      setEditOpen(false)
      await loadProductos()
      await loadDrops()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSavingEdit(false)
    }
  }

  // ── Stock badge ──
  const stockBadge = (p: Producto) => {
    if (p.stock === 0)
      return (
        <Badge
          className="text-[10px] font-semibold border-0 px-2 py-0.5"
          style={{ background: s.dangerBg, color: s.dangerText }}
        >
          Agotado
        </Badge>
      )
    if (p.stock <= p.minStock)
      return (
        <Badge
          className="text-[10px] font-semibold border-0 px-2 py-0.5"
          style={{ background: s.warningBg, color: s.warningText }}
        >
          Bajo
        </Badge>
      )
    return (
      <Badge
        className="text-[10px] font-semibold border-0 px-2 py-0.5"
        style={{ background: s.successBg, color: s.successText }}
      >
        OK
      </Badge>
    )
  }

  // ── Total variants count for bulk form preview ──
  const bulkVariantCount = useMemo(() => {
    let count = 0
    for (const row of colorRows) {
      if (row.colorName.trim()) {
        for (const size of SIZES) {
          if ((row.sizes[size] || 0) > 0) count++
        }
      }
    }
    return count
  }, [colorRows])

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2
            className="text-xl font-bold tracking-tight"
            style={{ color: s.textPrimary }}
          >
            Inventario
          </h2>
          <p className="text-xs mt-0.5" style={{ color: s.textMuted }}>
            {productos.length} producto{productos.length !== 1 ? 's' : ''} en
            stock
          </p>
        </div>
        <Button
          onClick={() => setBulkFormOpen(!bulkFormOpen)}
          className="rounded-xl text-white font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: s.accent }}
        >
          {bulkFormOpen ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1.5" /> Cerrar Formulario
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1.5" /> Agregar Variantes
            </>
          )}
        </Button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          BULK CREATION FORM — The Star Feature
         ═══════════════════════════════════════════════════════════════════════ */}
      {bulkFormOpen && (
        <Card
          className="rounded-2xl border-0 overflow-hidden transition-all"
          style={{
            background: s.bulkSectionBg,
            boxShadow: '0 4px 24px rgba(139, 92, 246, 0.1)',
          }}
        >
          {/* Gradient header bar */}
          <div
            className="h-1.5 w-full"
            style={{ background: s.accent }}
          />
          <CardContent className="p-5 space-y-5">
            {/* Section title */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: s.accent }}
              >
                <Layers className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3
                  className="font-bold text-sm"
                  style={{ color: s.textPrimary }}
                >
                  Creación Masiva de Variantes
                </h3>
                <p className="text-xs" style={{ color: s.textMuted }}>
                  Agrega múltiples colores y tallas de una vez
                </p>
              </div>
            </div>

            {/* ── Base product fields ── */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: s.card,
                border: `1px solid ${s.border}`,
              }}
            >
              <Label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: s.accentSolid }}
              >
                Datos del Producto
              </Label>

              <div className="space-y-2.5">
                {/* Name */}
                <div>
                  <Label
                    className="text-xs mb-1 block"
                    style={{ color: s.textSecondary }}
                  >
                    Nombre del producto *
                  </Label>
                  <Input
                    value={bulkName}
                    onChange={e => setBulkName(e.target.value)}
                    placeholder="Ej: Remera Oversize"
                    className="rounded-xl"
                    style={{
                      background: s.inputBg,
                      borderColor: s.inputBorder,
                      color: s.textPrimary,
                    }}
                  />
                </div>

                {/* Drop + Price row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <Label
                      className="text-xs mb-1 block"
                      style={{ color: s.textSecondary }}
                    >
                      Drop
                    </Label>
                    <Select
                      value={bulkDropId || 'none'}
                      onValueChange={v =>
                        setBulkDropId(v === 'none' ? '' : v)
                      }
                    >
                      <SelectTrigger
                        className="rounded-xl"
                        style={{
                          background: s.inputBg,
                          borderColor: s.inputBorder,
                          color: s.textPrimary,
                        }}
                      >
                        <SelectValue placeholder="Sin drop" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin drop</SelectItem>
                        {drops.map(d => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label
                      className="text-xs mb-1 block"
                      style={{ color: s.textSecondary }}
                    >
                      Precio venta
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={bulkPrecio}
                      onChange={e => setBulkPrecio(e.target.value)}
                      placeholder="15000"
                      className="rounded-xl"
                      style={{
                        background: s.inputBg,
                        borderColor: s.inputBorder,
                        color: s.textPrimary,
                      }}
                    />
                  </div>
                  <div>
                    <Label
                      className="text-xs mb-1 block"
                      style={{ color: s.textSecondary }}
                    >
                      Precio mayor
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={bulkPrecioMayor}
                      onChange={e => setBulkPrecioMayor(e.target.value)}
                      placeholder="12000"
                      className="rounded-xl"
                      style={{
                        background: s.inputBg,
                        borderColor: s.inputBorder,
                        color: s.textPrimary,
                      }}
                    />
                  </div>
                  <div>
                    <Label
                      className="text-xs mb-1 block"
                      style={{ color: s.textSecondary }}
                    >
                      Costo
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={bulkCosto}
                      onChange={e => setBulkCosto(e.target.value)}
                      placeholder="8000"
                      className="rounded-xl"
                      style={{
                        background: s.inputBg,
                        borderColor: s.inputBorder,
                        color: s.textPrimary,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Color Rows ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette
                    className="w-4 h-4"
                    style={{ color: s.accentSolid }}
                  />
                  <Label
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: s.accentSolid }}
                  >
                    Colores y Tallas
                  </Label>
                </div>
                {bulkVariantCount > 0 && (
                  <Badge
                    className="text-[10px] font-semibold border-0 px-2.5 py-0.5"
                    style={{ background: s.accentLight, color: s.accentSolid }}
                  >
                    {bulkVariantCount} variante{bulkVariantCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                {colorRows.map((row, rowIdx) => (
                  <div
                    key={row.id}
                    className="rounded-xl overflow-hidden transition-all"
                    style={{
                      background: s.colorRowBg,
                      border: `1.5px solid ${s.colorRowBorder}`,
                    }}
                  >
                    {/* Color row header */}
                    <div
                      className="flex items-center gap-2.5 px-4 py-2.5"
                      style={{
                        borderBottom: `1px solid ${s.colorRowBorder}`,
                        background: s.accentLight,
                      }}
                    >
                      {/* Color swatch preview */}
                      <div
                        style={getColorSwatch(row.colorName || '?', 18)}
                      />
                      <span
                        className="text-xs font-semibold"
                        style={{ color: s.textPrimary }}
                      >
                        Color #{rowIdx + 1}
                      </span>
                      <div className="flex-1" />
                      {colorRows.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => removeColorRow(row.id)}
                        >
                          <X
                            className="w-3.5 h-3.5"
                            style={{ color: s.dangerText }}
                          />
                        </Button>
                      )}
                    </div>

                    {/* Color row body */}
                    <div className="p-3.5 space-y-3">
                      {/* Color name + Min stock */}
                      <div className="grid grid-cols-[1fr_100px] gap-2.5 items-end">
                        <div>
                          <Label
                            className="text-[10px] uppercase tracking-wider mb-1 block"
                            style={{ color: s.textMuted }}
                          >
                            Nombre del color
                          </Label>
                          <div className="relative">
                            {row.colorName && (
                              <div
                                className="absolute left-2.5 top-1/2 -translate-y-1/2"
                                style={getColorSwatch(row.colorName, 12)}
                              />
                            )}
                            <Input
                              value={row.colorName}
                              onChange={e =>
                                updateColorRow(
                                  row.id,
                                  'colorName',
                                  e.target.value
                                )
                              }
                              placeholder="Ej: Negro, Rojo, Beige..."
                              className={`rounded-lg text-sm ${row.colorName ? 'pl-7' : ''}`}
                              style={{
                                background: s.inputBg,
                                borderColor: s.inputBorder,
                                color: s.textPrimary,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <Label
                            className="text-[10px] uppercase tracking-wider mb-1 block"
                            style={{ color: s.textMuted }}
                          >
                            Stock mín
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            value={row.minStock}
                            onChange={e =>
                              updateColorRow(
                                row.id,
                                'minStock',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="rounded-lg text-sm"
                            style={{
                              background: s.inputBg,
                              borderColor: s.inputBorder,
                              color: s.textPrimary,
                            }}
                          />
                        </div>
                      </div>

                      {/* Size inputs */}
                      <div>
                        <Label
                          className="text-[10px] uppercase tracking-wider mb-1.5 block"
                          style={{ color: s.textMuted }}
                        >
                          Stock por talla
                        </Label>
                        <div className="grid grid-cols-6 gap-1.5">
                          {SIZES.map(size => (
                            <div key={size} className="text-center">
                              <span
                                className="text-[10px] font-bold block mb-1"
                                style={{ color: s.accentSolid }}
                              >
                                {size}
                              </span>
                              <Input
                                type="number"
                                min={0}
                                value={row.sizes[size] || ''}
                                onChange={e =>
                                  updateSizeInput(
                                    row.id,
                                    size,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                                className="rounded-lg text-center text-sm h-9 p-1"
                                style={{
                                  background: s.inputBg,
                                  borderColor: s.inputBorder,
                                  color: s.textPrimary,
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add color button */}
              <Button
                variant="outline"
                onClick={addColorRow}
                className="w-full rounded-xl border-dashed h-10 text-xs font-semibold transition-all hover:scale-[1.005]"
                style={{
                  borderColor: s.accentMedium,
                  color: s.accentSolid,
                  background: s.accentLight,
                }}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Agregar color
              </Button>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex items-center gap-2.5 pt-1">
              <Button
                onClick={handleBulkSubmit}
                disabled={savingBulk}
                className="flex-1 rounded-xl text-white font-semibold h-11 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: s.accent }}
              >
                {savingBulk ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Layers className="w-4 h-4 mr-1.5" />
                )}
                Agregar {bulkVariantCount > 0 ? `${bulkVariantCount} ` : ''}
                variante{bulkVariantCount !== 1 ? 's' : ''}
              </Button>
              <Button
                variant="outline"
                onClick={clearBulkForm}
                className="rounded-xl h-11"
                style={{
                  borderColor: s.border,
                  color: s.textMuted,
                }}
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          FILTERS BAR
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: s.textMuted }}
          />
          <Input
            placeholder="Buscar por nombre o color..."
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
        <Button
          variant="outline"
          className="rounded-xl gap-1.5"
          onClick={() => setShowFilters(!showFilters)}
          style={{
            borderColor: s.border,
            color: s.textSecondary,
          }}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {showFilters ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>

      {showFilters && (
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl p-3"
          style={{
            background: s.card,
            border: `1px solid ${s.border}`,
          }}
        >
          <Select value={filterDrop} onValueChange={setFilterDrop}>
            <SelectTrigger
              className="rounded-xl"
              style={{
                background: s.inputBg,
                borderColor: s.inputBorder,
                color: s.textPrimary,
              }}
            >
              <SelectValue placeholder="Todos los drops" />
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
          <Select value={filterColor} onValueChange={setFilterColor}>
            <SelectTrigger
              className="rounded-xl"
              style={{
                background: s.inputBg,
                borderColor: s.inputBorder,
                color: s.textPrimary,
              }}
            >
              <SelectValue placeholder="Todos los colores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los colores</SelectItem>
              {uniqueColors.map(c => (
                <SelectItem key={c} value={c}>
                  <div className="flex items-center gap-2">
                    <span style={getColorSwatch(c, 10)} />
                    {c}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStock} onValueChange={setFilterStock}>
            <SelectTrigger
              className="rounded-xl"
              style={{
                background: s.inputBg,
                borderColor: s.inputBorder,
                color: s.textPrimary,
              }}
            >
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="low">Bajo</SelectItem>
              <SelectItem value="out">Agotado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Batch actions bar ── */}
      {selectedIds.size > 0 && (
        <div
          className="flex items-center gap-3 rounded-xl p-3"
          style={{
            background: s.accentLight,
            border: `1px solid ${s.accentMedium}`,
          }}
        >
          <span
            className="text-xs font-semibold"
            style={{ color: s.accentSolid }}
          >
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div className="flex-1" />
          <Button
            variant="destructive"
            size="sm"
            className="rounded-xl h-8 text-xs"
            onClick={() => setBatchDeleteOpen(true)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar seleccionados
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-8 text-xs"
            onClick={() => setSelectedIds(new Set())}
            style={{ borderColor: s.border, color: s.textMuted }}
          >
            Cancelar
          </Button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PRODUCT LIST
         ═══════════════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-24 rounded-2xl"
              style={{ background: s.colorRowBg }}
            />
          ))}
        </div>
      ) : productos.length === 0 ? (
        <Card
          className="rounded-2xl border-0"
          style={{
            background: s.card,
            boxShadow: s.shadow,
          }}
        >
          <CardContent className="py-16 text-center">
            <Package
              className="w-14 h-14 mx-auto mb-4"
              style={{ color: s.textMuted, opacity: 0.3 }}
            />
            <p
              className="font-semibold text-sm"
              style={{ color: s.textPrimary }}
            >
              No hay productos
            </p>
            <p className="text-xs mt-1" style={{ color: s.textMuted }}>
              Agrega tu primer producto al inventario
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-0.5">
          {/* Select all row */}
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-t-xl"
            style={{
              background: s.card,
              borderBottom: `1px solid ${s.border}`,
            }}
          >
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={toggleSelectAll}
              className="rounded"
            />
            <span
              className="text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: s.textMuted }}
            >
              Seleccionar todos ({productos.length})
            </span>
          </div>

          {/* Product cards */}
          <div
            className="rounded-b-xl overflow-hidden max-h-[calc(100vh-380px)] overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: `${s.border} transparent`,
            }}
          >
            <style>{`
              ::-webkit-scrollbar { width: 6px; }
              ::-webkit-scrollbar-track { background: transparent; }
              ::-webkit-scrollbar-thumb { background: ${s.border}; border-radius: 3px; }
              ::-webkit-scrollbar-thumb:hover { background: ${s.accentMedium}; }
            `}</style>
            {productos.map(p => {
              const margen = calcMargen(p.precio, p.costo)
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{
                    background: selectedIds.has(p.id)
                      ? s.accentLight
                      : s.card,
                    borderBottom: `1px solid ${s.border}`,
                  }}
                  onMouseEnter={e => {
                    if (!selectedIds.has(p.id))
                      (e.currentTarget as HTMLDivElement).style.background =
                        s.cardHover
                  }}
                  onMouseLeave={e => {
                    if (!selectedIds.has(p.id))
                      (e.currentTarget as HTMLDivElement).style.background =
                        s.card
                  }}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={selectedIds.has(p.id)}
                    onCheckedChange={() => toggleSelect(p.id)}
                    className="rounded shrink-0"
                  />

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    {/* Name + badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="font-semibold text-sm truncate max-w-[180px]"
                        style={{ color: s.textPrimary }}
                      >
                        {p.name}
                      </span>
                      {p.drop && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                          style={{
                            background: s.tagBg,
                            color: s.tagText,
                          }}
                        >
                          {p.drop.name}
                        </span>
                      )}
                      {stockBadge(p)}
                    </div>

                    {/* Color + Talla */}
                    <div
                      className="flex items-center gap-3 mt-1 text-xs"
                      style={{ color: s.textMuted }}
                    >
                      <span className="flex items-center gap-1.5">
                        <span style={getColorSwatch(p.color, 10)} />
                        {p.color}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                        style={{
                          background: s.tagBg,
                          color: s.tagText,
                        }}
                      >
                        {p.talla}
                      </span>
                    </div>

                    {/* Prices */}
                    <div className="flex items-center gap-3 mt-1 text-xs flex-wrap">
                      <span
                        className="font-semibold"
                        style={{ color: s.successText }}
                      >
                        {fmt(p.precio)}
                      </span>
                      {p.precioMayor > 0 && (
                        <span style={{ color: s.textSecondary }}>
                          Mayor: {fmt(p.precioMayor)}
                        </span>
                      )}
                      {p.costo > 0 && (
                        <span style={{ color: s.dangerText }}>
                          Costo: {fmt(p.costo)}
                        </span>
                      )}
                      {margen > 0 && (
                        <span
                          className="font-semibold"
                          style={{ color: s.accentSolid }}
                        >
                          {margen}% margen
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock + actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-lg"
                      style={{
                        borderColor: s.border,
                        color: s.textSecondary,
                      }}
                      onClick={() => handleStockAdjust(p.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span
                      className="w-8 text-center text-sm font-bold tabular-nums"
                      style={{ color: s.textPrimary }}
                    >
                      {p.stock}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-lg"
                      style={{
                        borderColor: s.border,
                        color: s.textSecondary,
                      }}
                      onClick={() => handleStockAdjust(p.id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>

                    <div
                      className="w-px h-5 mx-0.5"
                      style={{ background: s.border }}
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg"
                      onClick={() => openEdit(p)}
                    >
                      <Edit2
                        className="w-3.5 h-3.5"
                        style={{ color: s.textMuted }}
                      />
                    </Button>

                    {deleteConfirm === p.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 rounded-lg text-[10px] px-2"
                          onClick={() => handleDelete(p.id)}
                        >
                          Sí
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-lg text-[10px] px-2"
                          style={{
                            borderColor: s.border,
                            color: s.textMuted,
                          }}
                          onClick={() => setDeleteConfirm(null)}
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => setDeleteConfirm(p.id)}
                      >
                        <Trash2
                          className="w-3.5 h-3.5"
                          style={{ color: s.dangerText }}
                        />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          EDIT DIALOG
         ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          className="rounded-2xl max-w-md"
          style={{
            background: s.card,
            border: `1px solid ${s.border}`,
            color: s.textPrimary,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: s.textPrimary }}>
              Editar Producto
            </DialogTitle>
            <DialogDescription style={{ color: s.textMuted }}>
              Modifica los datos del producto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: s.textSecondary }}
              >
                Nombre *
              </Label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="rounded-xl"
                style={{
                  background: s.inputBg,
                  borderColor: s.inputBorder,
                  color: s.textPrimary,
                }}
              />
            </div>
            <div>
              <Label
                className="text-xs mb-1 block"
                style={{ color: s.textSecondary }}
              >
                Drop
              </Label>
              <Select
                value={editDropId || 'none'}
                onValueChange={v => setEditDropId(v === 'none' ? '' : v)}
              >
                <SelectTrigger
                  className="rounded-xl"
                  style={{
                    background: s.inputBg,
                    borderColor: s.inputBorder,
                    color: s.textPrimary,
                  }}
                >
                  <SelectValue placeholder="Sin drop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin drop</SelectItem>
                  {drops.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label
                  className="text-xs mb-1 block"
                  style={{ color: s.textSecondary }}
                >
                  Color
                </Label>
                <div className="relative">
                  {editColor && (
                    <div
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10"
                      style={getColorSwatch(editColor, 12)}
                    />
                  )}
                  <Input
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                    className={`rounded-xl ${editColor ? 'pl-7' : ''}`}
                    style={{
                      background: s.inputBg,
                      borderColor: s.inputBorder,
                      color: s.textPrimary,
                    }}
                  />
                </div>
              </div>
              <div>
                <Label
                  className="text-xs mb-1 block"
                  style={{ color: s.textSecondary }}
                >
                  Talla
                </Label>
                <Input
                  value={editTalla}
                  onChange={e => setEditTalla(e.target.value)}
                  className="rounded-xl"
                  style={{
                    background: s.inputBg,
                    borderColor: s.inputBorder,
                    color: s.textPrimary,
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label
                  className="text-xs mb-1 block"
                  style={{ color: s.textSecondary }}
                >
                  Stock
                </Label>
                <Input
                  type="number"
                  value={editStock}
                  onChange={e => setEditStock(e.target.value)}
                  className="rounded-xl"
                  style={{
                    background: s.inputBg,
                    borderColor: s.inputBorder,
                    color: s.textPrimary,
                  }}
                />
              </div>
              <div>
                <Label
                  className="text-xs mb-1 block"
                  style={{ color: s.textSecondary }}
                >
                  Stock mínimo
                </Label>
                <Input
                  type="number"
                  value={editMinStock}
                  onChange={e => setEditMinStock(e.target.value)}
                  className="rounded-xl"
                  style={{
                    background: s.inputBg,
                    borderColor: s.inputBorder,
                    color: s.textPrimary,
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <Label
                  className="text-xs mb-1 block"
                  style={{ color: s.textSecondary }}
                >
                  Precio venta
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editPrecio}
                  onChange={e => setEditPrecio(e.target.value)}
                  className="rounded-xl"
                  style={{
                    background: s.inputBg,
                    borderColor: s.inputBorder,
                    color: s.textPrimary,
                  }}
                />
              </div>
              <div>
                <Label
                  className="text-xs mb-1 block"
                  style={{ color: s.textSecondary }}
                >
                  Precio mayor
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editPrecioMayor}
                  onChange={e => setEditPrecioMayor(e.target.value)}
                  className="rounded-xl"
                  style={{
                    background: s.inputBg,
                    borderColor: s.inputBorder,
                    color: s.textPrimary,
                  }}
                />
              </div>
              <div>
                <Label
                  className="text-xs mb-1 block"
                  style={{ color: s.textSecondary }}
                >
                  Costo
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editCosto}
                  onChange={e => setEditCosto(e.target.value)}
                  className="rounded-xl"
                  placeholder="Costo"
                  style={{
                    background: s.inputBg,
                    borderColor: s.inputBorder,
                    color: s.textPrimary,
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="rounded-xl"
              style={{ borderColor: s.border, color: s.textMuted }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={savingEdit}
              className="rounded-xl text-white font-semibold"
              style={{ background: s.accent }}
            >
              {savingEdit ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          DUPLICATE DETECTION DIALOG
         ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent
          className="rounded-2xl max-w-lg"
          style={{
            background: s.card,
            border: `1px solid ${s.border}`,
            color: s.textPrimary,
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className="w-5 h-5"
                style={{ color: s.warningText }}
              />
              <span style={{ color: s.textPrimary }}>
                Variantes duplicadas
              </span>
            </DialogTitle>
            <DialogDescription style={{ color: s.textMuted }}>
              Se encontraron {duplicates.length} variante
              {duplicates.length !== 1 ? 's' : ''} que ya existe
              {duplicates.length !== 1 ? 'n' : ''}. Elegí qué hacer con cada
              una.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-72 overflow-y-auto py-2">
            {duplicates.map((dup, idx) => (
              <div
                key={dup.existing.id}
                className="rounded-xl p-3 flex items-center gap-3"
                style={{
                  background: s.colorRowBg,
                  border: `1px solid ${s.colorRowBorder}`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-semibold text-sm truncate"
                      style={{ color: s.textPrimary }}
                    >
                      {dup.existing.name}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-2 mt-0.5 text-xs"
                    style={{ color: s.textMuted }}
                  >
                    <span className="flex items-center gap-1">
                      <span style={getColorSwatch(dup.existing.color, 8)} />
                      {dup.existing.color}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ background: s.tagBg, color: s.tagText }}
                    >
                      {dup.existing.talla}
                    </span>
                    <span>
                      Stock actual:{' '}
                      <strong style={{ color: s.textPrimary }}>
                        {dup.existing.stock}
                      </strong>
                    </span>
                    <span>
                      +{dup.newStock} nuevo
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant={dup.action === 'merge' ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-lg h-7 text-[10px] px-2.5 gap-1"
                    style={
                      dup.action === 'merge'
                        ? { background: s.accent, color: 'white' }
                        : {
                            borderColor: s.border,
                            color: s.textSecondary,
                          }
                    }
                    onClick={() => {
                      setDuplicates(prev =>
                        prev.map((d, i) =>
                          i === idx ? { ...d, action: 'merge' } : d
                        )
                      )
                    }}
                  >
                    <Merge className="w-3 h-3" /> Fusionar
                  </Button>
                  <Button
                    variant={dup.action === 'skip' ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-lg h-7 text-[10px] px-2.5 gap-1"
                    style={
                      dup.action === 'skip'
                        ? { background: s.border, color: s.textPrimary }
                        : {
                            borderColor: s.border,
                            color: s.textSecondary,
                          }
                    }
                    onClick={() => {
                      setDuplicates(prev =>
                        prev.map((d, i) =>
                          i === idx ? { ...d, action: 'skip' } : d
                        )
                      )
                    }}
                  >
                    <SkipForward className="w-3 h-3" /> Omitir
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDuplicateDialogOpen(false)
                setDuplicates([])
                setPendingBulkData(null)
              }}
              className="rounded-xl"
              style={{ borderColor: s.border, color: s.textMuted }}
            >
              Cancelar todo
            </Button>
            <Button
              onClick={handleDuplicateResolution}
              disabled={savingBulk}
              className="rounded-xl text-white font-semibold"
              style={{ background: s.accent }}
            >
              {savingBulk ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          BATCH DELETE DIALOG
         ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <DialogContent
          className="rounded-2xl max-w-sm"
          style={{
            background: s.card,
            border: `1px solid ${s.border}`,
            color: s.textPrimary,
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className="w-5 h-5"
                style={{ color: s.dangerText }}
              />
              <span style={{ color: s.textPrimary }}>
                Eliminar {selectedIds.size} producto
                {selectedIds.size !== 1 ? 's' : ''}
              </span>
            </DialogTitle>
            <DialogDescription style={{ color: s.textMuted }}>
              Esta acción no se puede deshacer. ¿Estás seguro?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setBatchDeleteOpen(false)}
              className="rounded-xl"
              style={{ borderColor: s.border, color: s.textMuted }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleBatchDelete}
              disabled={batchDeleting}
              className="rounded-xl font-semibold"
            >
              {batchDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1.5" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
