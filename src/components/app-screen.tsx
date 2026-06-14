'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { LogOut, Moon, Sun, Upload, Loader2, Download, Monitor } from 'lucide-react'
import Image from 'next/image'
import { api, type Drop } from '@/lib/api'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

const DashboardTab = dynamic(() => import('@/components/tabs/dashboard-tab'))
const DropsTab = dynamic(() => import('@/components/tabs/drops-tab'))
const InventarioTab = dynamic(() => import('@/components/tabs/inventario-tab'))
const VentasTab = dynamic(() => import('@/components/tabs/ventas-tab'))
const PedidosTab = dynamic(() => import('@/components/tabs/pedidos-tab'))
const ClientesTab = dynamic(() => import('@/components/tabs/clientes-tab'))
const GastosTab = dynamic(() => import('@/components/tabs/gastos-tab'))
const AnalyticsTab = dynamic(() => import('@/components/tabs/analytics-tab'))
const ProveedoresTab = dynamic(() => import('@/components/tabs/proveedores-tab'))
const NotasTab = dynamic(() => import('@/components/tabs/notas-tab'))
const MetasTab = dynamic(() => import('@/components/tabs/metas-tab'))

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'drops', label: 'Drops', icon: '🎯' },
  { id: 'inventario', label: 'Inventario', icon: '👕' },
  { id: 'ventas', label: 'Ventas', icon: '💰' },
  { id: 'pedidos', label: 'Pedidos', icon: '📦' },
  { id: 'clientes', label: 'Clientes', icon: '👥' },
  { id: 'gastos', label: 'Gastos', icon: '💸' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'proveedores', label: 'Proveedores', icon: '🏭' },
  { id: 'metas', label: 'Metas', icon: '🎯' },
  { id: 'notas', label: 'Notas', icon: '📝' },
] as const

type TabId = typeof TABS[number]['id']
type ThemeMode = 'light' | 'dark' | 'black'

