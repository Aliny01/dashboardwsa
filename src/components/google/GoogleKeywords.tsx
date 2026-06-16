'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import type { GoogleKeyword } from '@/types/google'

interface GoogleKeywordsProps {
  keywords: GoogleKeyword[]
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

function CampaignKeywords({ campaignName, keywords }: { campaignName: string; keywords: GoogleKeyword[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? keywords.slice(0, 30) : keywords.slice(0, 10)
  const hasMore = keywords.length > 10

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600 dark:text-zinc-300 uppercase tracking-wide">
          {campaignName}
        </p>
        <span className="text-xs text-gray-400 dark:text-zinc-500">{keywords.length} palavras-chave</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800">
            <th className="text-left px-4 py-2.5 font-medium text-gray-400 dark:text-zinc-500 text-xs">Palavra-chave</th>
            <th className="text-right px-4 py-2.5 font-medium text-gray-400 dark:text-zinc-500 text-xs">Impressões</th>
            <th className="text-right px-4 py-2.5 font-medium text-gray-400 dark:text-zinc-500 text-xs">Cliques</th>
            <th className="text-right px-4 py-2.5 font-medium text-gray-400 dark:text-zinc-500 text-xs">CPC</th>
            <th className="text-right px-4 py-2.5 font-medium text-gray-400 dark:text-zinc-500 text-xs">Conv.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
          {visible.map((k, i) => (
            <tr key={i} className="bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
              <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-zinc-200 max-w-[200px] truncate">
                {k.keyword}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-gray-600 dark:text-zinc-400">
                {fmt(k.impressions)}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-gray-900 dark:text-zinc-100">
                {fmt(k.clicks)}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-gray-500 dark:text-zinc-400">
                {k.cpc > 0 ? fmt(k.cpc, 'currency') : '—'}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums font-medium text-blue-600 dark:text-blue-400">
                {k.conversions > 0 ? fmt(k.conversions) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasMore && (
        <div className="border-t border-gray-100 dark:border-zinc-800 px-4 py-2.5 bg-white dark:bg-zinc-950">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
          >
            <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', expanded && 'rotate-180')} />
            {expanded ? 'Ver menos' : `Ver mais ${Math.min(keywords.length - 10, 20)} palavras`}
          </button>
        </div>
      )}
    </div>
  )
}

export function GoogleKeywords({ keywords }: GoogleKeywordsProps) {
  const byCampaign = keywords.reduce<Record<string, { name: string; keywords: GoogleKeyword[] }>>(
    (acc, k) => {
      if (!acc[k.campaignId]) acc[k.campaignId] = { name: k.campaignName, keywords: [] }
      acc[k.campaignId].keywords.push(k)
      return acc
    },
    {}
  )

  if (!Object.keys(byCampaign).length) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        Nenhuma palavra-chave com impressões no período.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {Object.values(byCampaign).map(({ name, keywords: kws }) => (
        <CampaignKeywords key={name} campaignName={name} keywords={kws} />
      ))}
    </div>
  )
}
