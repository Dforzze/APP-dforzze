import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const q = req.nextUrl.searchParams.get("q")?.trim()
    if (!q || q.length < 2) return NextResponse.json({ results: [] })

    const [clientes, productos, ventas] = await Promise.all([
      db.cliente.findMany({
        where: { businessId, name: { contains: q, mode: 'insensitive' } },
        take: 5,
        select: { id: true, name: true, phone: true },
      }),
      db.producto.findMany({
        where: { businessId, OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { color: { contains: q, mode: 'insensitive' } },
        ]},
        take: 5,
        select: { id: true, name: true, color: true, talla: true, stock: true },
      }),
      db.venta.findMany({
        where: { businessId, cliente: { contains: q, mode: 'insensitive' } },
        take: 5,
        select: { id: true, cliente: true, total: true, fecha: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      results: [
        ...clientes.map(c => ({ type: 'cliente', id: c.id, title: c.name, sub: c.phone || '', tab: 'clientes' })),
        ...productos.map(p => ({ type: 'producto', id: p.id, title: `${p.name} ${p.color} ${p.talla}`, sub: `Stock: ${p.stock}`, tab: 'inventario' })),
        ...ventas.map(v => ({ type: 'venta', id: v.id, title: v.cliente, sub: `S/ ${v.total} · ${v.fecha}`, tab: 'ventas' })),
      ]
    })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
