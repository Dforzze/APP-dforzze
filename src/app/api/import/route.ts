import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// POST /api/import — Import data from the old localStorage format
// Body format matches the original HTML's exportarJSON() output:
// { drops: [...], productos: [...], ventas: [...], pedidos: [...], clientes: [...], gastos: [...] }
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const businessId = (session.user as { businessId: string }).businessId

    const body = await req.json()
    const {
      drops: oldDrops = [],
      productos: oldProductos = [],
      ventas: oldVentas = [],
      pedidos: oldPedidos = [],
      clientes: oldClientes = [],
      gastos: oldGastos = [],
    } = body

    const results = {
      drops: { imported: 0, skipped: 0 },
      productos: { imported: 0, skipped: 0 },
      ventas: { imported: 0, skipped: 0 },
      pedidos: { imported: 0, skipped: 0 },
      clientes: { imported: 0, skipped: 0 },
      gastos: { imported: 0, skipped: 0 },
    }

    // Map old IDs to new IDs so we can maintain relationships
    const dropIdMap = new Map<string, string>()
    const productoIdMap = new Map<string, string>()
    const ventaIdMap = new Map<string, string>()
    const clienteIdMap = new Map<string, string>()

    // 1. Import Drops first
    for (const d of oldDrops) {
      if (!d.name) { results.drops.skipped++; continue }
      try {
        const newDrop = await db.drop.create({
          data: {
            name: d.name,
            desc: d.desc || "",
            date: d.date || "",
            status: d.status || "activo",
            businessId,
          },
        })
        dropIdMap.set(d.id, newDrop.id)
        results.drops.imported++
      } catch {
        results.drops.skipped++
      }
    }

    // 2. Import Clientes
    for (const c of oldClientes) {
      if (!c.name) { results.clientes.skipped++; continue }
      try {
        const existing = await db.cliente.findFirst({
          where: { name: c.name, businessId },
        })
        if (existing) {
          clienteIdMap.set(c.name.toLowerCase().trim(), existing.id)
          results.clientes.skipped++
          continue
        }
        const newCliente = await db.cliente.create({
          data: {
            name: c.name,
            phone: c.phone || "",
            notes: c.notes || "",
            businessId,
          },
        })
        clienteIdMap.set(c.name.toLowerCase().trim(), newCliente.id)
        results.clientes.imported++
      } catch {
        results.clientes.skipped++
      }
    }

    // 3. Import Productos
    for (const p of oldProductos) {
      if (!p.name) { results.productos.skipped++; continue }
      try {
        const newProducto = await db.producto.create({
          data: {
            name: p.name,
            dropId: p.dropId ? (dropIdMap.get(p.dropId) || null) : null,
            color: p.color || "",
            talla: p.talla || "",
            stock: typeof p.stock === "number" ? p.stock : 0,
            precio: typeof p.precio === "number" ? p.precio : 0,
            precioMayor: typeof p.precioMayor === "number" ? p.precioMayor : 0,
            costo: typeof p.costo === "number" ? p.costo : 0,
            minStock: typeof p.minStock === "number" ? p.minStock : 2,
            businessId,
          },
        })
        productoIdMap.set(p.id, newProducto.id)
        results.productos.imported++
      } catch {
        results.productos.skipped++
      }
    }

    // 4. Import Ventas (with items and pedidos)
    for (const v of oldVentas) {
      try {
        const mappedDropId = v.dropId ? (dropIdMap.get(v.dropId) || null) : null

        // Build items - handle both old and new format
        let items: Array<{ productoId: string; productName: string; color: string; talla: string; qty: number; precio: number; subtotal: number }> = []

        if (v.items && Array.isArray(v.items)) {
          items = v.items.map((item: any) => ({
            productoId: productoIdMap.get(item.productoId || item.prodId) || "",
            productName: item.productName || item.nombre || v.nombre || "",
            color: item.color || v.color || "",
            talla: item.talla || v.talla || "",
            qty: typeof item.qty === "number" ? item.qty : 1,
            precio: typeof item.precio === "number" ? item.precio : 0,
            subtotal: typeof item.subtotal === "number" ? item.subtotal : 0,
          }))
        } else {
          const productoId = productoIdMap.get(v.prodId || v.productoId) || ""
          items = [{
            productoId,
            productName: v.nombre || v.productName || "",
            color: v.color || "",
            talla: v.talla || "",
            qty: typeof v.qty === "number" ? v.qty : 1,
            precio: typeof v.precio === "number" ? v.precio : 0,
            subtotal: typeof v.total === "number" ? v.total : 0,
          }]
        }

        const validItems = items.filter(i => i.productoId)

        if (validItems.length === 0) {
          const newVenta = await db.venta.create({
            data: {
              cliente: v.cliente || "Sin cliente",
              vendedor: v.vendedor || "",
              fecha: v.fecha || new Date().toISOString().slice(0, 10),
              dropId: mappedDropId,
              metodoPago: v.metodoPago || "Efectivo",
              nota: v.nota || "",
              total: typeof v.total === "number" ? v.total : 0,
              comisionPct: typeof v.comisionPct === "number" ? v.comisionPct : 0,
              comisionMonto: typeof v.comisionMonto === "number" ? v.comisionMonto : (v.comision || 0),
              businessId,
            },
          })
          ventaIdMap.set(v.id, newVenta.id)
          results.ventas.imported++
          continue
        }

        const newVenta = await db.$transaction(async (tx) => {
          const venta = await tx.venta.create({
            data: {
              cliente: v.cliente || "Sin cliente",
              vendedor: v.vendedor || "",
              fecha: v.fecha || new Date().toISOString().slice(0, 10),
              dropId: mappedDropId,
              metodoPago: v.metodoPago || "Efectivo",
              nota: v.nota || "",
              total: typeof v.total === "number" ? v.total : 0,
              comisionPct: typeof v.comisionPct === "number" ? v.comisionPct : 0,
              comisionMonto: typeof v.comisionMonto === "number" ? v.comisionMonto : (v.comision || 0),
              businessId,
            },
          })

          for (const item of validItems) {
            await tx.ventaItem.create({
              data: {
                ventaId: venta.id,
                productoId: item.productoId,
                productName: item.productName,
                color: item.color,
                talla: item.talla,
                qty: item.qty,
                precio: item.precio,
                subtotal: item.subtotal || (item.qty * item.precio),
              },
            })

            try {
              await tx.producto.update({
                where: { id: item.productoId },
                data: { stock: { decrement: item.qty } },
              })
            } catch {
              // Stock update failed, skip
            }
          }

          await tx.pedido.create({
            data: {
              ventaId: venta.id,
              status: v.pedidoStatus || "pendiente",
              businessId,
            },
          })

          const clienteName = (v.cliente || "").trim()
          if (clienteName && !clienteIdMap.has(clienteName.toLowerCase().trim())) {
            const newCli = await tx.cliente.create({
              data: { name: clienteName, phone: "", notes: "", businessId },
            })
            clienteIdMap.set(clienteName.toLowerCase().trim(), newCli.id)
          }

          return venta
        })

        ventaIdMap.set(v.id, newVenta.id)
        results.ventas.imported++
      } catch {
        results.ventas.skipped++
      }
    }

    // 5. Import Pedidos (update status for auto-created ones)
    for (const p of oldPedidos) {
      const mappedVentaId = ventaIdMap.get(p.ventaId)
      if (!mappedVentaId) { results.pedidos.skipped++; continue }
      try {
        await db.pedido.updateMany({
          where: { ventaId: mappedVentaId, businessId },
          data: { status: p.status || "pendiente" },
        })
        results.pedidos.imported++
      } catch {
        results.pedidos.skipped++
      }
    }

    // 6. Import Gastos
    for (const g of oldGastos) {
      if (!g.desc && !g.tipo) { results.gastos.skipped++; continue }
      try {
        await db.gasto.create({
          data: {
            tipo: g.tipo || "gasto",
            desc: g.desc || "Sin descripción",
            categoria: g.categoria || g.cat || "Otros",
            dropId: g.dropId ? (dropIdMap.get(g.dropId) || null) : null,
            monto: typeof g.monto === "number" ? g.monto : 0,
            fecha: g.fecha || new Date().toISOString().slice(0, 10),
            businessId,
          },
        })
        results.gastos.imported++
      } catch {
        results.gastos.skipped++
      }
    }

    return NextResponse.json({
      message: "Datos importados exitosamente",
      results,
      total: Object.values(results).reduce((acc: number, r: any) => acc + r.imported, 0),
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    console.error("Import error:", error)
    return NextResponse.json(
      { error: "Error al importar datos" },
      { status: 500 }
    )
  }
}
