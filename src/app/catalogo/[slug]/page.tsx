import { notFound } from "next/navigation"

interface Producto {
  id: string
  name: string
  color: string
  talla: string
  stock: number
  precio: number
  drop?: { name: string; status: string } | null
}

async function getCatalogo(slug: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/catalogo/${slug}`, { cache: "no-store" })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function CatalogoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getCatalogo(slug)
  if (!data) notFound()

  const { business, productos } = data

  // Group by drop
  const byDrop: Record<string, Producto[]> = {}
  productos.forEach((p: Producto) => {
    const key = p.drop?.name || "Sin colección"
    if (!byDrop[key]) byDrop[key] = []
    byDrop[key].push(p)
  })

  const fmt = (n: number) => "S/ " + n.toFixed(2)

  return (
    <div style={{ minHeight: "100vh", background: "#0f0d1a", color: "#e2e0ff", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "rgba(15,13,26,0.95)", borderBottom: "1px solid #2d2a4a", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", background: "linear-gradient(135deg, #8b5cf6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {business.name}
          </h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>Catálogo de productos disponibles</p>
        </div>
        <span style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "999px", padding: "4px 12px", fontSize: "12px", fontWeight: "600" }}>
          {productos.length} productos
        </span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 16px" }}>
        {Object.keys(byDrop).length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>👕</div>
            <p>No hay productos disponibles en este momento.</p>
          </div>
        ) : (
          Object.entries(byDrop).map(([dropName, prods]) => (
            <div key={dropName} style={{ marginBottom: "32px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "2px", color: "#9ca3af", marginBottom: "12px", borderBottom: "1px solid #2d2a4a", paddingBottom: "8px" }}>
                🎯 {dropName}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
                {prods.map((p) => (
                  <div key={p.id} style={{ background: "#1a1730", border: "1px solid #2d2a4a", borderRadius: "16px", padding: "16px", transition: "border-color 0.2s" }}>
                    <div style={{ width: "100%", aspectRatio: "1", background: "rgba(139,92,246,0.08)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", marginBottom: "12px" }}>
                      👕
                    </div>
                    <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>{p.name}</div>
                    <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "8px" }}>{p.color} · Talla {p.talla}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "700", color: "#a78bfa", fontSize: "15px" }}>{fmt(p.precio)}</span>
                      <span style={{ fontSize: "11px", color: "#10b981", background: "rgba(16,185,129,0.1)", borderRadius: "999px", padding: "2px 8px" }}>
                        {p.stock} disponibles
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #2d2a4a", padding: "16px 24px", textAlign: "center", color: "#6b7280", fontSize: "12px" }}>
        Catálogo generado por <span style={{ color: "#8b5cf6", fontWeight: "600" }}>Dforzze</span>
      </div>
    </div>
  )
}
