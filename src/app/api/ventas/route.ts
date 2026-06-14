import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// GET /api/ventas — List all ventas for business with optional filters
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const dropId = searchParams.get("dropId")
    const productoId = searchParams.get("producto")

    const where: Record<string, unknown> = { businessId }

    if (dropId) {
      where.dropId = dropId
    }

    if (search) {
      where.OR = [
        { cliente: { contains: search, mode: "insensitive" } },
        { vendedor: { contains: search, mode: "insensitive" } },
        { nota: { contains: search, mode: "insensitive" } },
      ]
    }

    if (productoId) {
      where.items = { some: { productoId } }
    }

    const ventas = await db.venta.findMany({
      where,
      include: {
        items: {
          include: {
            producto: { select: { id: true, name: true, color: true, talla: true } },
          },
        },
        pedido: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(ventas)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al obtener ventas" },
      { status: 500 }
    )
  }
}

// POST /api/ventas — Create a venta with items (transaction)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const body = await req.json()
    const {
      cliente,
      vendedor,
      fecha,
      dropId,
      metodoPago,
      nota,
      comisionPct,
      items,
    } = body

    if (!cliente || !cliente.trim()) {
      return NextResponse.json(
        { error: "El cliente es requerido" },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Debe incluir al menos un item" },
        { status: 400 }
      )
    }

    // Validate all products exist and belong to this business
    const productoIds = items.map((item: { productoId: string }) => item.productoId)
    const productos = await db.producto.findMany({
      where: { id: { in: productoIds }, businessId },
    })

    if (productos.length !== productoIds.length) {
      return NextResponse.json(
        { error: "Uno o más productos no existen o no pertenecen al negocio" },
        { status: 400 }
      )
    }

    // Check stock availability
    const productoMap = new Map(productos.map((p) => [p.id, p]))
    for (const item of items) {
      const producto = productoMap.get(item.productoId)
      if (producto && producto.stock < (item.qty || 1)) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${producto.name}. Disponible: ${producto.stock}` },
          { status: 400 }
        )
      }
    }

    // Calculate total
    const ventaItems = items.map((item: { productoId: string; qty: number; precio: number }) => {
      const producto = productoMap.get(item.productoId)!
      const qty = item.qty || 1
      const precio = item.precio || producto.precio
      const subtotal = qty * precio
      return {
        productoId: item.productoId,
        productName: producto.name,
        color: producto.color,
        talla: producto.talla,
        qty,
        precio,
        subtotal,
      }
    })

    const total = ventaItems.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0)
    const comisionPctValue = typeof comisionPct === "number" ? comisionPct : 0
    const comisionMonto = total * (comisionPctValue / 100)

    // Execute everything in a transaction
    const venta = await db.$transaction(async (tx) => {
      // Auto-create cliente if doesn't exist
      const existingCliente = await tx.cliente.findFirst({
        where: { name: cliente.trim(), businessId },
      })

      if (!existingCliente) {
        await tx.cliente.create({
          data: { name: cliente.trim(), businessId },
        })
      }

      // Create the venta
      const newVenta = await tx.venta.create({
        data: {
          cliente: cliente.trim(),
          vendedor: vendedor || "",
          fecha: fecha || new Date().toISOString().split("T")[0],
          dropId: dropId || null,
          metodoPago: metodoPago || "Efectivo",
          nota: nota || "",
          total,
          comisionPct: comisionPctValue,
          comisionMonto,
          businessId,
        },
      })

      // Create venta items
      for (const vItem of ventaItems) {
        await tx.ventaItem.create({
          data: {
            ventaId: newVenta.id,
            productoId: vItem.productoId,
            productName: vItem.productName,
            color: vItem.color,
            talla: vItem.talla,
            qty: vItem.qty,
            precio: vItem.precio,
            subtotal: vItem.subtotal,
          },
        })

        // Decrement stock
        await tx.producto.update({
          where: { id: vItem.productoId },
          data: { stock: { decrement: vItem.qty } },
        })
      }

      // Auto-create pedido
      await tx.pedido.create({
        data: {
          ventaId: newVenta.id,
          status: "pendiente",
          businessId,
        },
      })

      // Return the venta with items
      return tx.venta.findUnique({
        where: { id: newVenta.id },
        include: {
          items: {
            include: {
              producto: { select: { id: true, name: true, color: true, talla: true } },
            },
          },
          pedido: true,
        },
      })
    })

    return NextResponse.json(venta, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    console.error("Error creating venta:", error)
    return NextResponse.json(
      { error: "Error al crear venta" },
      { status: 500 }
    )
  }
}
