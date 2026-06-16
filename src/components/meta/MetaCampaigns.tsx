'use client'

import React, { useState } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, Play, Image, ExternalLink } from 'lucide-react'
import type { MetaCampaignSummary } from '@/types/meta'
import type { MetaAdCreative } from '@/types/meta'

interface MetaCampaignsProps {
  campaigns: MetaCampaignSummary[]
  creatives: MetaAdCreative[]
}

const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_LEADS: 'Formulário / Lead',
  OUTCOME_ENGAGEMENT: 'Engajamento',
  OUTCOME_TRAFFIC: 'Tráfego',
  OUTCOME_AWARENESS: 'Reconhecimento',
  MESSAGES: 'Mensagem',
  PAGE_LIKES: 'Seguidores',
  LINK_CLICKS: 'Cliques no link',
}

function fmt(n: number, style: 'currency' | 'decimal' = 'decimal') {
  if (style === 'currency') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(n)
  }
  return new Intl.NumberFormat('pt-BR').format(Math.round(n))
}

function CreativeCard({ ad }: { ad: MetaAdCreative }) {
  const [selected, setSelected] = useState(false)

  return (
    <>
      <div
        onClick={() => setSelected(true)}
        className="group cursor-pointer rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden hover:border-blue-400 transition-all w-24 shrink-0"
      >
        <div className="relative w-24 h-24 bg-gray-100 dark:bg-zinc-800">
          {ad.thumbnailUrl || ad.imageUrl ? (
            <img
              src={ad.thumbnailUrl ?? ad.imageUrl}
              alt={ad.adName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Image className="w-6 h-6" />
            </div>
          )}
          {ad.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-gray-900 ml-0.5" />
              </div>
            </div>
          )}
        </div>
        <div className="px-1.5 py-1 bg-white dark:bg-zinc-900">
          <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate w-20">
            {ad.adName}
          </p>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video bg-gray-100 dark:bg-zinc-800">
              {ad.thumbnailUrl || ad.imageUrl ? (
                <img
                  src={ad.thumbnailUrl ?? ad.imageUrl}
                  alt={ad.adName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Image className="w-12 h-12" />
                </div>
              )}
              {ad.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-7 h-7 text-gray-900 ml-1" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-zinc-100">{ad.adName}</p>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                  {ad.type === 'video' ? 'Anúncio em vídeo' : 'Anúncio em imagem'}
                </p>
              </div>
              <div className="flex gap-2">
                {ad.permalinkUrl && (
                  <a
                    href={ad.permalinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver anúncio completo
                  </a>
                )}
                <button
                  onClick={() => setSelected(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function MetaCampaigns({ campaigns, creatives }: MetaCampaignsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!campaigns.length) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        Nenhuma campanha encontrada no período.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Campanha</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Status</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Investido</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Alcance</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Cliques</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">CPC</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Leads / Conversas</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => {
            const campaignCreatives = creatives.filter((cr) => cr.campaignId === c.id && (cr.spend ?? 0) > 0)
            const isExpanded = expandedId === c.id

            return (
              <React.Fragment key={c.id}>
                <tr
                  className="bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors border-t border-gray-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-zinc-100 max-w-[200px] truncate">
                    {c.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'inline-block text-xs font-medium px-2.5 py-0.5 rounded-full',
                      c.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'
                    )}>
                      {c.status === 'ACTIVE' ? 'Ativa' : 'Pausada'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-zinc-300">
                    {fmt(c.spend, 'currency')}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-zinc-300">
                    {fmt(c.reach)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-zinc-300">
                    {fmt(c.clicks)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-zinc-300">
                    {c.cpc > 0 ? fmt(c.cpc, 'currency') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900 dark:text-zinc-100">
                    {c.leads > 0 && c.messages > 0
                      ? `${fmt(c.leads)} / ${fmt(c.messages)}`
                      : c.leads > 0
                      ? fmt(c.leads)
                      : c.messages > 0
                      ? fmt(c.messages)
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {campaignCreatives.length > 0 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        className={clsx(
                          'flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all whitespace-nowrap',
                          isExpanded
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-zinc-800 dark:text-zinc-400'
                        )}
                      >
                        Ver anúncios ({campaignCreatives.length})
                        <ChevronDown className={clsx('w-3 h-3 transition-transform', isExpanded && 'rotate-180')} />
                      </button>
                    )}
                  </td>
                </tr>

                {/* Linha expandida com criativos */}
                {isExpanded && campaignCreatives.length > 0 && (
                  <tr
                    className="bg-blue-50/50 dark:bg-blue-950/10 border-t border-blue-100 dark:border-blue-900"
                  >
                    <td colSpan={8} className="px-6 py-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-3">
                        Anúncios desta campanha
                      </p>
                      <div className="flex gap-4 flex-wrap">
                        {campaignCreatives.map((ad) => {
                          const conversions = (ad.leads ?? 0) + (ad.messages ?? 0)
                          const costPerConv = conversions > 0 && ad.spend ? ad.spend / conversions : null
                          return (
                            <div key={ad.adId} className="flex flex-col gap-1.5">
                              <CreativeCard ad={ad} />
                              <div className="w-24 space-y-0.5">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-gray-400">Conversões</span>
                                  <span className={clsx('font-semibold', conversions > 0 ? 'text-blue-600' : 'text-gray-400')}>
                                    {conversions > 0 ? conversions : '—'}
                                  </span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-gray-400">Custo/conv.</span>
                                  <span className={clsx('font-semibold', costPerConv ? 'text-gray-700 dark:text-zinc-300' : 'text-gray-400')}>
                                    {costPerConv ? fmt(costPerConv, 'currency') : '—'}
                                  </span>
                                </div>
                                {(ad.spend ?? 0) > 0 && (
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-400">Investido</span>
                                    <span className="text-gray-500">{fmt(ad.spend!, 'currency')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
