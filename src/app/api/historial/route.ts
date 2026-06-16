import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")?.trim()
    const accion = searchParams.get("accion")
    const entidad = searchParams.get("entidad")
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { businessId }

    if (accion && accion !== "all") where.accion = accion
    if (entidad && entidad !== "all") where.entidad = entidad

    if (fechaDesde || fechaHasta) {
      const dateFilter: Record<string, Date> = {}
      if (fechaDesde) dateFilter.gte = new Date(fechaDesde + "T00:00:00")
      if (fechaHasta) dateFilter.lte = new Date(fechaHasta + "T23:59:59")
      where.createdAt = dateFilter
    }

    if (search) {
      where.OR = [
        { descripcion: { contains: search, mode: "insensitive" } },
        { usuario: { contains: search, mode: "insensitive" } },
        { entidadId: { contains: search, mode: "insensitive" } },
      ]
    }

    const [historial, total] = await Promise.all([
      db.historial.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.historial.count({ where }),
    ])

    return NextResponse.json({ items: historial, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    return NextResponse.json({ error: "Error al obtener historial" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const body = await req.json()
    const { accion, entidad, entidadId, descripcion, usuario } = body
    const item = await db.historial.create({
      data: { accion, entidad, entidadId, descripcion, usuario: usuario || "", businessId },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    return NextResponse.json({ error: "Error al guardar historial" }, { status: 500 })
  }
}
