import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

export async function GET() {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const compras = await db.compra.findMany({
      where: { businessId },
      include: { proveedor: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(compras)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    return NextResponse.json({ error: "Error al obtener compras" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const body = await req.json()
    const { proveedorId, desc, monto, fecha, estado } = body
    if (!proveedorId || !desc?.trim() || !monto || !fecha)
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    const compra = await db.compra.create({
      data: { proveedorId, desc: desc.trim(), monto: parseFloat(monto), fecha, estado: estado || "pagado", businessId },
      include: { proveedor: true },
    })
    return NextResponse.json(compra, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    return NextResponse.json({ error: "Error al crear compra" }, { status: 500 })
  }
}
