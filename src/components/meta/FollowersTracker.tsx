'use client'

import React, { useState } from 'react'
import { TrendingUp, TrendingDown, Play, Image, ExternalLink, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import type { MetaCampaignSummary, MetaAdCreative } from '@/types/meta'
import followerHistory from '@/data/followers.json'

interface FollowerEntry {
  id: string
  weekEnd: string
  totalFollowers: number
  investedAmount: number
  newFollowers?: number
}

interface FollowersTrackerProps {
  campaigns: MetaCampaignSummary[]
  creatives: MetaAdCreative[]
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

function calcCostPerFollower(invested: number, newFollowers: number): number | null {
  if (newFollowers <= 0) return null
  return invested / newFollowers
}

function CreativeThumb({ ad }: { ad: MetaAdCreative }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group cursor-pointer rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden hover:border-blue-400 transition-all w-24 shrink-0"
      >
        <div className="relative w-24 h-24 bg-gray-100 dark:bg-zinc-800">
          {ad.thumbnailUrl || ad.imageUrl ? (
            <img src={ad.thumbnailUrl ?? ad.imageUrl} alt={ad.adName} className="w-full h-full object-cover" />
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
          <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate w-20">{ad.adName}</p>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-video bg-gray-100 dark:bg-zinc-800">
              {ad.thumbnailUrl || ad.imageUrl ? (
                <img src={ad.thumbnailUrl ?? ad.imageUrl} alt={ad.adName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><Image className="w-12 h-12" /></div>
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
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{ad.type === 'video' ? 'Anúncio em vídeo' : 'Anúncio em imagem'}</p>
              </div>
              <div className="flex gap-2">
                {ad.permalinkUrl && (
                  <a href={ad.permalinkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    Ver anúncio completo
                  </a>
                )}
                <button onClick={() => setOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 transition-colors">
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

export function FollowersTracker({ campaigns, creatives }: FollowersTrackerProps) {
  const FOLLOWERS_KEYWORDS = [
    '[TRÁFEGO] [SEGUIDORES]',
    'Post do Instagram',
    'Publicação do Instagram',
  ]

  const followersCampaigns = campaigns.filter((c) =>
    c.spend > 0 &&
    FOLLOWERS_KEYWORDS.some((kw) =>
      c.name.toLowerCase().includes(kw.toLowerCase())
    )
  )

  const [expandedId, setExpandedId] = useState<string | null>(null)

  const entries: FollowerEntry[] = [...followerHistory].sort((a, b) =>
    a.weekEnd.localeCompare(b.weekEnd)
  )

  const last = entries[entries.length - 1]
  const prev = entries[entries.length - 2]
  const lastNew = last?.newFollowers ?? null
  const lastCost = last && lastNew ? calcCostPerFollower(last.investedAmount, lastNew) : null
  const prevNew = prev?.newFollowers ?? null
  const prevCost = prev && prevNew ? calcCostPerFollower(prev.investedAmount, prevNew) : null

  const costDelta = lastCost && prevCost
    ? ((lastCost - prevCost) / prevCost) * 100
    : null

  return (
    <section className="space-y-4">
      {/* Summary cards */}
      {last && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
              Total de seguidores
            </p>
            <p className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-zinc-100">
              {fmt(last.totalFollowers)}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
              Novos na semana
            </p>
            <p className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-zinc-100">
              {lastNew !== null ? `+${fmt(lastNew)}` : '—'}
            </p>
          </div>

          <div className={clsx(
            'rounded-xl border p-4',
            lastCost && lastCost <= 1
              ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900'
              : 'bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800'
          )}>
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
              Custo por seguidor
            </p>
            <p className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-zinc-100">
              {lastCost !== null ? fmt(lastCost, 'currency') : '—'}
            </p>
            {costDelta !== null && (
              <div className="flex items-center gap-1 mt-1.5">
                {costDelta <= 0
                  ? <TrendingDown className="w-3 h-3 text-green-600" />
                  : <TrendingUp className="w-3 h-3 text-red-500" />
                }
                <span className={clsx(
                  'text-xs font-medium',
                  costDelta <= 0 ? 'text-green-600' : 'text-red-500'
                )}>
                  {costDelta > 0 ? '+' : ''}{costDelta.toFixed(1)}% vs semana ant.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campanhas de seguidores */}
      {followersCampaigns.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Campanhas de seguidores
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              investido: <span className="font-medium text-gray-500 dark:text-zinc-400">{fmt(followersCampaigns.reduce((s, c) => s + c.spend, 0), 'currency')}</span>
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-zinc-400">Campanha</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500 dark:text-zinc-400">Cliques / Visitas</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500 dark:text-zinc-400">Alcance</th>
                <th className="text-right px-4 py-2 font-medium text-gray-400 dark:text-zinc-500">Investido</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {followersCampaigns.map((c) => {
                const ads = creatives.filter((cr) => cr.campaignId === c.id)
                const isExpanded = expandedId === c.id
                return (
                  <React.Fragment key={c.id}>
                    <tr className="bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800">
                      <td className="px-4 py-2 text-gray-700 dark:text-zinc-300 max-w-[240px] truncate">{c.name}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-semibold text-gray-900 dark:text-zinc-100">
                        {c.link_clicks > 0 ? fmt(c.link_clicks) : '—'}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-500 dark:text-zinc-400">
                        {fmt(c.reach)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-xs text-gray-400 dark:text-zinc-500">
                        {fmt(c.spend, 'currency')}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {ads.length > 0 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : c.id)}
                            className={clsx(
                              'flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all whitespace-nowrap',
                              isExpanded
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-zinc-800 dark:text-zinc-400'
                            )}
                          >
                            Ver anúncios ({ads.length})
                            <ChevronDown className={clsx('w-3 h-3 transition-transform', isExpanded && 'rotate-180')} />
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && ads.length > 0 && (
                      <tr className="bg-blue-50/50 dark:bg-blue-950/10 border-t border-blue-100 dark:border-blue-900">
                        <td colSpan={5} className="px-6 py-4">
                          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-3">Anúncios desta campanha</p>
                          <div className="flex gap-4 flex-wrap">
                            {ads.map((ad) => {
                              const linkClicks = ad.clicks ?? 0
                              const costPerClick = linkClicks > 0 && ad.spend ? ad.spend / linkClicks : null
                              return (
                                <div key={ad.adId} className="flex flex-col gap-1.5">
                                  <CreativeThumb ad={ad} />
                                  <div className="w-24 space-y-0.5">
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-gray-400">Visitas</span>
                                      <span className={clsx('font-semibold', linkClicks > 0 ? 'text-blue-600' : 'text-gray-400')}>
                                        {linkClicks > 0 ? fmt(linkClicks) : '—'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-gray-400">Custo/visita</span>
                                      <span className={clsx('font-semibold', costPerClick ? 'text-gray-700 dark:text-zinc-300' : 'text-gray-400')}>
                                        {costPerClick ? fmt(costPerClick, 'currency') : '—'}
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
      )}

      {/* Histórico */}
      {entries.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Data</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Total seguidores</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Novos</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Investido</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Custo/seguidor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {[...entries].reverse().map((entry, i) => {
                const newFollowers = entry.newFollowers ?? null
                const costPer = newFollowers ? calcCostPerFollower(entry.investedAmount, newFollowers) : null
                const isLatest = i === 0
                return (
                  <tr
                    key={entry.id}
                    className={clsx(
                      'transition-colors',
                      isLatest
                        ? 'bg-blue-50/50 dark:bg-blue-950/20'
                        : 'bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900'
                    )}
                  >
                    <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">
                      {new Date(entry.weekEnd + 'T12:00:00').toLocaleDateString('pt-BR')}
                      {isLatest && (
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          última
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-zinc-300">
                      {fmt(entry.totalFollowers)}
                    </td>
                    <td className={clsx(
                      'px-4 py-3 text-right tabular-nums font-medium',
                      newFollowers && newFollowers > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                    )}>
                      {newFollowers ? `+${fmt(newFollowers)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-zinc-300">
                      {fmt(entry.investedAmount, 'currency')}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900 dark:text-zinc-100">
                      {costPer !== null ? fmt(costPer, 'currency') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
