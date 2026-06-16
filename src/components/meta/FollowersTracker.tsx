'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Users, TrendingUp, TrendingDown, Plus, Trash2, ChevronDown, Play, Image, ExternalLink, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { MetaCampaignSummary, MetaAdCreative } from '@/types/meta'

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

function calcNewFollowers(entries: FollowerEntry[], index: number): number {
  if (index === 0) return 0
  return entries[index].totalFollowers - entries[index - 1].totalFollowers
}

function calcCostPerFollower(invested: number, newFollowers: number): number | null {
  if (newFollowers <= 0) return null
  return invested / newFollowers
}

const STORAGE_KEY = 'wsa_followers_history'

const SEED_ENTRIES: FollowerEntry[] = [
  { id: '1', weekEnd: '2026-03-30', totalFollowers: 101444, investedAmount: 372.68,  newFollowers: 484 },
  { id: '2', weekEnd: '2026-04-06', totalFollowers: 101608, investedAmount: 275.52,  newFollowers: 164 },
  { id: '3', weekEnd: '2026-04-22', totalFollowers: 102236, investedAmount: 489.84,  newFollowers: 628 },
  { id: '4', weekEnd: '2026-04-28', totalFollowers: 102564, investedAmount: 344.40,  newFollowers: 328 },
  { id: '5', weekEnd: '2026-05-04', totalFollowers: 102957, investedAmount: 345.84,  newFollowers: 393 },
  { id: '6', weekEnd: '2026-05-14', totalFollowers: 103647, investedAmount: 476.10,  newFollowers: 690 },
]

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
  const [entries, setEntries] = useState<FollowerEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ weekEnd: '', totalFollowers: '' })
  const [error, setError] = useState('')
  const [investLoading, setInvestLoading] = useState(false)
  const [fetchedInvested, setFetchedInvested] = useState<number | null>(null)

  const fetchInvestedForPeriod = useCallback(async (newDate: string) => {
    const sorted = [...entries].sort((a, b) => a.weekEnd.localeCompare(b.weekEnd))
    const prevEntry = sorted.findLast((e) => e.weekEnd < newDate)
    if (!prevEntry) { setFetchedInvested(null); return }

    setInvestLoading(true)
    setFetchedInvested(null)
    try {
      const res = await fetch(`/api/meta?since=${prevEntry.weekEnd}&until=${newDate}`)
      if (!res.ok) return
      const data = await res.json()
      const spend = (data.campaigns ?? [])
        .filter((c: { name: string; spend: number }) =>
          FOLLOWERS_KEYWORDS.some((kw) => c.name.toLowerCase().includes(kw.toLowerCase()))
        )
        .reduce((sum: number, c: { spend: number }) => sum + c.spend, 0)
      setFetchedInvested(spend)
    } catch {
      setFetchedInvested(null)
    } finally {
      setInvestLoading(false)
    }
  }, [entries])

  // Load from localStorage, seed se vazio, migra entradas sem newFollowers
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const parsed: FollowerEntry[] = saved ? JSON.parse(saved) : []

      if (parsed.length === 0) {
        setEntries(SEED_ENTRIES)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ENTRIES))
        return
      }

      // Migração: preenche newFollowers nas entradas que não têm
      const sorted = [...parsed].sort((a, b) => a.weekEnd.localeCompare(b.weekEnd))
      const migrated = sorted.map((entry, i) => {
        if (entry.newFollowers !== undefined) return entry
        const prev = sorted[i - 1]
        if (prev) return { ...entry, newFollowers: entry.totalFollowers - prev.totalFollowers }
        // Sem entrada anterior: usa o valor conhecido do seed se existir
        const seedMatch = SEED_ENTRIES.find((s) => s.weekEnd === entry.weekEnd)
        return { ...entry, newFollowers: seedMatch?.newFollowers }
      })

      const final = migrated
      setEntries(final)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(final))
    } catch {}
  }, [])

  // Save to localStorage
  function save(updated: FollowerEntry[]) {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  function handleAdd() {
    setError('')
    const total = parseInt(form.totalFollowers.replace(/\D/g, ''))

    if (!form.weekEnd) return setError('Informe a data do domingo.')
    if (isNaN(total) || total <= 0) return setError('Total de seguidores inválido.')

    const sorted = [...entries].sort((a, b) => a.weekEnd.localeCompare(b.weekEnd))
    const prevEntry = sorted.findLast((e) => e.weekEnd < form.weekEnd)
    const newEntry: FollowerEntry = {
      id: Date.now().toString(),
      weekEnd: form.weekEnd,
      totalFollowers: total,
      investedAmount: fetchedInvested ?? 0,
      newFollowers: prevEntry ? total - prevEntry.totalFollowers : undefined,
    }

    const updated = [...entries, newEntry].sort((a, b) =>
      a.weekEnd.localeCompare(b.weekEnd)
    )
    save(updated)
    setForm({ weekEnd: '', totalFollowers: '' })
    setShowForm(false)
  }

  function handleDelete(id: string) {
    save(entries.filter((e) => e.id !== id))
  }

  // Last entry stats
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

      {/* Campanhas de seguidores detectadas */}
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
                      <td className="px-4 py-2 text-gray-700 dark:text-zinc-300 max-w-[240px] truncate">
                        {c.name}
                      </td>
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
                          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-3">
                            Anúncios desta campanha
                          </p>
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

      {/* History table */}
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
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {[...entries].reverse().map((entry, reversedIndex) => {
                const newFollowers = entry.newFollowers ?? null
                const costPer = newFollowers ? calcCostPerFollower(entry.investedAmount, newFollowers) : null
                const isLatest = reversedIndex === 0

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
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-gray-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-colors"
                        title="Remover entrada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && !showForm && (
        <div className="text-center py-10 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl text-gray-400 text-sm">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Nenhum registro ainda. Adicione o primeiro!
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-blue-200 dark:border-blue-900 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
            Novo registro semanal
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-zinc-400 mb-1 block">
                Data do registro
              </label>
              <input
                type="date"
                value={form.weekEnd}
                onChange={(e) => {
                  setForm({ ...form, weekEnd: e.target.value })
                  if (e.target.value) fetchInvestedForPeriod(e.target.value)
                }}
                className="w-full text-sm border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-zinc-400 mb-1 block">
                Total de seguidores
              </label>
              <input
                type="number"
                placeholder="ex: 102957"
                value={form.totalFollowers}
                onChange={(e) => setForm({ ...form, totalFollowers: e.target.value })}
                className="w-full text-sm border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100"
              />
            </div>
          </div>
          {investLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Buscando investimento no período…
            </div>
          )}
          {!investLoading && fetchedInvested !== null && (
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Investido no período (último registro → esta data):{' '}
              <span className="font-semibold text-blue-600">{fmt(fetchedInvested, 'currency')}</span>
            </p>
          )}
          {!investLoading && fetchedInvested === null && form.weekEnd && (
            <p className="text-xs text-gray-400">
              Nenhum registro anterior encontrado — investido será R$ 0,00.
            </p>
          )}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Salvar
            </button>
            <button
              onClick={() => { setShowForm(false); setError('') }}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-zinc-400 text-sm rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar registro desta semana
        </button>
      )}
    </section>
  )
}
