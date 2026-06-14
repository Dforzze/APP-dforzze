import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// GET /api/analytics — Return analytics data for the business
export async function GET() {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    // Fetch all required data in parallel
    const [ventas, ventaItems, gastos, drops, productos] = await Promise.all([
      db.venta.findMany({
        where: { businessId },
        select: {
          id: true,
          cliente: true,
          vendedor: true,
          total: true,
          comisionPct: true,
          comisionMonto: true,
          fecha: true,
          dropId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),

      db.ventaItem.findMany({
        where: { venta: { businessId } },
        select: {
          productName: true,
          color: true,
          talla: true,
          qty: true,
          precio: true,
          subtotal: true,
          venta: { select: { fecha: true, createdAt: true } },
          producto: { select: { costo: true } },
        },
      }),

      db.gasto.findMany({
        where: { businessId },
        select: { tipo: true, monto: true, dropId: true, fecha: true },
      }),

      db.drop.findMany({
        where: { businessId },
        select: { id: true, name: true },
      }),

      db.producto.findMany({
        where: { businessId },
        select: { id: true, name: true, costo: true, precio: true },
      }),
    ])

    const dropMap = new Map(drops.map((d) => [d.id, d.name]))
    const productoCostMap = new Map(productos.map((p) => [p.name, p.costo]))

    // ── SALES BY COLOR ──
    const colorMap = new Map<string, { color: string; qty: number; revenue: number }>()
    for (const item of ventaItems) {
      if (!item.color) continue
      const existing = colorMap.get(item.color) || { color: item.color, qty: 0, revenue: 0 }
      existing.qty += item.qty
      existing.revenue += item.subtotal
      colorMap.set(item.color, existing)
    }
    const salesByColor = Array.from(colorMap.values()).sort((a, b) => b.revenue - a.revenue)

    // ── SALES BY TALLA ──
    const tallaMap = new Map<string, { talla: string; qty: number; revenue: number }>()
    for (const item of ventaItems) {
      if (!item.talla) continue
      const existing = tallaMap.get(item.talla) || { talla: item.talla, qty: 0, revenue: 0 }
      existing.qty += item.qty
      existing.revenue += item.subtotal
      tallaMap.set(item.talla, existing)
    }
    const salesByTalla = Array.from(tallaMap.values()).sort((a, b) => b.revenue - a.revenue)

    // ── SALES BY PRODUCT ──
    const productMap = new Map<string, { name: string; qty: number; revenue: number }>()
    for (const item of ventaItems) {
      const existing = productMap.get(item.productName) || { name: item.productName, qty: 0, revenue: 0 }
      existing.qty += item.qty
      existing.revenue += item.subtotal
      productMap.set(item.productName, existing)
    }
    const salesByProduct = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue)

    // ── SALES BY MONTH (last 6 months) ──
    const monthMap = new Map<string, { month: string; revenue: number; count: number }>()
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      monthMap.set(key, { month: key, revenue: 0, count: 0 })
    }
    for (const venta of ventas) {
      const ventaDate = venta.fecha || venta.createdAt.toISOString().split("T")[0]
      const key = ventaDate.substring(0, 7) // YYYY-MM
      const existing = monthMap.get(key)
      if (existing) {
        existing.revenue += venta.total
        existing.count += 1
      }
    }
    const salesByMonth = Array.from(monthMap.values())

    // ── SALES BY DAY OF WEEK ──
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    const dayMap = new Map<string, { day: string; revenue: number; count: number }>()
    for (const day of dayNames) {
      dayMap.set(day, { day, revenue: 0, count: 0 })
    }
    for (const venta of ventas) {
      const ventaDate = new Date(venta.fecha || venta.createdAt)
      const dayName = dayNames[ventaDate.getDay()]
      const existing = dayMap.get(dayName)!
      existing.revenue += venta.total
      existing.count += 1
    }
    const salesByDayOfWeek = Array.from(dayMap.values())

    // ── INCOME VS EXPENSES BY DROP ──
    const dropFinanceMap = new Map<string, { dropName: string; income: number; expenses: number; inversiones: number }>()
    // Initialize all drops
    for (const drop of drops) {
      dropFinanceMap.set(drop.id, { dropName: drop.name, income: 0, expenses: 0, inversiones: 0 })
    }
    // Add "Sin drop" entry
    dropFinanceMap.set("none", { dropName: "Sin drop", income: 0, expenses: 0, inversiones: 0 })

    for (const venta of ventas) {
      const key = venta.dropId || "none"
      const existing = dropFinanceMap.get(key)
      if (existing) {
        existing.income += venta.total
      }
    }
    for (const gasto of gastos) {
      const key = gasto.dropId || "none"
      const existing = dropFinanceMap.get(key)
      if (existing) {
        if (gasto.tipo === "gasto") existing.expenses += gasto.monto
        if (gasto.tipo === "inversion") existing.inversiones += gasto.monto
      }
    }
    const incomeVsExpensesByDrop = Array.from(dropFinanceMap.values())

    // ── MARGIN BY PRODUCT ──
    const marginMap = new Map<string, { name: string; revenue: number; cost: number; margin: number; marginPct: number }>()
    for (const item of ventaItems) {
      const cost = productoCostMap.get(item.productName) || 0
      const totalCost = cost * item.qty
      const existing = marginMap.get(item.productName) || {
        name: item.productName,
        revenue: 0,
        cost: 0,
        margin: 0,
        marginPct: 0,
      }
      existing.revenue += item.subtotal
      existing.cost += totalCost
      existing.margin = existing.revenue - existing.cost
      existing.marginPct = existing.revenue > 0 ? (existing.margin / existing.revenue) * 100 : 0
      marginMap.set(item.productName, existing)
    }
    const marginByProduct = Array.from(marginMap.values())
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 20)

    // ── TOP CLIENTS RANKING ──
    const clientMap = new Map<string, { name: string; totalSpent: number; purchaseCount: number }>()
    for (const venta of ventas) {
      const existing = clientMap.get(venta.cliente) || {
        name: venta.cliente,
        totalSpent: 0,
        purchaseCount: 0,
      }
      existing.totalSpent += venta.total
      existing.purchaseCount += 1
      clientMap.set(venta.cliente, existing)
    }
    const topClients = Array.from(clientMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    // ── SELLER COMMISSIONS ──
    const sellerMap = new Map<string, { seller: string; totalSales: number; totalRevenue: number; commission: number }>()
    for (const venta of ventas) {
      if (!venta.vendedor) continue
      const existing = sellerMap.get(venta.vendedor) || {
        seller: venta.vendedor,
        totalSales: 0,
        totalRevenue: 0,
        commission: 0,
      }
      existing.totalSales += 1
      existing.totalRevenue += venta.total
      existing.commission += venta.comisionMonto
      sellerMap.set(venta.vendedor, existing)
    }
    const sellerCommissions = Array.from(sellerMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    )

    // ── SALES PREDICTIONS (Simple Moving Average) ──
    // Use last 3 months of data to predict next month
    const monthValues = salesByMonth.map((m) => m.revenue)
    let prediction = 0
    if (monthValues.length >= 2) {
      // Use last 3 months (or however many we have) for moving average
      const lastN = monthValues.slice(-3)
      prediction = lastN.reduce((a, b) => a + b, 0) / lastN.length
    } else if (monthValues.length === 1) {
      prediction = monthValues[0]
    }

    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const nextMonthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`

    return NextResponse.json({
      salesByColor,
      salesByTalla,
      salesByProduct,
      salesByMonth,
      salesByDayOfWeek,
      incomeVsExpensesByDrop,
      marginByProduct,
      topClients,
      sellerCommissions,
      prediction: {
        month: nextMonthKey,
        estimatedRevenue: Math.round(prediction * 100) / 100,
        method: "simple_moving_average",
        dataPoints: Math.min(monthValues.length, 3),
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Error al obtener analíticas" },
      { status: 500 }
    )
  }
}
