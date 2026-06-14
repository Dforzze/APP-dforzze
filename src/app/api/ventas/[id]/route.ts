import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// PUT /api/ventas/[id] — Update a venta's metadata (cliente, vendedor, metodoPago, nota)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const { id } = await params

    const existing = await db.venta.findFirst({
      where: { id, businessId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { cliente, vendedor, metodoPago, nota } = body

    const data: Record<string, unknown> = {}
    if (cliente !== undefined) data.cliente = cliente.trim()
    if (vendedor !== undefined) data.vendedor = vendedor.trim()
    if (metodoPago !== undefined) data.metodoPago = metodoPago
    if (nota !== undefined) data.nota = nota.trim()

    // If cliente changed, auto-create if doesn't exist
    if (cliente && cliente.trim() !== existing.cliente) {
      const exists = await db.cliente.findFirst({
        where: { name: cliente.trim(), businessId },
      })
      if (!exists) {
        await db.cliente.create({
          data: { name: cliente.trim(), businessId },
        })
      }
    }

    const venta = await db.venta.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            producto: { select: { id: true, name: true, color: true, talla: true } },
          },
        },
        pedido: true,
      },
    })

    return NextResponse.json(venta)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    console.error("Error updating venta:", error)
    return NextResponse.json(
      { error: "Error al actualizar venta" },
      { status: 500 }
    )
  }
}

// DELETE /api/ventas/[id] — Delete a venta and reverse stock
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const { id } = await params

    const existing = await db.venta.findFirst({
      where: { id, businessId },
      include: { items: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      )
    }

    // Reverse stock in a transaction
    await db.$transaction(async (tx) => {
      // Reverse stock for each item
      for (const item of existing.items) {
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stock: { increment: item.qty } },
        })
      }

      // Delete the venta (cascades will handle items and pedido)
      await tx.venta.delete({ where: { id } })
    })

    return NextResponse.json({ message: "Venta eliminada y stock restaurado" })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    console.error("Error deleting venta:", error)
    return NextResponse.json(
      { error: "Error al eliminar venta" },
      { status: 500 }
    )
  }
}
