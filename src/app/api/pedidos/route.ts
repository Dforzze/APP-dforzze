import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// GET /api/pedidos — List all pedidos for business with optional filters
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const dropId = searchParams.get("dropId")

    const where: Record<string, unknown> = { businessId }

    if (status) {
      where.status = status
    }

    if (dropId) {
      where.venta = { dropId }
    }

    if (search) {
      where.venta = {
        ...(where.venta as Record<string, unknown>),
        OR: [
          { cliente: { contains: search, mode: "insensitive" } },
          { vendedor: { contains: search, mode: "insensitive" } },
        ],
      }
    }

    const pedidos = await db.pedido.findMany({
      where,
      include: {
        venta: {
          include: {
            items: {
              include: {
                producto: { select: { id: true, name: true, color: true, talla: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(pedidos)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al obtener pedidos" },
      { status: 500 }
    )
  }
}
