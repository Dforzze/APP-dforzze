import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// PUT /api/gastos/[id] — Update a gasto
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const { id } = await params

    const existing = await db.gasto.findFirst({
      where: { id, businessId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Gasto no encontrado" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { tipo, desc, categoria, dropId, monto, fecha } = body

    if (tipo && !["gasto", "inversion", "retiro"].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo inválido. Debe ser: gasto, inversion o retiro" },
        { status: 400 }
      )
    }

    const gasto = await db.gasto.update({
      where: { id },
      data: {
        ...(tipo !== undefined && { tipo }),
        ...(desc !== undefined && { desc: desc.trim() }),
        ...(categoria !== undefined && { categoria }),
        ...(dropId !== undefined && { dropId: dropId || null }),
        ...(monto !== undefined && { monto }),
        ...(fecha !== undefined && { fecha }),
      },
      include: {
        drop: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(gasto)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al actualizar gasto" },
      { status: 500 }
    )
  }
}

// DELETE /api/gastos/[id] — Delete a gasto
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const { id } = await params

    const existing = await db.gasto.findFirst({
      where: { id, businessId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Gasto no encontrado" },
        { status: 404 }
      )
    }

    await db.gasto.delete({ where: { id } })

    return NextResponse.json({ message: "Gasto eliminado" })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al eliminar gasto" },
      { status: 500 }
    )
  }
}
