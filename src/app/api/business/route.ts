import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// PUT /api/business — Update business settings (cajaManual, etc.)
export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const body = await req.json()
    const { cajaManual } = body

    const data: Record<string, unknown> = {}
    if (typeof cajaManual === "number") {
      data.cajaManual = cajaManual
    }

    const business = await db.business.update({
      where: { id: businessId },
      data,
    })

    return NextResponse.json(business)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al actualizar negocio" },
      { status: 500 }
    )
  }
}

// GET /api/business — Get business info including cajaManual
export async function GET() {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, slug: true, plan: true, cajaManual: true },
    })

    return NextResponse.json(business)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Error al obtener negocio" },
      { status: 500 }
    )
  }
}