export default function AppScreen() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [drops, setDrops] = useState<Drop[]>([])
  const [dropsLoading, setDropsLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zr-theme') as ThemeMode | null
    if (saved && ['light', 'dark', 'black'].includes(saved)) setTheme(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('zr-theme', theme)
    document.documentElement.classList.toggle('dark', theme !== 'light')
  }, [theme])

  // Load drops
  const loadDrops = useCallback(async () => {
    try {
      setDropsLoading(true)
      const data = await api.drops.list()
      setDrops(data)
    } catch { toast.error('Error al cargar drops') }
    finally { setDropsLoading(false) }
  }, [])

  useEffect(() => { loadDrops() }, [loadDrops])

  // Import handler
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.name.endsWith('.json')) { toast.error('Solo se aceptan archivos .json'); return }
    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const result = await api.import.data(data)
      toast.success(`${result.message} — ${result.total} registros importados`)
      setImportOpen(false)
      loadDrops()
    } catch (err: any) { toast.error(err.message || 'Error al importar') }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  // Export handler
  const handleExport = async () => {
    try {
      const data = await api.export.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `dforzze-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click(); URL.revokeObjectURL(url)
      toast.success('Datos exportados ✓')
    } catch { toast.error('Error al exportar') }
  }

  // Download source for Vercel
  const handleDownloadSource = async () => {
    try {
      setDownloading(true)
      const res = await fetch('/api/download-source')
      if (!res.ok) throw new Error('Error al descargar')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `dforzzest-vercel-${new Date().toISOString().slice(0, 10)}.zip`
      a.click(); URL.revokeObjectURL(url)
      toast.success('App descargada — lista para Vercel ✓')
    } catch { toast.error('Error al descargar') }
    finally { setDownloading(false) }
  }

  // Theme styles
  const bg = theme === 'light' ? '#f8f5ff' : theme === 'dark' ? '#0f0d1a' : '#000'
  const card = theme === 'light' ? '#fff' : theme === 'dark' ? '#1a1730' : '#111'
  const border = theme === 'light' ? '#e9e3ff' : theme === 'dark' ? '#2d2a4a' : '#222'
  const text = theme === 'light' ? '#1e1b4b' : theme === 'dark' ? '#e2e0ff' : '#fff'
  const muted = theme === 'light' ? '#6b7280' : theme === 'dark' ? '#9ca3af' : '#888'

  const renderTab = () => {
    const props = { drops, loadDrops, theme }
    switch (activeTab) {
      case 'dashboard': return <DashboardTab {...props} />
      case 'drops': return <DropsTab {...props} />
      case 'inventario': return <InventarioTab {...props} />
      case 'ventas': return <VentasTab {...props} />
      case 'pedidos': return <PedidosTab {...props} />
      case 'clientes': return <ClientesTab {...props} />
      case 'gastos': return <GastosTab {...props} />
      case 'analytics': return <AnalyticsTab {...props} />
      case 'proveedores': return <ProveedoresTab {...props} />
      case 'metas': return <MetasTab {...props} />
      case 'notas': return <NotasTab {...props} />
      default: return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg, color: text }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-xl" style={{ background: theme === 'light' ? 'rgba(248,245,255,0.92)' : theme === 'dark' ? 'rgba(15,13,26,0.92)' : 'rgba(0,0,0,0.92)', borderColor: border }}>
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden bg-white border border-gray-100 shadow-sm">
              <Image src="/dforzze-logo.png" alt="Dforzze" width={36} height={36} className="object-contain" />
            </div>
            <h1 className="text-lg font-bold hidden sm:block bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>Dforzze</h1>
          </div>

          {/* Desktop Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === tab.id ? 'text-white shadow-md' : 'hover:bg-white/5'}`}
                style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' } : { color: muted }}>
                <span>{tab.icon}</span><span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'black' : 'light')} className="rounded-xl h-9 w-9">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-xl h-9 px-2 gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                    {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline text-sm">{session?.user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  <Badge className="mt-1 text-[10px] bg-purple-100 text-purple-700">{session?.user?.role}</Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadSource} disabled={downloading} className="cursor-pointer text-purple-700 font-semibold">
                  {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Monitor className="w-4 h-4 mr-2" />}
                  {downloading ? 'Descargando...' : '🚀 Descargar para Vercel'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setImportOpen(true)} className="cursor-pointer"><Upload className="w-4 h-4 mr-2" />Importar Datos</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} className="cursor-pointer"><Download className="w-4 h-4 mr-2" />Exportar JSON</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-red-600 cursor-pointer"><LogOut className="w-4 h-4 mr-2" />Cerrar Sesión</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile scrolling tabs */}
        <div className="lg:hidden overflow-x-auto border-t" style={{ borderColor: border }}>
          <div className="flex items-center gap-1 px-2 py-1.5 min-w-max">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap ${activeTab === tab.id ? 'text-white shadow-sm' : ''}`}
                style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' } : { color: muted }}>
                <span>{tab.icon}</span><span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-6">
        {renderTab()}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t py-4" style={{ background: bg, borderColor: border }}>
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs" style={{ color: muted }}>
          <div className="flex items-center gap-1.5">
            <Image src="/dforzze-logo-small.png" alt="Dforzze" width={14} height={14} className="object-contain" />
            <span>Dforzze — Gestión inteligente para tu negocio</span>
          </div>
          <span>© {new Date().getFullYear()} Todos los derechos reservados</span>
        </div>
      </footer>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: card, border: `1px solid ${border}`, color: text }}>
          <DialogHeader>
            <DialogTitle>📥 Importar Datos</DialogTitle>
            <DialogDescription style={{ color: muted }}>Importa tus datos del archivo HTML original (formato JSON)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <p className="font-semibold" style={{ color: '#8b5cf6' }}>📋 Cómo exportar tus datos:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs" style={{ color: muted }}>
                <li>Abre tu archivo HTML original en el navegador</li>
                <li>Haz clic en &quot;Exportar JSON&quot; en el footer</li>
                <li>Se descargará un archivo .json</li>
                <li>Selecciona ese archivo aquí</li>
              </ol>
            </div>
            <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-xs text-yellow-600">⚠️ Los datos se agregarán a los existentes. Los duplicados serán saltados.</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} disabled={importing} className="w-full h-12 rounded-xl text-white font-semibold" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
              {importing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Importando...</> : <><Upload className="w-5 h-5 mr-2" />Seleccionar archivo JSON</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
