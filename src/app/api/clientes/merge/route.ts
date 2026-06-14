import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// POST /api/clientes/merge — Merge duplicate clients into one
// Body: { keepId: string, removeIds: string[] }
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const body = await req.json()
    const { keepId, removeIds } = body

    if (!keepId || !removeIds || !Array.isArray(removeIds) || removeIds.length === 0) {
      return NextResponse.json(
        { error: "Se requiere keepId y removeIds" },
        { status: 400 }
      )
    }

    // Get the keep client
    const keepClient = await db.cliente.findFirst({
      where: { id: keepId, businessId },
    })

    if (!keepClient) {
      return NextResponse.json(
        { error: "Cliente principal no encontrado" },
        { status: 404 }
      )
    }

    // Get all remove clients
    const removeClients = await db.cliente.findMany({
      where: { id: { in: removeIds }, businessId },
    })

    if (removeClients.length !== removeIds.length) {
      return NextResponse.json(
        { error: "Uno o más clientes duplicados no encontrados" },
        { status: 404 }
      )
    }

    // Merge logic in a transaction
    const result = await db.$transaction(async (tx) => {
      const mergedPhones: string[] = []
      const mergedNotes: string[] = []

      // Collect phone/notes from removed clients
      for (const rc of removeClients) {
        if (rc.phone && rc.phone.trim()) mergedPhones.push(rc.phone.trim())
        if (rc.notes && rc.notes.trim()) mergedNotes.push(rc.notes.trim())

        // Update all ventas that reference the removed client name
        await tx.venta.updateMany({
          where: { businessId, cliente: rc.name },
          data: { cliente: keepClient.name },
        })

        // Delete the duplicate client
        await tx.cliente.delete({ where: { id: rc.id } })
      }

      // Merge phone/notes into keep client
      const finalPhone = [keepClient.phone, ...mergedPhones]
        .filter((p) => p && p.trim())
        .join(" / ")

      const finalNotes = [keepClient.notes, ...mergedNotes]
        .filter((n) => n && n.trim())
        .join(" | ")

      const updated = await tx.cliente.update({
        where: { id: keepId },
        data: {
          phone: finalPhone,
          notes: finalNotes,
        },
      })

      return updated
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    console.error("Error merging clients:", error)
    return NextResponse.json(
      { error: "Error al fusionar clientes" },
      { status: 500 }
    )
  }
}
