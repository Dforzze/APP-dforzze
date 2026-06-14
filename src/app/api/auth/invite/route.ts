import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword, requireAuth } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth()
    const currentUser = session.user as {
      id: string
      role: string
      businessId: string
    }

    // Only owner or admin can invite members
    if (currentUser.role !== "owner" && currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "No tienes permisos para invitar miembros" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, name, role } = body

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos: email, password, name, role" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ["admin", "member"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Rol inválido. Roles permitidos: admin, member" },
        { status: 400 }
      )
    }

    // Only owners can invite admins
    if (role === "admin" && currentUser.role !== "owner") {
      return NextResponse.json(
        { error: "Solo el propietario puede invitar administradores" },
        { status: 403 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email" },
        { status: 409 }
      )
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Create user with the same businessId as the inviter
    const newUser = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        businessId: currentUser.businessId,
      },
    })

    return NextResponse.json(
      {
        message: "Miembro invitado exitosamente",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          businessId: newUser.businessId,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    console.error("[INVITE_ERROR]", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
