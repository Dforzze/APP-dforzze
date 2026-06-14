import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const { id } = await params
    const body = await req.json()
    const proveedor = await db.proveedor.findFirst({ where: { id, businessId } })
    if (!proveedor) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    const updated = await db.proveedor.update({ where: { id }, data: body })
    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const { id } = await params
    const proveedor = await db.proveedor.findFirst({ where: { id, businessId } })
    if (!proveedor) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    await db.proveedor.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
