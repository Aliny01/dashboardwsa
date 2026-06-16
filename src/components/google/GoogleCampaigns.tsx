'use client'

import { clsx } from 'clsx'
import type { GoogleCampaign } from '@/types/google'

interface GoogleCampaignsProps {
  campaigns: GoogleCampaign[]
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

function ConvBadge({ label, value, color }: { label: string; value: number; color: string }) {
  if (value <= 0) return null
  return (
    <span className={clsx('inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md', color)}>
      {label}: {value}
    </span>
  )
}

const STATUS_LABELS: Record<string, string> = {
  ENABLED: 'Ativa',
  PAUSED: 'Pausada',
  REMOVED: 'Removida',
}

export function GoogleCampaigns({ campaigns }: GoogleCampaignsProps) {
  const active = campaigns.filter((c) => c.cost > 0)

  if (!active.length) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        Nenhuma campanha com gasto no período.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Campanha</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Status</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Investido</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Cliques</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">CPC</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">CTR</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Conversões</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
          {active.map((c) => {
            const bd = c.conversionBreakdown
            const hasConversions = bd.total > 0
            return (
              <tr
                key={c.id}
                className="bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-zinc-100 max-w-[200px] truncate">
                  {c.name}
                </td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'inline-block text-xs font-medium px-2.5 py-0.5 rounded-full',
                    c.status === 'ENABLED'
                      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'
                  )}>
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-zinc-300">
                  {fmt(c.cost, 'currency')}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-zinc-300">
                  {fmt(c.clicks)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-zinc-300">
                  {c.cpc > 0 ? fmt(c.cpc, 'currency') : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-zinc-300">
                  {fmt(c.ctr * 100, 'decimal', 2)}%
                </td>
                <td className="px-4 py-3">
                  {hasConversions ? (
                    <div className="flex flex-wrap gap-1">
                      <ConvBadge label="Ligações" value={bd.calls} color="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" />
                      <ConvBadge label="Contato no site" value={bd.contacts} color="bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300" />
                      <ConvBadge label="Rota" value={bd.directions} color="bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300" />
                      <ConvBadge label="WhatsApp" value={bd.conversations} color="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" />
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
