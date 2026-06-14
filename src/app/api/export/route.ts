import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// GET /api/export — Export all business data as JSON (for backup/download)
export async function GET() {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const [drops, productos, ventas, pedidos, clientes, gastos, business] =
      await Promise.all([
        db.drop.findMany({ where: { businessId }, orderBy: { createdAt: "asc" } }),
        db.producto.findMany({ where: { businessId }, orderBy: { createdAt: "asc" } }),
        db.venta.findMany({
          where: { businessId },
          include: { items: true },
          orderBy: { createdAt: "desc" },
        }),
        db.pedido.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
        db.cliente.findMany({ where: { businessId }, orderBy: { createdAt: "asc" } }),
        db.gasto.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
        db.business.findUnique({
          where: { id: businessId },
          select: { name: true, cajaManual: true },
        }),
      ])

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      business: business?.name || "",
      cajaManual: business?.cajaManual || 0,
      drops,
      productos,
      ventas,
      pedidos,
      clientes,
      gastos,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al exportar datos" },
      { status: 500 }
    )
  }
}
