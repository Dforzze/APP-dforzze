import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// GET /api/dashboard — Return dashboard statistics for the business
export async function GET() {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    // Parallel queries for performance
    const [
      productos,
      ventas,
      gastos,
      recentVentas,
      ventaItems,
      business,
    ] = await Promise.all([
      // All productos
      db.producto.findMany({
        where: { businessId },
        select: {
          id: true,
          name: true,
          stock: true,
          minStock: true,
          costo: true,
          precio: true,
          color: true,
          talla: true,
          dropId: true,
        },
      }),

      // All ventas (with fecha for period calculations)
      db.venta.findMany({
        where: { businessId },
        select: {
          id: true,
          total: true,
          comisionMonto: true,
          cliente: true,
          metodoPago: true,
          fecha: true,
          createdAt: true,
          items: {
            select: { qty: true, subtotal: true },
          },
        },
      }),

      // All gastos grouped by tipo
      db.gasto.findMany({
        where: { businessId },
        select: { tipo: true, monto: true, fecha: true },
      }),

      // Recent 5 ventas
      db.venta.findMany({
        where: { businessId },
        include: {
          items: {
            include: {
              producto: { select: { id: true, name: true, color: true, talla: true } },
            },
          },
          pedido: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // All venta items for top products/colors/tallas
      db.ventaItem.findMany({
        where: {
          venta: { businessId },
        },
        select: {
          productName: true,
          color: true,
          talla: true,
          qty: true,
          subtotal: true,
        },
      }),

      // Business for cajaManual
      db.business.findUnique({
        where: { id: businessId },
        select: { cajaManual: true },
      }),
    ])

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // === PRODUCT STATS ===
    const totalProducts = productos.length
    const totalStockValue = productos.reduce(
      (sum, p) => sum + p.stock * p.costo,
      0
    )
    const lowStockAlerts = productos.filter(
      (p) => p.stock > 0 && p.stock <= p.minStock
    ).length
    const outOfStock = productos.filter((p) => p.stock === 0).length

    // Low stock products list
    const lowStockProducts = productos
      .filter(p => p.stock > 0 && p.stock <= p.minStock)
      .slice(0, 5)
      .map(p => ({ name: p.name, color: p.color, talla: p.talla, stock: p.stock, minStock: p.minStock }))

    const outOfStockProducts = productos
      .filter(p => p.stock === 0)
      .slice(0, 5)
      .map(p => ({ name: p.name, color: p.color, talla: p.talla }))

    // === VENTA STATS ===
    const totalVentas = ventas.length
    const totalRevenue = ventas.reduce((sum, v) => sum + v.total, 0)
    const totalComisiones = ventas.reduce((sum, v) => sum + v.comisionMonto, 0)

    // === PERIOD SUMMARIES ===
    // This week (since Sunday)
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const ventasSemana = ventas.filter(v => new Date(v.fecha || v.createdAt) >= weekStart)
    const totalSemana = ventasSemana.reduce((s, v) => s + v.total, 0)
    const qtySemana = ventasSemana.reduce((s, v) => s + v.items.reduce((si, i) => si + i.qty, 0), 0)

    const ventasMes = ventas.filter(v => new Date(v.fecha || v.createdAt) >= monthStart)
    const totalMes = ventasMes.reduce((s, v) => s + v.total, 0)
    const qtyMes = ventasMes.reduce((s, v) => s + v.items.reduce((si, i) => si + i.qty, 0), 0)

    const ventasMesPasado = ventas.filter(v => {
      const d = new Date(v.fecha || v.createdAt)
      return d >= lastMonthStart && d <= lastMonthEnd
    })
    const totalMesPasado = ventasMesPasado.reduce((s, v) => s + v.total, 0)

    const growth = totalMesPasado > 0
      ? (((totalMes - totalMesPasado) / totalMesPasado) * 100)
      : (totalMes > 0 ? 100 : 0)

    // === GASTO STATS ===
    const totalGastos = gastos
      .filter((g) => g.tipo === "gasto")
      .reduce((sum, g) => sum + g.monto, 0)
    const totalInversiones = gastos
      .filter((g) => g.tipo === "inversion")
      .reduce((sum, g) => sum + g.monto, 0)
    const totalRetiros = gastos
      .filter((g) => g.tipo === "retiro")
      .reduce((sum, g) => sum + g.monto, 0)

    const gastosMes = gastos
      .filter(g => new Date(g.fecha) >= monthStart && g.tipo === "gasto")
      .reduce((s, g) => s + g.monto, 0)

    const retirosMes = gastos
      .filter(g => new Date(g.fecha) >= monthStart && g.tipo === "retiro")
      .reduce((s, g) => s + g.monto, 0)

    // === CASH & ROI ===
    const cajaManual = business?.cajaManual || 0
    const cashAvailable = cajaManual > 0
      ? cajaManual - totalRetiros // caja manual - retiros
      : totalRevenue - totalGastos - totalInversiones - totalRetiros // auto: ventas - gastos - inversiones - retiros
    const totalExpenses = totalGastos + totalInversiones + totalRetiros
    const roi =
      totalExpenses > 0
        ? ((totalRevenue - totalExpenses) / totalExpenses) * 100
        : 0

    // === TOP PRODUCTS ===
    const productSalesMap = new Map<
      string,
      { name: string; qty: number; revenue: number }
    >()
    for (const item of ventaItems) {
      const existing = productSalesMap.get(item.productName) || {
        name: item.productName,
        qty: 0,
        revenue: 0,
      }
      existing.qty += item.qty
      existing.revenue += item.subtotal
      productSalesMap.set(item.productName, existing)
    }
    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // === TOP COLORS ===
    const colorSalesMap = new Map<string, { color: string; qty: number; revenue: number }>()
    for (const item of ventaItems) {
      if (!item.color) continue
      const existing = colorSalesMap.get(item.color) || {
        color: item.color,
        qty: 0,
        revenue: 0,
      }
      existing.qty += item.qty
      existing.revenue += item.subtotal
      colorSalesMap.set(item.color, existing)
    }
    const topColors = Array.from(colorSalesMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)

    // === TOP TALLAS ===
    const tallaSalesMap = new Map<string, { talla: string; qty: number; revenue: number }>()
    for (const item of ventaItems) {
      if (!item.talla) continue
      const existing = tallaSalesMap.get(item.talla) || {
        talla: item.talla,
        qty: 0,
        revenue: 0,
      }
      existing.qty += item.qty
      existing.revenue += item.subtotal
      tallaSalesMap.set(item.talla, existing)
    }
    const topTallas = Array.from(tallaSalesMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)

    return NextResponse.json({
      productos: {
        total: totalProducts,
        stockValue: totalStockValue,
        lowStock: lowStockAlerts,
        outOfStock,
        lowStockProducts,
        outOfStockProducts,
      },
      ventas: {
        total: totalVentas,
        revenue: totalRevenue,
        comisiones: totalComisiones,
      },
      gastos: {
        gastos: totalGastos,
        inversiones: totalInversiones,
        retiros: totalRetiros,
      },
      caja: cashAvailable,
      cajaManual,
      roi,
      recentVentas,
      topProducts,
      topColors,
      topTallas,
      period: {
        semana: { total: totalSemana, qty: qtySemana },
        mes: { total: totalMes, qty: qtyMes, gastos: gastosMes, retiros: retirosMes },
        mesPasado: { total: totalMesPasado },
        growth,
        margenMensual: totalMes - gastosMes - retirosMes,
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    console.error("Error fetching dashboard:", error)
    return NextResponse.json(
      { error: "Error al obtener dashboard" },
      { status: 500 }
    )
  }
}
