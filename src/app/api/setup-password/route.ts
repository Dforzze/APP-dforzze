import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth-utils"

// Endpoint de uso único para setear la contraseña del owner
// Llamar: GET /api/setup-password
// Eliminar este archivo después de usarlo
export async function GET() {
  try {
    const email = "dforzzestudio@gmail.com"
    const password = "netoforzze321$"
    const businessId = "cmqb80war0018q6bvjmnll1np"

    const user = await db.user.findFirst({
      where: { businessId }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const hashedPassword = await hashPassword(password)

    await db.user.update({
      where: { id: user.id },
      data: {
        email,
        password: hashedPassword,
      }
    })

    return NextResponse.json({ 
      ok: true, 
      message: "Contraseña actualizada. Ya podés iniciar sesión.",
      email,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
