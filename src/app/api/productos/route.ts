import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"
import { logHistorial } from "@/lib/historial"

// GET /api/productos — List all productos for the business with optional filters
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const { searchParams } = new URL(req.url)
    const dropId = searchParams.get("dropId")
    const search = searchParams.get("search")
    const color = searchParams.get("color")
    const stockStatus = searchParams.get("stock") // "low", "out", "ok"

    const where: Record<string, unknown> = { businessId }

    if (dropId) {
      where.dropId = dropId
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" }
    }

    if (color) {
      where.color = color
    }

    if (stockStatus === "out") {
      where.stock = 0
    }
    // Note: "low" stock filter (stock > 0 && stock <= minStock) is handled
    // in JS post-filter since Prisma/SQLite can't do cross-field comparisons

    const productos = await db.producto.findMany({
      where,
      include: {
        drop: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    // Post-filter for low stock (stock > 0 && stock <= minStock)
    let filtered = productos
    if (stockStatus === "low") {
      filtered = productos.filter((p) => p.stock > 0 && p.stock <= p.minStock)
    }

    return NextResponse.json(filtered)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    )
  }
}

// POST /api/productos — Create a new producto
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

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
    } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      )
    }

    const producto = await db.producto.create({
      data: {
        name: name.trim(),
        dropId: dropId || null,
        color: color || "",
        talla: talla || "",
        stock: typeof stock === "number" ? stock : 0,
        precio: typeof precio === "number" ? precio : 0,
        precioMayor: typeof precioMayor === "number" ? precioMayor : 0,
        costo: typeof costo === "number" ? costo : 0,
        minStock: typeof minStock === "number" ? minStock : 2,
        businessId,
      },
      include: {
        drop: { select: { id: true, name: true } },
      },
    })

    const userName = (session.user as { name?: string }).name || ""
    logHistorial({
      accion: "crear",
      entidad: "producto",
      entidadId: producto.id,
      descripcion: `Producto "${producto.name}" ${producto.color} ${producto.talla} creado (stock: ${producto.stock})`,
      usuario: userName,
      businessId,
    })

    return NextResponse.json(producto, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    )
  }
}
