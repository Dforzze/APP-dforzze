import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

export async function GET() {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const proveedores = await db.proveedor.findMany({
      where: { businessId },
      include: { compras: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(proveedores)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    return NextResponse.json({ error: "Error al obtener proveedores" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId
    const body = await req.json()
    const { name, contacto, telefono, categoria, notas } = body
    if (!name?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    const proveedor = await db.proveedor.create({
      data: { name: name.trim(), contacto: contacto || "", telefono: telefono || "", categoria: categoria || "Otros", notas: notas || "", businessId },
    })
    return NextResponse.json(proveedor, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    return NextResponse.json({ error: "Error al crear proveedor" }, { status: 500 })
  }
}
