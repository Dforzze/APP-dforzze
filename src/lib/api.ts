// API Helper for Dforzze
// All functions handle fetch + auth + error handling

const BASE = '/api'

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Error de conexión' }))
    throw new Error(error.error || `Error ${res.status}`)
  }
  return res.json()
}

function buildQuery(filters?: Record<string, string | undefined>): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, v)
  })
  const s = params.toString()
  return s ? `?${s}` : ''
}

// Type definitions
export interface DashboardData {
  productos: {
    total: number
    stockValue: number
    lowStock: number
    outOfStock: number
    lowStockProducts: { name: string; color: string; talla: string; stock: number; minStock: number }[]
    outOfStockProducts: { name: string; color: string; talla: string }[]
  }
  ventas: { total: number; revenue: number; comisiones: number }
  gastos: { gastos: number; inversiones: number; retiros: number }
  caja: number
  cajaManual: number
  roi: number
  recentVentas: any[]
  topProducts: any[]
  topColors: any[]
  topTallas: any[]
  period: {
    semana: { total: number; qty: number }
    mes: { total: number; qty: number; gastos: number; retiros: number }
    mesPasado: { total: number }
    growth: number
    margenMensual: number
  }
}

export interface Drop {
  id: string
  name: string
  desc: string
  date: string
  status: string
  businessId: string
  createdAt: string
  productosCount?: number
  ventasCount?: number
  totalVentas?: number
}

export interface Producto {
  id: string
  name: string
  dropId: string | null
  color: string
  talla: string
  stock: number
  precio: number
  precioMayor: number
  costo: number
  minStock: number
  businessId: string
  createdAt: string
  drop?: { id: string; name: string }
}

export interface Venta {
  id: string
  cliente: string
  vendedor: string
  fecha: string
  dropId: string | null
  metodoPago: string
  nota: string
  total: number
  comisionPct: number
  comisionMonto: number
  businessId: string
  createdAt: string
  items: VentaItem[]
  pedido?: Pedido
}

export interface VentaItem {
  id: string
  ventaId: string
  productoId: string
  productName: string
  color: string
  talla: string
  qty: number
  precio: number
  subtotal: number
}

export interface Pedido {
  id: string
  ventaId: string
  status: string
  businessId: string
  createdAt: string
  updatedAt: string
  venta?: Venta
}

export interface Cliente {
  id: string
  name: string
  phone: string
  notes: string
  businessId: string
  createdAt: string
  ventasCount?: number
  totalSpent?: number
  lastVentaDate?: string | null
}

export interface Gasto {
  id: string
  tipo: string
  desc: string
  categoria: string
  dropId: string | null
  monto: number
  fecha: string
  businessId: string
  createdAt: string
  drop?: Drop
}

export interface AnalyticsData {
  salesByColor: any[]
  salesByTalla: any[]
  salesByProduct: any[]
  salesByMonth: any[]
  salesByDayOfWeek: any[]
  incomeVsExpensesByDrop: any[]
  marginByProduct: any[]
  topClients: any[]
  sellerCommissions: any[]
  prediction: any
}

export interface BusinessInfo {
  id: string
  name: string
  slug: string
  plan: string
  cajaManual: number
}

export const api = {
  dashboard: {
    get: () => fetchAPI<DashboardData>('/dashboard'),
  },
  business: {
    get: () => fetchAPI<BusinessInfo>('/business'),
    update: (data: { cajaManual?: number }) =>
      fetchAPI<BusinessInfo>('/business', { method: 'PUT', body: JSON.stringify(data) }),
  },
  drops: {
    list: () => fetchAPI<Drop[]>('/drops'),
    create: (data: Partial<Drop>) =>
      fetchAPI<Drop>('/drops', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Drop>) =>
      fetchAPI<Drop>(`/drops/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchAPI<void>(`/drops/${id}`, { method: 'DELETE' }),
  },
  productos: {
    list: (filters?: Record<string, string | undefined>) =>
      fetchAPI<Producto[]>(`/productos${buildQuery(filters)}`),
    create: (data: Partial<Producto>) =>
      fetchAPI<Producto>('/productos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Producto> & { stockAdjust?: string }) =>
      fetchAPI<Producto>(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchAPI<void>(`/productos/${id}`, { method: 'DELETE' }),
  },
  ventas: {
    list: (filters?: Record<string, string | undefined>) =>
      fetchAPI<Venta[]>(`/ventas${buildQuery(filters)}`),
    create: (data: any) =>
      fetchAPI<Venta>('/ventas', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { cliente?: string; vendedor?: string; metodoPago?: string; nota?: string }) =>
      fetchAPI<Venta>(`/ventas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchAPI<void>(`/ventas/${id}`, { method: 'DELETE' }),
  },
  pedidos: {
    list: (filters?: Record<string, string | undefined>) =>
      fetchAPI<Pedido[]>(`/pedidos${buildQuery(filters)}`),
    update: (id: string, data: Partial<Pedido>) =>
      fetchAPI<Pedido>(`/pedidos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  clientes: {
    list: () => fetchAPI<Cliente[]>('/clientes'),
    create: (data: Partial<Cliente>) =>
      fetchAPI<Cliente>('/clientes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Cliente>) =>
      fetchAPI<Cliente>(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchAPI<void>(`/clientes/${id}`, { method: 'DELETE' }),
    merge: (keepId: string, removeIds: string[]) =>
      fetchAPI<Cliente>('/clientes/merge', { method: 'POST', body: JSON.stringify({ keepId, removeIds }) }),
  },
  gastos: {
    list: (filters?: Record<string, string | undefined>) =>
      fetchAPI<Gasto[]>(`/gastos${buildQuery(filters)}`),
    create: (data: Partial<Gasto>) =>
      fetchAPI<Gasto>('/gastos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Gasto>) =>
      fetchAPI<Gasto>(`/gastos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchAPI<void>(`/gastos/${id}`, { method: 'DELETE' }),
  },
  analytics: {
    get: () => fetchAPI<AnalyticsData>('/analytics'),
  },
  import: {
    data: (data: Record<string, any[]>) =>
      fetchAPI<{ message: string; results: any; total: number }>('/import', { method: 'POST', body: JSON.stringify(data) }),
  },
  export: {
    json: () => fetchAPI<Record<string, any>>('/export'),
  },
}
