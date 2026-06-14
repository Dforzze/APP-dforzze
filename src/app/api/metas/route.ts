import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

export async function GET() {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const metas = await db.meta.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(metas)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    return NextResponse.json({ error: "Error al obtener metas" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const body = await req.json()
    const { nombre, tipo, objetivo, periodo } = body
    if (!nombre?.trim() || !objetivo || !periodo)
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    const meta = await db.meta.create({
      data: { nombre: nombre.trim(), tipo: tipo || "ventas", objetivo: parseFloat(objetivo), periodo, businessId },
    })
    return NextResponse.json(meta, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    return NextResponse.json({ error: "Error al crear meta" }, { status: 500 })
  }
}
