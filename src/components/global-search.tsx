'use client'

import { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, Package, ShoppingCart, Users, DollarSign } from 'lucide-react'
import { api } from '@/lib/api'

interface SearchResult {
  type: 'producto' | 'venta' | 'cliente' | 'gasto'
  id: string
  title: string
  subtitle?: string
  metadata?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  theme: 'light' | 'dark' | 'black'
}

const THEME_STYLES = {
  light: {
    card: '#ffffff',
    border: '#e9e3ff',
    textPrimary: '#1a1333',
    textSecondary: '#5a4d7a',
    textMuted: '#7c6f9b',
    inputBg: '#f3eeff',
    inputBorder: '#e0d5f5',
    accentSolid: '#8b5cf6',
    hoverBg: '#faf7ff',
  },
  dark: {
    card: '#1a1730',
    border: '#2d2a4a',
    textPrimary: '#e8e0f0',
    textSecondary: '#a99cc4',
    textMuted: '#8b82a8',
    inputBg: '#15122a',
    inputBorder: '#2d2a4a',
    accentSolid: '#8b5cf6',
    hoverBg: '#221f3a',
  },
  black: {
    card: '#111111',
    border: '#222222',
    textPrimary: '#e0e0e0',
    textSecondary: '#999999',
    textMuted: '#777777',
    inputBg: '#0a0a0a',
    inputBorder: '#222222',
    accentSolid: '#8b5cf6',
    hoverBg: '#1a1a1a',
  },
} as const

const TYPE_CONFIG = {
  producto: { icon: Package, label: 'Producto', color: '#8b5cf6' },
  venta: { icon: ShoppingCart, label: 'Venta', color: '#10b981' },
  cliente: { icon: Users, label: 'Cliente', color: '#3b82f6' },
  gasto: { icon: DollarSign, label: 'Gasto', color: '#ef4444' },
}

export default function GlobalSearch({ open, onOpenChange, theme }: Props) {
  const ts = THEME_STYLES[theme]
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const data = await api.buscar.global(q)
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl"
        style={{ background: ts.card, borderColor: ts.border, color: ts.textPrimary }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: ts.textPrimary }}>
            <Search className="w-5 h-5" style={{ color: ts.accentSolid }} />
            Búsqueda Global
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: ts.textMuted }}
            />
            <Input
              placeholder="Buscar productos, ventas, clientes, gastos..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="rounded-xl pl-9 h-12 text-base"
              style={{
                background: ts.inputBg,
                borderColor: ts.inputBorder,
                color: ts.textPrimary,
              }}
              autoFocus
            />
            {loading && (
              <Loader2
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin"
                style={{ color: ts.accentSolid }}
              />
            )}
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto space-y-1">
            {results.length === 0 && query.trim() && !loading && (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: ts.textMuted }}>
                  No se encontraron resultados
                </p>
              </div>
            )}

            {results.map(result => {
              const config = TYPE_CONFIG[result.type]
              const Icon = config.icon
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  className="w-full text-left p-3 rounded-xl transition-colors"
                  style={{
                    background: 'transparent',
                    ':hover': { background: ts.hoverBg },
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = ts.hoverBg
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                  onClick={() => onOpenChange(false)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${config.color}15` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-sm font-semibold truncate"
                          style={{ color: ts.textPrimary }}
                        >
                          {result.title}
                        </span>
                        <Badge
                          className="text-[10px] font-medium px-1.5 py-0"
                          style={{
                            background: `${config.color}15`,
                            color: config.color,
                            border: 'none',
                          }}
                        >
                          {config.label}
                        </Badge>
                      </div>
                      {result.subtitle && (
                        <p className="text-xs truncate" style={{ color: ts.textSecondary }}>
                          {result.subtitle}
                        </p>
                      )}
                      {result.metadata && (
                        <p className="text-[10px] mt-0.5" style={{ color: ts.textMuted }}>
                          {result.metadata}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {!query.trim() && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto mb-3" style={{ color: ts.textMuted, opacity: 0.3 }} />
              <p className="text-sm" style={{ color: ts.textMuted }}>
                Escribe para buscar en toda la app
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
