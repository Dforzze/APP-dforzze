import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { execSync } from "child_process"
import { readFileSync, mkdirSync, writeFileSync } from "fs"

// GET /api/download-source — Descargar código fuente listo para Vercel
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const projectRoot = "/home/z/my-project"
    const tmpDir = "/tmp/dforzzest-vercel"
    const tmpZip = "/tmp/dforzzest-vercel.zip"

    // Limpiar anteriores
    execSync(`rm -rf ${tmpDir} ${tmpZip}`, { stdio: "pipe" })
    mkdirSync(tmpDir, { recursive: true })

    // Archivos/carpetas que SÍ se incluyen
    const includeItems = [
      "src/",
      "prisma/",
      "public/",
      "db/",
      "electron/",
      "package.json",
      "tsconfig.json",
      "next.config.ts",
      "tailwind.config.ts",
      "postcss.config.mjs",
      "components.json",
      "next-env.d.ts",
      "eslint.config.mjs",
      "electron-builder.yml",
      "vercel.json",
      ".env.example",
      ".gitignore",
    ]

    // Copiar archivos esenciales
    for (const item of includeItems) {
      try {
        execSync(`cp -r ${projectRoot}/${item} ${tmpDir}/ 2>/dev/null || true`, { stdio: "pipe" })
      } catch {
        // Algunos archivos pueden no existir
      }
    }

    // Eliminar database real del zip (solo estructura)
    try {
      execSync(`rm -f ${tmpDir}/db/custom.db ${tmpDir}/db/custom.db-journal ${tmpDir}/db/backups/* 2>/dev/null || true`, { stdio: "pipe" })
    } catch {}

    // Crear .env para Vercel con ruta relativa
    writeFileSync(`${tmpDir}/.env.vercel`, `DATABASE_URL=file:./db/custom.db
NEXTAUTH_SECRET=cambia-esto-por-un-secreto-largo-12345678
NEXTAUTH_URL=https://TU-NOMBRE.vercel.app
`)

    // Crear README con instrucciones
    writeFileSync(`${tmpDir}/README-VERCEL.md`, `# 🚀 Dforzzest — Instrucciones para Vercel

## PASO 1: Subir a GitHub
1. Crea cuenta en github.com (gratis)
2. Crea un nuevo repositorio llamado "dforzzest"
3. Sube TODOS estos archivos a tu repositorio
   - Usa GitHub Desktop (desktop.github.com) para subir sin límite
   - O usa la terminal: git init && git add . && git commit -m "app" && git remote add origin URL && git push -u origin main

## PASO 2: Conectar con Vercel
1. Ve a vercel.com y regístrate con tu cuenta de GitHub
2. Clic en "Add New" → "Project"
3. Selecciona tu repositorio "dforzzest"
4. Clic en "Deploy" (no cambies nada)
5. Espera 2-3 minutos

## PASO 3: Configurar variables de entorno
En Vercel ve a Settings → Environment Variables y agrega:
- DATABASE_URL = file:./db/custom.db
- NEXTAUTH_SECRET = cambia-esto-por-un-secreto-largo-12345678
- NEXTAUTH_URL = https://TU-NOMBRE.vercel.app (el link que te dio Vercel)

## PASO 4: Redeploy
Ve a Deployments → los 3 puntitos → Redeploy

## ¡Listo! Tu app estará SIEMPRE online en TU-NOMBRE.vercel.app

## Nota sobre la base de datos
Esta app usa SQLite que se almacena en un archivo. En Vercel, el archivo se reinicia con cada deploy.
Para datos permanentes, considera migrar a PostgreSQL (supabase.com es gratis).
`)

    // Crear .gitignore
    writeFileSync(`${tmpDir}/.gitignore`, `node_modules/
.next/
*.db
*.db-journal
.env
.vercel
`)

    // Verificar que hay archivos
    try {
      const check = execSync(`find ${tmpDir} -type f | wc -l`, { stdio: "pipe" }).toString().trim()
      if (check === "0") throw new Error("No hay archivos")
    } catch {
      throw new Error("No se pudieron copiar los archivos")
    }

    // Crear zip
    execSync(`cd ${tmpDir} && zip -r ${tmpZip} .`, { stdio: "pipe" })

    const zipBuffer = readFileSync(tmpZip)

    // Limpiar
    execSync(`rm -rf ${tmpDir} ${tmpZip}`, { stdio: "pipe" })

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=dforzzest-vercel-${new Date().toISOString().slice(0, 10)}.zip`,
        "Content-Length": zipBuffer.length.toString(),
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    console.error("Error al descargar código fuente:", error)
    return NextResponse.json(
      { error: "Error al descargar el código fuente" },
      { status: 500 }
    )
  }
}
