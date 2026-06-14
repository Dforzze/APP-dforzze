import { hashSync, compareSync } from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * Hash a plain-text password using bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  return hashSync(password, 12)
}

/**
 * Compare a plain-text password against a bcrypt hash.
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return compareSync(password, hash)
}

/**
 * Get the current user's businessId from the session.
 * Returns null if not authenticated or no businessId.
 */
export async function getSessionBusinessId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return (session?.user as { businessId?: string } | undefined)?.businessId ?? null
}

/**
 * Require authentication — returns the session or throws an error.
 * Use this in API routes to enforce auth.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error("No autenticado")
  }

  return session
}
