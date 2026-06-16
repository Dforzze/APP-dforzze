import { db } from "@/lib/db"

interface LogOptions {
  accion: "crear" | "editar" | "eliminar" | "estado"
  entidad: string
  entidadId: string
  descripcion: string
  usuario: string
  businessId: string
}

/**
 * Registra una entrada en el historial de actividad.
 * Se llama sin await para no bloquear la respuesta al cliente.
 */
export function logHistorial(opts: LogOptions): void {
  db.historial
    .create({
      data: {
        accion: opts.accion,
        entidad: opts.entidad,
        entidadId: opts.entidadId,
        descripcion: opts.descripcion,
        usuario: opts.usuario || "",
        businessId: opts.businessId,
      },
    })
    .catch(() => {
      // Silent — el log nunca debe romper la operación principal
    })
}
