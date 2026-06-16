'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
import { api, type Producto, type Venta, type Drop, type Cliente } from '@/lib/api'
import { toast } from 'sonner'
import {
  ShoppingCart,
  Plus,
  Trash2,
  Search,
  CreditCard,
  User,
  Calendar,
  DollarSign,
  Package,
  ChevronDown,
  Loader2,
  Tag,
  Edit2,
  Receipt,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Props {
  drops: Drop[]
  loadDrops: () => Promise<void>
  theme: 'light' | 'dark' | 'black'
}

interface CartItem {
  productoId: string
  productName: string
  color: string
  talla: string
  qty: number
  precio: number
  subtotal: number
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

const METODOS_PAGO = [
  'Efectivo',
  'Transferencia',
  'MercadoPago',
  'Tarjeta',
  'Yape',
  'Plin',
  'Otro',
]

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
    selectorBg: '#f5f0ff',
    selectorBorder: '#ddd6fe',
    selectorHover: '#ede9fe',
    selectorActive: '#8b5cf6',
    cartItemBg: '#faf7ff',
    cartItemBorder: '#ede9fe',
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
    selectorBg: '#1f1b35',
    selectorBorder: '#36305a',
    selectorHover: '#2a2548',
    selectorActive: '#8b5cf6',
    cartItemBg: '#1f1b35',
    cartItemBorder: '#36305a',
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
    selectorBg: '#141414',
    selectorBorder: '#2a2a2a',
    selectorHover: '#1e1e1e',
    selectorActive: '#8b5cf6',
    cartItemBg: '#141414',
    cartItemBorder: '#2a2a2a',
    tagBg: 'rgba(139, 92, 246, 0.12)',
    tagText: '#a78bfa',
    shadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
    shadowHover: '0 4px 12px rgba(139, 92, 246, 0.1)',
  },
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
  }
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(n)
}

function getStockColor(stock: number, minStock: number, ts: typeof THEME_STYLES.light) {
  if (stock <= 0) return { bg: ts.dangerBg, text: ts.dangerText, label: 'Sin stock' }
  if (stock <= minStock) return { bg: ts.warningBg, text: ts.warningText, label: `Stock bajo (${stock})` }
  return { bg: ts.successBg, text: ts.successText, label: `En stock (${stock})` }
}

