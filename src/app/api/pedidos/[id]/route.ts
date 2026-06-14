import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

const VALID_STATUSES = ["pendiente", "confirmado", "enviado", "entregado", "cancelado"]

// PUT /api/pedidos/[id] — Update pedido status
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const { id } = await params

    const existing = await db.pedido.findFirst({
      where: { id, businessId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { status } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Estado inválido. Estados válidos: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      )
    }

    const pedido = await db.pedido.update({
      where: { id },
      data: { status },
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
    })

    return NextResponse.json(pedido)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al actualizar pedido" },
      { status: 500 }
    )
  }
}
