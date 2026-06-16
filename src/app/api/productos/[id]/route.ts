import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"
import { logHistorial } from "@/lib/historial"

// PUT /api/productos/[id] — Update a producto (including stock updates with +/-)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const { id } = await params

    const existing = await db.producto.findFirst({
      where: { id, businessId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const {
      name,
      dropId,
      color,
      talla,
      stock,
      precio,
      precioMayor,
      costo,
      minStock,
      stockAdjust, // "+5" or "-3" for relative adjustments
    } = body

    let newStock = existing.stock
    if (stockAdjust !== undefined) {
      const adjust = parseInt(stockAdjust, 10)
      if (!isNaN(adjust)) {
        newStock = Math.max(0, existing.stock + adjust)
      }
    } else if (typeof stock === "number") {
      newStock = Math.max(0, stock)
    }

    const producto = await db.producto.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(dropId !== undefined && { dropId: dropId || null }),
        ...(color !== undefined && { color }),
        ...(talla !== undefined && { talla }),
        ...(stock !== undefined && stockAdjust === undefined && { stock: newStock }),
        ...(stockAdjust !== undefined && { stock: newStock }),
        ...(precio !== undefined && { precio }),
        ...(precioMayor !== undefined && { precioMayor }),
        ...(costo !== undefined && { costo }),
        ...(minStock !== undefined && { minStock }),
      },
      include: {
        drop: { select: { id: true, name: true } },
      },
    })

    const userName = (session.user as { name?: string }).name || ""
    const stockMsg = stockAdjust !== undefined
      ? ` (stock: ${existing.stock} → ${newStock})`
      : typeof stock === "number" ? ` (stock actualizado: ${newStock})` : ""
    logHistorial({
      accion: "editar",
      entidad: "producto",
      entidadId: id,
      descripcion: `Producto "${producto.name}" editado${stockMsg}`,
      usuario: userName,
      businessId,
    })

    return NextResponse.json(producto)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 }
    )
  }
}

// DELETE /api/productos/[id] — Delete a producto
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const { id } = await params

    const existing = await db.producto.findFirst({
      where: { id, businessId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    await db.producto.delete({ where: { id } })

    const userName = (session.user as { name?: string }).name || ""
    logHistorial({
      accion: "eliminar",
      entidad: "producto",
      entidadId: id,
      descripcion: `Producto "${existing.name}" ${existing.color} ${existing.talla} eliminado`,
      usuario: userName,
      businessId,
    })

    return NextResponse.json({ message: "Producto eliminado" })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 }
    )
  }
}
