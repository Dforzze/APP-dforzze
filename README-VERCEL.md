# 🚀 Dforzzest — Instrucciones para Vercel

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