function formatFecha(fecha: string) {
  if (!fecha) return ''
  try {
    const d = new Date(fecha + 'T12:00:00')
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return fecha
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VentasTab({ drops, loadDrops, theme }: Props) {
  const ts = THEME_STYLES[theme]

  // ─── State ──────────────────────────────────────────────────────────────
  const [productos, setProductos] = useState<Producto[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'nueva' | 'historial'>('nueva')

  // Cascading selectors
  const [selDropId, setSelDropId] = useState<string>('')
  const [selProductName, setSelProductName] = useState<string>('')
  const [selColor, setSelColor] = useState<string>('')
  const [selTalla, setSelTalla] = useState<string>('')
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)

  // Cart & form
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartQty, setCartQty] = useState('1')
  const [cartPrecio, setCartPrecio] = useState('')
  const [tipoPrecio, setTipoPrecio] = useState<'minorista' | 'mayorista'>('minorista')
  const [comisionPct, setComisionPct] = useState('0')
  const [cliente, setCliente] = useState('')
  const [vendedor, setVendedor] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [metodoPago, setMetodoPago] = useState('Efectivo')
  const [nota, setNota] = useState('')

  // History filters
  const [searchVenta, setSearchVenta] = useState('')
  const [filterDropVenta, setFilterDropVenta] = useState('all')
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')
  const [filterMetodoPago, setFilterMetodoPago] = useState('all')

  // Delete / edit dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editVenta, setEditVenta] = useState<Venta | null>(null)
  const [editMetodoPago, setEditMetodoPago] = useState('')
  const [editVendedor, setEditVendedor] = useState('')
  const [editNota, setEditNota] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // ─── Data Loading ───────────────────────────────────────────────────────

  const loadProductos = useCallback(async () => {
    try {
      const data = await api.productos.list({ stock: 'all' })
      setProductos(data)
    } catch {
      // silent
    }
  }, [])

  const loadVentas = useCallback(async () => {
    try {
      const filters: Record<string, string> = {}
      if (searchVenta) filters.search = searchVenta
      if (filterDropVenta && filterDropVenta !== 'all') filters.dropId = filterDropVenta
      if (filterFechaDesde) filters.fechaDesde = filterFechaDesde
      if (filterFechaHasta) filters.fechaHasta = filterFechaHasta
      if (filterMetodoPago && filterMetodoPago !== 'all') filters.metodoPago = filterMetodoPago
      const data = await api.ventas.list(filters)
      setVentas(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [searchVenta, filterDropVenta, filterFechaDesde, filterFechaHasta, filterMetodoPago])

  const loadClientes = useCallback(async () => {
    try {
      const data = await api.clientes.list()
      setClientes(data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    Promise.all([loadProductos(), loadVentas(), loadClientes()])
  }, [loadProductos, loadVentas, loadClientes])

  // ─── Cascading Selector Logic ───────────────────────────────────────────

  // Step 1: Products filtered by drop
  const productsByDrop = useMemo(() => {
    if (!selDropId) return productos
    return productos.filter(p => p.dropId === selDropId)
  }, [productos, selDropId])

  // Step 2: Unique product names from filtered products
  const uniqueProductNames = useMemo(() => {
    const names = [...new Set(productsByDrop.map(p => p.name))]
    return names.sort()
  }, [productsByDrop])

  // Step 3: Colors for the selected product name
  const colorsForName = useMemo(() => {
    if (!selProductName) return []
    const colors = [...new Set(productsByDrop.filter(p => p.name === selProductName).map(p => p.color))]
    return colors.sort()
  }, [productsByDrop, selProductName])

  // Step 4: Tallas for the selected color
  const tallasForColor = useMemo(() => {
    if (!selColor) return []
    const variants = productsByDrop.filter(p => p.name === selProductName && p.color === selColor)
    return variants.sort((a, b) => {
      const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      const ia = order.indexOf(a.talla.toUpperCase())
      const ib = order.indexOf(b.talla.toUpperCase())
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
  }, [productsByDrop, selProductName, selColor])

  // When talla is selected, find the matching product
  useEffect(() => {
    if (selTalla) {
      const found = productsByDrop.find(
        p => p.name === selProductName && p.color === selColor && p.talla === selTalla
      )
      setSelectedProducto(found || null)
      if (found) {
        const price = tipoPrecio === 'mayorista' ? found.precioMayor : found.precio
        setCartPrecio(String(price || found.precio))
      }
    } else {
      setSelectedProducto(null)
    }
  }, [selTalla, selProductName, selColor, productsByDrop, tipoPrecio])

  // When tipoPrecio changes, update the auto-filled price
  useEffect(() => {
    if (selectedProducto) {
      const price = tipoPrecio === 'mayorista' ? selectedProducto.precioMayor : selectedProducto.precio
      setCartPrecio(String(price || selectedProducto.precio))
    }
  }, [tipoPrecio, selectedProducto])

  // Reset cascading when parent changes
  const handleDropChange = (val: string) => {
    setSelDropId(val)
    setSelProductName('')
    setSelColor('')
    setSelTalla('')
    setSelectedProducto(null)
    setCartPrecio('')
  }

  const handleProductNameChange = (val: string) => {
    setSelProductName(val)
    setSelColor('')
    setSelTalla('')
    setSelectedProducto(null)
    setCartPrecio('')
  }

  const handleColorChange = (val: string) => {
    setSelColor(val)
    setSelTalla('')
    setSelectedProducto(null)
    setCartPrecio('')
  }

  const handleTallaChange = (val: string) => {
    setSelTalla(val)
  }

  // ─── Cart Logic ─────────────────────────────────────────────────────────

  const addToCart = () => {
    if (!selectedProducto) {
      toast.error('Selecciona un producto completo (drop, nombre, color, talla)')
      return
    }
    const qty = parseInt(cartQty) || 1
    const precio = parseFloat(cartPrecio) || selectedProducto.precio
    if (qty <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }
    if (qty > selectedProducto.stock) {
      toast.error(`Solo hay ${selectedProducto.stock} unidades en stock`)
      return
    }

    // Check if same product already in cart
    const existingIdx = cart.findIndex(
      c => c.productoId === selectedProducto.id && c.precio === precio
    )

    if (existingIdx >= 0) {
      const existingItem = cart[existingIdx]
      const newQty = existingItem.qty + qty
      if (newQty > selectedProducto.stock) {
        toast.error(`Solo hay ${selectedProducto.stock} en stock. Ya tienes ${existingItem.qty} en el carrito.`)
        return
      }
      setCart(cart.map((c, i) =>
        i === existingIdx
          ? { ...c, qty: newQty, subtotal: newQty * precio }
          : c
      ))
    } else {
      setCart([...cart, {
        productoId: selectedProducto.id,
        productName: selectedProducto.name,
        color: selectedProducto.color,
        talla: selectedProducto.talla,
        qty,
        precio,
        subtotal: qty * precio,
      }])
    }

    // Reset selectors but keep drop
    setSelProductName('')
    setSelColor('')
    setSelTalla('')
    setSelectedProducto(null)
    setCartQty('1')
    setCartPrecio('')
    toast.success('Producto agregado al carrito')
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const comisionMonto = cartTotal * ((parseFloat(comisionPct) || 0) / 100)

  // ─── Create Venta ───────────────────────────────────────────────────────

  const handleCreateVenta = async () => {
    if (cart.length === 0) {
      toast.error('Agrega al menos un producto al carrito')
      return
    }
    if (!cliente.trim()) {
      toast.error('El nombre del cliente es requerido')
      return
    }
    setSaving(true)
    try {
      await api.ventas.create({
        cliente: cliente.trim(),
        vendedor: vendedor.trim(),
        fecha,
        dropId: selDropId || null,
        metodoPago,
        nota: nota.trim(),
        comisionPct: parseFloat(comisionPct) || 0,
        items: cart.map(item => ({
          productoId: item.productoId,
          qty: item.qty,
          precio: item.precio,
        })),
      })
      toast.success('Venta registrada exitosamente')
      // Reset all form state
      setCart([])
      setCliente('')
      setVendedor('')
      setFecha(new Date().toISOString().split('T')[0])
      setMetodoPago('Efectivo')
      setNota('')
      setComisionPct('0')
      setSelDropId('')
      setSelProductName('')
      setSelColor('')
      setSelTalla('')
      setSelectedProducto(null)
      setCartQty('1')
      setCartPrecio('')
      setTipoPrecio('minorista')
      await Promise.all([loadProductos(), loadVentas(), loadDrops(), loadClientes()])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar venta'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete Venta ───────────────────────────────────────────────────────

  const handleDeleteVenta = async (id: string) => {
    try {
      await api.ventas.delete(id)
      toast.success('Venta eliminada (stock revertido)')
      setDeleteConfirm(null)
      await Promise.all([loadProductos(), loadVentas(), loadDrops()])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar venta'
      toast.error(msg)
    }
  }

  // ─── Edit Venta ─────────────────────────────────────────────────────────

  const openEditDialog = (v: Venta) => {
    setEditVenta(v)
    setEditMetodoPago(v.metodoPago)
    setEditVendedor(v.vendedor)
    setEditNota(v.nota)
    setEditDialogOpen(true)
  }

  const handleEditVenta = async () => {
    if (!editVenta) return
    setEditSaving(true)
    try {
      await api.ventas.update(editVenta.id, {
        metodoPago: editMetodoPago,
        vendedor: editVendedor.trim(),
        nota: editNota.trim(),
      })
      toast.success('Venta actualizada')
      setEditDialogOpen(false)
      await loadVentas()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar venta'
      toast.error(msg)
    } finally {
      setEditSaving(false)
    }
  }

  // ─── Group ventas by pedidoId ───────────────────────────────────────────

  const groupedVentas = useMemo(() => {
    const groups: Record<string, Venta[]> = {}
    ventas.forEach(v => {
      const key = v.pedido?.id || v.id
      if (!groups[key]) groups[key] = []
      groups[key].push(v)
    })
    return Object.entries(groups).sort(([, a], [, b]) => {
      const dateA = a[0].createdAt || a[0].fecha
      const dateB = b[0].createdAt || b[0].fecha
      return dateB.localeCompare(dateA)
    })
  }, [ventas])

  // ─── Custom Select Styling ──────────────────────────────────────────────

  const selectWrapperStyle: React.CSSProperties = {
    background: ts.selectorBg,
    borderColor: ts.selectorBorder,
    borderRadius: '0.75rem',
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header with view toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold" style={{ color: ts.textPrimary }}>
          Ventas
        </h2>
        <div
          className="flex rounded-xl overflow-hidden border"
          style={{ borderColor: ts.border, background: ts.card }}
        >
          <button
            onClick={() => setViewMode('nueva')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: viewMode === 'nueva' ? ts.accent : 'transparent',
              color: viewMode === 'nueva' ? '#fff' : ts.textSecondary,
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            Nueva Venta
          </button>
          <button
            onClick={() => setViewMode('historial')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: viewMode === 'historial' ? ts.accent : 'transparent',
              color: viewMode === 'historial' ? '#fff' : ts.textSecondary,
            }}
          >
            <Receipt className="w-4 h-4" />
            Historial
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          HISTORIAL VIEW - FILTERS
         ═══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'historial' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <Label className="text-xs mb-1.5 block" style={{ color: ts.textMuted }}>Desde</Label>
            <Input
              type="date"
              value={filterFechaDesde}
              onChange={e => setFilterFechaDesde(e.target.value)}
              className="rounded-xl"
              style={{ background: ts.inputBg, borderColor: ts.inputBorder, color: ts.textPrimary }}
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block" style={{ color: ts.textMuted }}>Hasta</Label>
            <Input
              type="date"
              value={filterFechaHasta}
              onChange={e => setFilterFechaHasta(e.target.value)}
              className="rounded-xl"
              style={{ background: ts.inputBg, borderColor: ts.inputBorder, color: ts.textPrimary }}
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block" style={{ color: ts.textMuted }}>Método de pago</Label>
            <Select value={filterMetodoPago} onValueChange={setFilterMetodoPago}>
              <SelectTrigger className="rounded-xl" style={{ background: ts.inputBg, borderColor: ts.inputBorder, color: ts.textPrimary }}>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {METODOS_PAGO.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block" style={{ color: ts.textMuted }}>Drop</Label>
            <Select value={filterDropVenta} onValueChange={setFilterDropVenta}>
              <SelectTrigger className="rounded-xl" style={{ background: ts.inputBg, borderColor: ts.inputBorder, color: ts.textPrimary }}>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {drops.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          NUEVA VENTA VIEW
         ═══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'nueva' ? (
        <div className="grid lg:grid-cols-5 gap-4">
          {/* ── Left: Product Selection ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Cascading Selectors Card */}
            <Card
              className="rounded-2xl border-0"
              style={{ background: ts.card, boxShadow: ts.shadow }}
            >
              <CardHeader className="pb-3">
                <CardTitle
                  className="text-base flex items-center gap-2"
                  style={{ color: ts.textPrimary }}
                >
                  <Package className="w-4 h-4" style={{ color: ts.accentSolid }} />
                  Seleccionar Producto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Row 1: Drop selector */}
                <div className="space-y-1.5">
                  <Label
                    className="text-xs font-medium flex items-center gap-1"
                    style={{ color: ts.textSecondary }}
                  >
                    <ChevronDown className="w-3 h-3" />
                    Drop
                  </Label>
                  <div
                    className="rounded-xl border overflow-hidden"
                    style={selectWrapperStyle}
                  >
                    <Select value={selDropId || '__none__'} onValueChange={v => handleDropChange(v === '__none__' ? '' : v)}>
                      <SelectTrigger
                        className="border-0 h-10 rounded-xl"
                        style={{ background: 'transparent', color: ts.textPrimary }}
                      >
                        <SelectValue placeholder="Todos los drops" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Todos los drops</SelectItem>
                        {drops.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Product name selector */}
                <div className="space-y-1.5">
                  <Label
                    className="text-xs font-medium flex items-center gap-1"
                    style={{ color: ts.textSecondary }}
                  >
                    <Package className="w-3 h-3" />
                    Nombre del producto
                  </Label>
                  <div
                    className="rounded-xl border overflow-hidden"
                    style={selectWrapperStyle}
                  >
                    <Select value={selProductName || '__none__'} onValueChange={v => handleProductNameChange(v === '__none__' ? '' : v)}>
                      <SelectTrigger
                        className="border-0 h-10 rounded-xl"
                        style={{ background: 'transparent', color: ts.textPrimary }}
                      >
                        <SelectValue placeholder={selDropId ? 'Selecciona producto...' : 'Selecciona un drop primero...'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Ninguno —</SelectItem>
                        {uniqueProductNames.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Color selector */}
                <div className="space-y-1.5">
                  <Label
                    className="text-xs font-medium flex items-center gap-1"
                    style={{ color: ts.textSecondary }}
                  >
                    <div style={getColorSwatch('x', 12)} />
                    Color
                  </Label>
                  <div
                    className="rounded-xl border overflow-hidden"
                    style={selectWrapperStyle}
                  >
                    <Select
                      value={selColor || '__none__'}
                      onValueChange={v => handleColorChange(v === '__none__' ? '' : v)}
                      disabled={!selProductName}
                    >
                      <SelectTrigger
                        className="border-0 h-10 rounded-xl"
                        style={{
                          background: 'transparent',
                          color: ts.textPrimary,
                          opacity: selProductName ? 1 : 0.5,
                        }}
                      >
                        <SelectValue placeholder={selProductName ? 'Selecciona color...' : 'Selecciona producto primero...'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Ninguno —</SelectItem>
                        {colorsForName.map(color => (
                          <SelectItem key={color} value={color}>
                            <span className="flex items-center gap-2">
                              <span style={getColorSwatch(color, 12)} />
                              {color}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 4: Talla selector with stock info */}
                <div className="space-y-1.5">
                  <Label
                    className="text-xs font-medium flex items-center gap-1"
                    style={{ color: ts.textSecondary }}
                  >
                    <Tag className="w-3 h-3" />
                    Talla
                  </Label>
                  <div
                    className="rounded-xl border overflow-hidden"
                    style={selectWrapperStyle}
                  >
                    <Select
                      value={selTalla || '__none__'}
                      onValueChange={v => handleTallaChange(v === '__none__' ? '' : v)}
                      disabled={!selColor}
                    >
                      <SelectTrigger
                        className="border-0 h-10 rounded-xl"
                        style={{
                          background: 'transparent',
                          color: ts.textPrimary,
                          opacity: selColor ? 1 : 0.5,
                        }}
                      >
                        <SelectValue placeholder={selColor ? 'Selecciona talla...' : 'Selecciona color primero...'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Ninguna —</SelectItem>
                        {tallasForColor.map(p => {
                          const sc = getStockColor(p.stock, p.minStock, ts)
                          return (
                            <SelectItem key={p.id} value={p.talla}>
                              <span className="flex items-center justify-between w-full gap-3">
                                <span>{p.talla}</span>
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                  style={{ background: sc.bg, color: sc.text }}
                                >
                                  {sc.label}
                                </span>
                              </span>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Stock & price info when talla selected */}
                {selectedProducto && (
                  <div
                    className="p-3 rounded-xl border space-y-3"
                    style={{
                      background: ts.accentLight,
                      borderColor: ts.selectorBorder,
                    }}
                  >
                    {/* Product summary */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div style={getColorSwatch(selectedProducto.color, 20)} />
                      <span className="font-semibold text-sm" style={{ color: ts.textPrimary }}>
                        {selectedProducto.name}
                      </span>
                      <span className="text-xs" style={{ color: ts.textMuted }}>
                        {selectedProducto.color} / {selectedProducto.talla}
                      </span>
                    </div>

                    {/* Stock badge */}
                    {(() => {
                      const sc = getStockColor(selectedProducto.stock, selectedProducto.minStock, ts)
                      return (
                        <div
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: sc.bg, color: sc.text }}
                        >
                          <Package className="w-3 h-3" />
                          {sc.label}
                        </div>
                      )
                    })()}

                    {/* Tipo precio toggle */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium" style={{ color: ts.textSecondary }}>
                        Tipo precio:
                      </Label>
                      <button
                        onClick={() => setTipoPrecio(tipoPrecio === 'minorista' ? 'mayorista' : 'minorista')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: tipoPrecio === 'mayorista' ? ts.accent : ts.selectorBg,
                          color: tipoPrecio === 'mayorista' ? '#fff' : ts.textSecondary,
                          border: `1px solid ${tipoPrecio === 'mayorista' ? 'transparent' : ts.selectorBorder}`,
                        }}
                      >
                        {tipoPrecio === 'minorista' ? (
                          <ToggleLeft className="w-4 h-4" />
                        ) : (
                          <ToggleRight className="w-4 h-4" />
                        )}
                        {tipoPrecio === 'minorista' ? 'Minorista' : 'Mayorista'}
                      </button>
                      <span className="text-[10px]" style={{ color: ts.textMuted }}>
                        {tipoPrecio === 'minorista'
                          ? fmt(selectedProducto.precio)
                          : fmt(selectedProducto.precioMayor || selectedProducto.precio)}
                      </span>
                    </div>

                    {/* Qty, price, comision, add button */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs" style={{ color: ts.textSecondary }}>Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          max={selectedProducto.stock}
                          value={cartQty}
                          onChange={e => setCartQty(e.target.value)}
                          className="rounded-xl h-9 border-0"
                          style={{ background: ts.inputBg, color: ts.textPrimary, borderColor: ts.inputBorder }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs" style={{ color: ts.textSecondary }}>Precio</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={cartPrecio}
                          onChange={e => setCartPrecio(e.target.value)}
                          className="rounded-xl h-9 border-0"
                          style={{ background: ts.inputBg, color: ts.textPrimary, borderColor: ts.inputBorder }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs" style={{ color: ts.textSecondary }}>Comisión %</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={comisionPct}
                          onChange={e => setComisionPct(e.target.value)}
                          className="rounded-xl h-9 border-0"
                          style={{ background: ts.inputBg, color: ts.textPrimary, borderColor: ts.inputBorder }}
                        />
                      </div>
                      <div>
                        <Button
                          onClick={addToCart}
                          className="w-full rounded-xl text-white font-semibold h-9"
                          style={{ background: ts.accent }}
                          disabled={!selectedProducto}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Agregar
                        </Button>
                      </div>
                    </div>

                    {/* Comisión amount display */}
                    {comisionPct && parseFloat(comisionPct) > 0 && (
                      <div
                        className="text-xs px-2 py-1 rounded-lg inline-flex items-center gap-1"
                        style={{ background: ts.accentLight, color: ts.tagText }}
                      >
                        <DollarSign className="w-3 h-3" />
                        Comisión: {fmt(cartTotal * ((parseFloat(comisionPct) || 0) / 100))} ({comisionPct}%)
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Right: Cart Panel ── */}
          <div className="lg:col-span-2">
            <Card
              className="rounded-2xl border-0 sticky top-20"
              style={{ background: ts.card, boxShadow: ts.shadow }}
            >
              <CardHeader className="pb-3">
                <CardTitle
                  className="text-base flex items-center gap-2"
                  style={{ color: ts.textPrimary }}
                >
                  <ShoppingCart className="w-4 h-4" style={{ color: ts.accentSolid }} />
                  Carrito
                  {cart.length > 0 && (
                    <Badge
                      className="text-[10px] font-bold"
                      style={{ background: ts.accentMedium, color: ts.tagText, border: 'none' }}
                    >
                      {cart.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart
                      className="w-10 h-10 mx-auto mb-2"
                      style={{ color: ts.textMuted, opacity: 0.3 }}
                    />
                    <p className="text-sm" style={{ color: ts.textMuted }}>
                      Carrito vacío
                    </p>
                    <p className="text-xs mt-1" style={{ color: ts.textMuted, opacity: 0.6 }}>
                      Selecciona un producto para agregar
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Cart items */}
                    <div
                      className="space-y-2 max-h-64 overflow-y-auto pr-1"
                      style={{ scrollbarWidth: 'thin' }}
                    >
                      {cart.map((item, i) => (
                        <div
                          key={`${item.productoId}-${item.precio}-${i}`}
                          className="flex items-center gap-2 p-2.5 rounded-xl border"
                          style={{
                            background: ts.cartItemBg,
                            borderColor: ts.cartItemBorder,
                          }}
                        >
                          {/* Color swatch */}
                          <div style={getColorSwatch(item.color, 18)} />
                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-xs font-semibold truncate"
                              style={{ color: ts.textPrimary }}
                            >
                              {item.productName}
                            </p>
                            <p className="text-[10px]" style={{ color: ts.textMuted }}>
                              {item.color} • {item.talla} • x{item.qty}
                            </p>
                          </div>
                          {/* Price + remove */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className="text-xs font-bold"
                              style={{ color: ts.successText }}
                            >
                              {fmt(item.subtotal)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => removeFromCart(i)}
                            >
                              <X className="w-3.5 h-3.5" style={{ color: ts.dangerText }} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator style={{ background: ts.border }} />

                    {/* Running total */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm" style={{ color: ts.textPrimary }}>
                        Total
                      </span>
                      <span className="text-xl font-bold" style={{ color: ts.successText }}>
                        {fmt(cartTotal)}
                      </span>
                    </div>

                    {/* Comisión display */}
                    {comisionPct && parseFloat(comisionPct) > 0 && (
                      <div
                        className="flex items-center justify-between text-xs px-3 py-2 rounded-xl"
                        style={{ background: ts.accentLight, color: ts.tagText }}
                      >
                        <span>Comisión ({comisionPct}%)</span>
                        <span className="font-semibold">{fmt(comisionMonto)}</span>
                      </div>
                    )}
                  </>
                )}

                <Separator style={{ background: ts.border }} />

                {/* Sale details form */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1" style={{ color: ts.textSecondary }}>
                      <User className="w-3 h-3" />
                      Cliente *
                    </Label>
                    <Input
                      value={cliente}
                      onChange={e => setCliente(e.target.value)}
                      placeholder="Nombre del cliente"
                      list="clientes-datalist"
                      className="rounded-xl h-9 border-0"
                      style={{ background: ts.inputBg, color: ts.textPrimary, borderColor: ts.inputBorder }}
                    />
                    <datalist id="clientes-datalist">
                      {clientes.map(c => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium" style={{ color: ts.textSecondary }}>
                        Vendedor
                      </Label>
                      <Input
                        value={vendedor}
                        onChange={e => setVendedor(e.target.value)}
                        placeholder="Nombre"
                        className="rounded-xl h-9 border-0"
                        style={{ background: ts.inputBg, color: ts.textPrimary, borderColor: ts.inputBorder }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium flex items-center gap-1" style={{ color: ts.textSecondary }}>
                        <Calendar className="w-3 h-3" />
                        Fecha
                      </Label>
                      <Input
                        type="date"
                        value={fecha}
                        onChange={e => setFecha(e.target.value)}
                        className="rounded-xl h-9 border-0"
                        style={{ background: ts.inputBg, color: ts.textPrimary, borderColor: ts.inputBorder }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1" style={{ color: ts.textSecondary }}>
                      <CreditCard className="w-3 h-3" />
                      Método de pago
                    </Label>
                    <div
                      className="rounded-xl border overflow-hidden"
                      style={selectWrapperStyle}
                    >
                      <Select value={metodoPago} onValueChange={setMetodoPago}>
                        <SelectTrigger
                          className="border-0 h-9 rounded-xl"
                          style={{ background: 'transparent', color: ts.textPrimary }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {METODOS_PAGO.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: ts.textSecondary }}>
                      Nota
                    </Label>
                    <Input
                      value={nota}
                      onChange={e => setNota(e.target.value)}
                      placeholder="Nota opcional..."
                      className="rounded-xl h-9 border-0"
                      style={{ background: ts.inputBg, color: ts.textPrimary, borderColor: ts.inputBorder }}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  onClick={handleCreateVenta}
                  disabled={saving || cart.length === 0}
                  className="w-full rounded-xl text-white font-bold h-11 text-sm"
                  style={{ background: ts.accent }}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-1.5" />
                      Registrar Venta ({fmt(cartTotal)})
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════════
            HISTORIAL VIEW
           ═══════════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: ts.textMuted }}
              />
              <Input
                placeholder="Buscar por cliente o vendedor..."
                value={searchVenta}
                onChange={e => setSearchVenta(e.target.value)}
                className="rounded-xl pl-9 border-0"
                style={{ background: ts.inputBg, color: ts.textPrimary, borderColor: ts.inputBorder }}
              />
            </div>
            <div
              className="rounded-xl border overflow-hidden sm:w-52"
              style={selectWrapperStyle}
            >
              <Select value={filterDropVenta} onValueChange={setFilterDropVenta}>
                <SelectTrigger
                  className="border-0 h-10 rounded-xl"
                  style={{ background: 'transparent', color: ts.textPrimary }}
                >
                  <SelectValue placeholder="Filtrar por drop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los drops</SelectItem>
                  {drops.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ventas list */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : ventas.length === 0 ? (
            <Card
              className="rounded-2xl border-0"
              style={{ background: ts.card, boxShadow: ts.shadow }}
            >
              <CardContent className="py-16 text-center">
                <Receipt
                  className="w-14 h-14 mx-auto mb-3"
                  style={{ color: ts.textMuted, opacity: 0.25 }}
                />
                <p className="font-medium" style={{ color: ts.textSecondary }}>
                  No hay ventas registradas
                </p>
                <p className="text-xs mt-1" style={{ color: ts.textMuted }}>
                  Las ventas aparecerán aquí al registrarlas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {groupedVentas.map(([groupId, groupVentas]) => {
                const main = groupVentas[0]
                const totalGroup = groupVentas.reduce((s, v) => s + v.total, 0)
                const allItems = groupVentas.flatMap(v => v.items || [])
                const isPedido = main.pedido?.id

                return (
                  <Card
                    key={groupId}
                    className="rounded-2xl border-0 transition-all"
                    style={{ background: ts.card, boxShadow: ts.shadow }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Header: cliente + badge */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-semibold text-sm"
                              style={{ color: ts.textPrimary }}
                            >
                              {main.cliente}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium"
                              style={{
                                borderColor: ts.border,
                                color: ts.tagText,
                                background: ts.tagBg,
                              }}
                            >
                              {main.metodoPago}
                            </Badge>
                            {isPedido && (
                              <Badge
                                className="text-[10px] font-medium"
                                style={{
                                  background: main.pedido?.status === 'entregado'
                                    ? ts.successBg
                                    : ts.warningBg,
                                  color: main.pedido?.status === 'entregado'
                                    ? ts.successText
                                    : ts.warningText,
                                  border: 'none',
                                }}
                              >
                                Pedido: {main.pedido?.status || 'pendiente'}
                              </Badge>
                            )}
                          </div>

                          {/* Meta: fecha + vendedor */}
                          <p className="text-xs mt-0.5" style={{ color: ts.textMuted }}>
                            {formatFecha(main.fecha)}
                            {main.vendedor && (
                              <span> · Vendedor: {main.vendedor}</span>
                            )}
                          </p>

                          {/* Items summary */}
                          {allItems.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {allItems.map((item, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-xs"
                                  style={{ color: ts.textSecondary }}
                                >
                                  <div style={getColorSwatch(item.color, 10)} />
                                  <span className="font-medium">{item.productName}</span>
                                  <span style={{ color: ts.textMuted }}>
                                    {item.color}/{item.talla}
                                  </span>
                                  <span style={{ color: ts.textMuted }}>
                                    x{item.qty}
                                  </span>
                                  <span className="font-semibold" style={{ color: ts.successText }}>
                                    {fmt(item.subtotal)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Nota */}
                          {main.nota && (
                            <p
                              className="text-xs mt-1.5 italic px-2 py-1 rounded-lg inline-block"
                              style={{ background: ts.accentLight, color: ts.textMuted }}
                            >
                              📝 {main.nota}
                            </p>
                          )}
                        </div>

                        {/* Right side: total + actions */}
                        <div className="text-right shrink-0 space-y-1">
                          <p
                            className="text-lg font-bold"
                            style={{ color: ts.successText }}
                          >
                            {fmt(totalGroup)}
                          </p>
                          {main.comisionMonto > 0 && (
                            <p className="text-[10px]" style={{ color: ts.textMuted }}>
                              Comisión: {fmt(main.comisionMonto)} ({main.comisionPct}%)
                            </p>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-1 justify-end pt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs rounded-lg px-2"
                              style={{ color: ts.accentSolid }}
                              onClick={() => openEditDialog(main)}
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Editar
                            </Button>

                            {deleteConfirm === main.id ? (
                              <div className="flex gap-1">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-7 text-[10px] rounded-lg px-2"
                                  onClick={() => handleDeleteVenta(main.id)}
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px] rounded-lg px-2"
                                  onClick={() => setDeleteConfirm(null)}
                                >
                                  No
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs rounded-lg px-2"
                                style={{ color: ts.dangerText }}
                                onClick={() => setDeleteConfirm(main.id)}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Edit Venta Dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          className="rounded-2xl"
          style={{ background: ts.card, borderColor: ts.border, color: ts.textPrimary }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: ts.textPrimary }}>
              Editar Venta
            </DialogTitle>
            <DialogDescription style={{ color: ts.textMuted }}>
              Modifica el método de pago, vendedor o nota de esta venta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={{ color: ts.textSecondary }}>
                Método de pago
              </Label>
              <div
                className="rounded-xl border overflow-hidden"
                style={selectWrapperStyle}
              >
                <Select value={editMetodoPago} onValueChange={setEditMetodoPago}>
                  <SelectTrigger
                    className="border-0 h-9 rounded-xl"
                    style={{ background: 'transparent', color: ts.textPrimary }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METODOS_PAGO.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={{ color: ts.textSecondary }}>
                Vendedor
              </Label>
              <Input
                value={editVendedor}
                onChange={e => setEditVendedor(e.target.value)}
                placeholder="Nombre del vendedor"
                className="rounded-xl h-9 border-0"
                style={{ background: ts.inputBg, color: ts.textPrimary, borderColor: ts.inputBorder }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={{ color: ts.textSecondary }}>
                Nota
              </Label>
              <Input
                value={editNota}
                onChange={e => setEditNota(e.target.value)}
                placeholder="Nota opcional..."
                className="rounded-xl h-9 border-0"
                style={{ background: ts.inputBg, color: ts.textPrimary, borderColor: ts.inputBorder }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              style={{ borderColor: ts.border, color: ts.textSecondary }}
              onClick={() => setEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-xl text-white font-semibold"
              style={{ background: ts.accent }}
              onClick={handleEditVenta}
              disabled={editSaving}
            >
              {editSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
