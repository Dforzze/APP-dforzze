import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"
import { logHistorial } from "@/lib/historial"

// PUT /api/clientes/[id] — Update a cliente
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const { id } = await params

    const existing = await db.cliente.findFirst({
      where: { id, businessId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { name, phone, notes } = body

    const cliente = await db.cliente.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone }),
        ...(notes !== undefined && { notes }),
      },
    })

    const userName = (session.user as { name?: string }).name || ""
    logHistorial({
      accion: "editar",
      entidad: "cliente",
      entidadId: id,
      descripcion: `Cliente "${cliente.name}" editado`,
      usuario: userName,
      businessId,
    })

    return NextResponse.json(cliente)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al actualizar cliente" },
      { status: 500 }
    )
  }
}

// DELETE /api/clientes/[id] — Delete a cliente
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const { id } = await params

    const existing = await db.cliente.findFirst({
      where: { id, businessId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    await db.cliente.delete({ where: { id } })

    const userName = (session.user as { name?: string }).name || ""
    logHistorial({
      accion: "eliminar",
      entidad: "cliente",
      entidadId: id,
      descripcion: `Cliente "${existing.name}" eliminado`,
      usuario: userName,
      businessId,
    })

    return NextResponse.json({ message: "Cliente eliminado" })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al eliminar cliente" },
      { status: 500 }
    )
  }
}
