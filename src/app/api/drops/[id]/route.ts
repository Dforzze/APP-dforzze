import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// PUT /api/drops/[id] — Update a drop
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const { id } = await params

    const existing = await db.drop.findFirst({
      where: { id, businessId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Drop no encontrado" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { name, desc, date, status } = body

    const drop = await db.drop.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(desc !== undefined && { desc }),
        ...(date !== undefined && { date }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json(drop)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al actualizar drop" },
      { status: 500 }
    )
  }
}

// DELETE /api/drops/[id] — Delete a drop
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const { id } = await params

    const existing = await db.drop.findFirst({
      where: { id, businessId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Drop no encontrado" },
        { status: 404 }
      )
    }

    await db.drop.delete({ where: { id } })

    return NextResponse.json({ message: "Drop eliminado" })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al eliminar drop" },
      { status: 500 }
    )
  }
}
