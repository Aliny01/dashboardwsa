'use client'

import { MetricCard } from '@/components/ui/MetricCard'
import type { MetaDashboardData } from '@/types/meta'

interface MetaOverviewProps {
  data: MetaDashboardData
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

export function MetaOverview({ data }: MetaOverviewProps) {
  const { overview, instagram } = data

  return (
    <section className="space-y-4">
      {/* Instagram followers (if available) */}
      {instagram && (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl border border-purple-100 dark:border-purple-900">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
            IG
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">
              @{instagram.username}
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {fmt(instagram.followers_count)} seguidores
            </p>
          </div>
        </div>
      )}

      {/* Main KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Valor investido"
          value={fmt(overview.spend, 'currency')}
          highlight
        />
        <MetricCard
          label="Alcance"
          value={fmt(overview.reach)}
        />
        <MetricCard
          label="Impressões"
          value={fmt(overview.impressions)}
        />
        <MetricCard
          label="Cliques"
          value={fmt(overview.clicks)}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="CPC médio"
          value={fmt(overview.cpc, 'currency')}
        />
        <MetricCard
          label="CPM"
          value={fmt(overview.cpm, 'currency')}
        />
        <MetricCard
          label="Leads"
          value={fmt(overview.leads)}
          highlight={overview.leads > 0}
        />
        <MetricCard
          label="Conversas iniciadas"
          value={fmt(overview.messages)}
          highlight={overview.messages > 0}
        />
      </div>
    </section>
  )
}
