'use client'

import { MetricCard } from '@/components/ui/MetricCard'
import type { GoogleDashboardData } from '@/types/google'

interface GoogleOverviewProps {
  data: GoogleDashboardData
}

function fmt(n: number, style: 'currency' | 'decimal' = 'decimal', decimals = 0) {
  if (style === 'currency') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(n)
  }
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export function GoogleOverview({ data }: GoogleOverviewProps) {
  const { overview } = data
  const bd = overview.conversionBreakdown
  const hasConversions = bd.total > 0

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetricCard
          label="Valor investido"
          value={fmt(overview.cost, 'currency')}
          highlight
        />
        <MetricCard
          label="Cliques"
          value={fmt(overview.clicks)}
        />
        <MetricCard
          label="Impressões"
          value={fmt(overview.impressions)}
        />
        <MetricCard
          label="CTR"
          value={`${fmt(overview.ctr, 'decimal', 2)}%`}
        />
        <MetricCard
          label="CPC médio"
          value={fmt(overview.cpc, 'currency')}
        />
        <MetricCard
          label="Total de conversões"
          value={hasConversions ? fmt(bd.total) : '—'}
          highlight={hasConversions}
        />
      </div>

      {/* Breakdown de conversões */}
      {hasConversions && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {bd.calls > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900 p-3">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                Cliques para ligar
              </p>
              <p className="text-xl font-semibold tabular-nums text-blue-700 dark:text-blue-300">{fmt(bd.calls)}</p>
            </div>
          )}
          {bd.contacts > 0 && (
            <div className="bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-100 dark:border-green-900 p-3">
              <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">
                Contato no site
              </p>
              <p className="text-xl font-semibold tabular-nums text-green-700 dark:text-green-300">{fmt(bd.contacts)}</p>
            </div>
          )}
          {bd.directions > 0 && (
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-100 dark:border-orange-900 p-3">
              <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-1">
                Ver rota
              </p>
              <p className="text-xl font-semibold tabular-nums text-orange-700 dark:text-orange-300">{fmt(bd.directions)}</p>
            </div>
          )}
          {bd.conversations > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900 p-3">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                WhatsApp
              </p>
              <p className="text-xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{fmt(bd.conversations)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
