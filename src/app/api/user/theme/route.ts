import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

export async function GET() {
  try {
    const session = await requireAuth()
    const userId = (session.user as { id: string }).id
    const user = await db.user.findUnique({ where: { id: userId }, select: { theme: true } })
    return NextResponse.json({ theme: user?.theme || "dark" })
  } catch {
    return NextResponse.json({ theme: "dark" })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = (session.user as { id: string }).id
    const { theme } = await req.json()
    if (!["light", "dark", "black"].includes(theme))
      return NextResponse.json({ error: "Tema inválido" }, { status: 400 })
    await db.user.update({ where: { id: userId }, data: { theme } })
    return NextResponse.json({ ok: true, theme })
  } catch {
    return NextResponse.json({ error: "Error al guardar tema" }, { status: 500 })
  }
}
