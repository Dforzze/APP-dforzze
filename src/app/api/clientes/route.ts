import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// GET /api/clientes — List all clientes for business with purchase stats
export async function GET() {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const clientes = await db.cliente.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    })

    // Get purchase stats for each client
    const clientesWithStats = await Promise.all(
      clientes.map(async (cliente) => {
        const ventas = await db.venta.findMany({
          where: { businessId, cliente: cliente.name },
          select: { total: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        })

        const ventasCount = ventas.length
        const totalSpent = ventas.reduce((sum, v) => sum + v.total, 0)
        const lastVentaDate = ventas.length > 0 ? ventas[0].createdAt : null

        return {
          ...cliente,
          ventasCount,
          totalSpent,
          lastVentaDate,
        }
      })
    )

    return NextResponse.json(clientesWithStats)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 }
    )
  }
}

// POST /api/clientes — Create a new cliente
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const body = await req.json()
    const { name, phone, notes } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      )
    }

    // Check if client with same name already exists for this business
    const existing = await db.cliente.findFirst({
      where: { name: name.trim(), businessId },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un cliente con ese nombre" },
        { status: 409 }
      )
    }

    const cliente = await db.cliente.create({
      data: {
        name: name.trim(),
        phone: phone || "",
        notes: notes || "",
        businessId,
      },
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al crear cliente" },
      { status: 500 }
    )
  }
}
