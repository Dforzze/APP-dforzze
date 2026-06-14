import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// GET /api/gastos — List all gastos for business with optional filters
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get("tipo")
    const categoria = searchParams.get("categoria")
    const dropId = searchParams.get("dropId")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = { businessId }

    if (tipo) {
      where.tipo = tipo
    }

    if (categoria) {
      where.categoria = categoria
    }

    if (dropId) {
      where.dropId = dropId
    }

    if (search) {
      where.desc = { contains: search, mode: "insensitive" }
    }

    const gastos = await db.gasto.findMany({
      where,
      include: {
        drop: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(gastos)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al obtener gastos" },
      { status: 500 }
    )
  }
}

// POST /api/gastos — Create a gasto
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const body = await req.json()
    const { tipo, desc, categoria, dropId, monto, fecha } = body

    if (!tipo || !["gasto", "inversion", "retiro"].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo inválido. Debe ser: gasto, inversion o retiro" },
        { status: 400 }
      )
    }

    if (!desc || !desc.trim()) {
      return NextResponse.json(
        { error: "La descripción es requerida" },
        { status: 400 }
      )
    }

    if (typeof monto !== "number" || monto <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser un número positivo" },
        { status: 400 }
      )
    }

    const gasto = await db.gasto.create({
      data: {
        tipo,
        desc: desc.trim(),
        categoria: categoria || "Otros",
        dropId: dropId || null,
        monto,
        fecha: fecha || new Date().toISOString().split("T")[0],
        businessId,
      },
      include: {
        drop: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(gasto, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al crear gasto" },
      { status: 500 }
    )
  }
}
