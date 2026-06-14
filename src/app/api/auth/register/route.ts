import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth-utils"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, businessName } = body

    // Validate required fields
    if (!email || !password || !name || !businessName) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos: email, password, name, businessName" },
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

    // Generate unique slug for the business
    let slug = slugify(businessName)
    let slugCounter = 1
    let existingBusiness = await db.business.findUnique({ where: { slug } })

    while (existingBusiness) {
      slug = slugify(`${businessName}-${slugCounter}`)
      slugCounter++
      existingBusiness = await db.business.findUnique({ where: { slug } })
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Create business and user in a transaction
    const result = await db.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: businessName,
          slug,
        },
      })

      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: "owner",
          businessId: business.id,
        },
      })

      return { business, user }
    })

    return NextResponse.json(
      {
        message: "Cuenta creada exitosamente",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          businessId: result.business.id,
        },
        business: {
          id: result.business.id,
          name: result.business.name,
          slug: result.business.slug,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[REGISTER_ERROR]", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
