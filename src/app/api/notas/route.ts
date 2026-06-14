import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

export async function GET() {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const notas = await db.nota.findMany({
      where: { businessId },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json(notas)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    return NextResponse.json({ error: "Error al obtener notas" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const body = await req.json()
    const { titulo, contenido, color } = body
    if (!contenido?.trim()) return NextResponse.json({ error: "El contenido es requerido" }, { status: 400 })
    const nota = await db.nota.create({
      data: { titulo: titulo || "", contenido: contenido.trim(), color: color || "#8b5cf6", businessId },
    })
    return NextResponse.json(nota, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    return NextResponse.json({ error: "Error al crear nota" }, { status: 500 })
  }
}
