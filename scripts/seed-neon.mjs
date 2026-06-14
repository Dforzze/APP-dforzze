/**
 * Script para importar los datos de datospolera.json a Neon PostgreSQL
 * Uso: node scripts/seed-neon.mjs
 */

import { PrismaClient } from '@prisma/client'
import { hashSync } from 'bcryptjs'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(resolve(__dirname, '../datospolera.json'), 'utf-8'))

const db = new PrismaClient()

async function main() {
  console.log('🚀 Iniciando importación de datos a Neon...\n')

  const businessId = 'cmqb80war0018q6bvjmnll1np'

  // 1. Crear el negocio
  console.log('📦 Creando negocio Dforzze...')
  await db.business.upsert({
    where: { id: businessId },
    update: {},
    create: {
      id: businessId,
      name: 'Dforzze',
      slug: 'dforzze',
      plan: 'free',
      cajaManual: data.cajaManual ?? 0,
    },
  })
  console.log('✅ Negocio creado\n')

  // 2. Crear usuario owner
  console.log('👤 Creando usuario...')
  await db.user.upsert({
    where: { email: 'admin@dforzze.com' },
    update: {},
    create: {
      email: 'admin@dforzze.com',
      name: 'Dforzze Admin',
      password: hashSync('dforzze2026', 10),
      role: 'owner',
      businessId,
    },
  })
  console.log('✅ Usuario creado: admin@dforzze.com / dforzze2026\n')

  // 3. Crear drops
  console.log(`🗂️  Creando ${data.drops.length} drops...`)
  for (const drop of data.drops) {
    await db.drop.upsert({
      where: { id: drop.id },
      update: {},
      create: {
        id: drop.id,
        name: drop.name,
        desc: drop.desc,
        date: drop.date,
        status: drop.status,
        businessId,
        createdAt: new Date(drop.createdAt),
      },
    })
  }
  console.log('✅ Drops creados\n')

  // 4. Crear productos
  console.log(`👕 Creando ${data.productos.length} productos...`)
  for (const p of data.productos) {
    await db.producto.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        name: p.name,
        dropId: p.dropId,
        color: p.color,
        talla: p.talla,
        stock: p.stock,
        precio: p.precio,
        precioMayor: p.precioMayor,
        costo: p.costo,
        minStock: p.minStock,
        businessId,
        createdAt: new Date(p.createdAt),
      },
    })
  }
  console.log('✅ Productos creados\n')

  // 5. Crear ventas + items
  console.log(`💰 Creando ${data.ventas.length} ventas...`)
  for (const v of data.ventas) {
    await db.venta.upsert({
      where: { id: v.id },
      update: {},
      create: {
        id: v.id,
        cliente: v.cliente,
        vendedor: v.vendedor,
        fecha: v.fecha,
        dropId: v.dropId,
        metodoPago: v.metodoPago,
        nota: v.nota,
        total: v.total,
        comisionPct: v.comisionPct,
        comisionMonto: v.comisionMonto,
        businessId,
        createdAt: new Date(v.createdAt),
        items: {
          create: v.items.map(item => ({
            id: item.id,
            productoId: item.productoId,
            productName: item.productName,
            color: item.color,
            talla: item.talla,
            qty: item.qty,
            precio: item.precio,
            subtotal: item.subtotal,
          })),
        },
      },
    })
  }
  console.log('✅ Ventas creadas\n')

  // 6. Crear pedidos
  console.log(`📦 Creando ${data.pedidos.length} pedidos...`)
  for (const ped of data.pedidos) {
    await db.pedido.upsert({
      where: { id: ped.id },
      update: {},
      create: {
        id: ped.id,
        ventaId: ped.ventaId,
        status: ped.status,
        businessId,
        createdAt: new Date(ped.createdAt),
        updatedAt: new Date(ped.updatedAt),
      },
    })
  }
  console.log('✅ Pedidos creados\n')

  // 7. Crear clientes si existen
  if (data.clientes && data.clientes.length > 0) {
    console.log(`👥 Creando ${data.clientes.length} clientes...`)
    for (const c of data.clientes) {
      await db.cliente.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          name: c.name,
          phone: c.phone ?? '',
          notes: c.notes ?? '',
          businessId,
          createdAt: new Date(c.createdAt),
        },
      })
    }
    console.log('✅ Clientes creados\n')
  }

  // 8. Crear gastos si existen
  if (data.gastos && data.gastos.length > 0) {
    console.log(`💸 Creando ${data.gastos.length} gastos...`)
    for (const g of data.gastos) {
      await db.gasto.upsert({
        where: { id: g.id },
        update: {},
        create: {
          id: g.id,
          tipo: g.tipo,
          desc: g.desc,
          categoria: g.categoria ?? 'Otros',
          dropId: g.dropId,
          monto: g.monto,
          fecha: g.fecha,
          businessId,
          createdAt: new Date(g.createdAt),
        },
      })
    }
    console.log('✅ Gastos creados\n')
  }

  console.log('🎉 ¡Importación completada!')
  console.log('─────────────────────────────────────')
  console.log('📧 Email:      admin@dforzze.com')
  console.log('🔑 Contraseña: dforzze2026')
  console.log('─────────────────────────────────────')
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
