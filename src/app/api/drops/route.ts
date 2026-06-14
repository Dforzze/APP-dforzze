import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// GET /api/drops — List all drops for the business with counts
export async function GET() {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const drops = await db.drop.findMany({
      where: { businessId },
      include: {
        _count: { select: { productos: true } },
        productos: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    // For each drop, calculate ventas count and totalVentas
    const dropsWithStats = await Promise.all(
      drops.map(async (drop) => {
        const ventas = await db.venta.findMany({
          where: { businessId, dropId: drop.id },
          select: { total: true },
        })
        const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0)

        return {
          id: drop.id,
          name: drop.name,
          desc: drop.desc,
          date: drop.date,
          status: drop.status,
          businessId: drop.businessId,
          createdAt: drop.createdAt,
          productosCount: drop._count.productos,
          ventasCount: ventas.length,
          totalVentas,
        }
      })
    )

    return NextResponse.json(dropsWithStats)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al obtener drops" },
      { status: 500 }
    )
  }
}

// POST /api/drops — Create a new drop
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const body = await req.json()
    const { name, desc, date, status } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      )
    }

    const drop = await db.drop.create({
      data: {
        name: name.trim(),
        desc: desc || "",
        date: date || "",
        status: status || "activo",
        businessId,
      },
    })

    return NextResponse.json(drop, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al crear drop" },
      { status: 500 }
    )
  }
}
