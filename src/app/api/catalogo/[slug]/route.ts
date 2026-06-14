import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const business = await db.business.findUnique({ where: { slug } })
    if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })

    const productos = await db.producto.findMany({
      where: { businessId: business.id, stock: { gt: 0 } },
      include: { drop: { select: { id: true, name: true, status: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      business: { name: business.name, slug: business.slug },
      productos,
    })
  } catch {
    return NextResponse.json({ error: "Error al obtener catálogo" }, { status: 500 })
  }
}
