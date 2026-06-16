'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertCircle, Share2, BarChart2, FileText, Filter } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'

import { MetaOverview } from '@/components/meta/MetaOverview'
import { MetaCampaigns } from '@/components/meta/MetaCampaigns'
import { MetaCharts } from '@/components/meta/MetaCharts'
import { ExportPDFButton } from '@/components/ui/ExportPDFButton'
import { FollowersTracker } from '@/components/meta/FollowersTracker'
import type { MetaDashboardData, MetaAdCreative } from '@/types/meta'
import { FOLLOWERS_KEYWORDS, CAMPAIGN_CATEGORIES, matchesKeywords } from '@/lib/campaign-categories'
import { GoogleOverview } from '@/components/google/GoogleOverview'
import { GoogleCampaigns } from '@/components/google/GoogleCampaigns'
import { GoogleKeywords } from '@/components/google/GoogleKeywords'
import type { GoogleDashboardData } from '@/types/google'
import { DashboardSummary } from '@/components/summary/DashboardSummary'
import { MetaFunnelView } from '@/components/meta/MetaFunnelView'

type Tab = 'meta' | 'google' | 'summary' | 'funil'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'meta', label: 'Meta Ads', icon: <Share2 className="w-3.5 h-3.5" /> },
  { id: 'google', label: 'Google Ads', icon: <BarChart2 className="w-3.5 h-3.5" /> },
  { id: 'summary', label: 'Resumo', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'funil', label: 'Funil (teste)', icon: <Filter className="w-3.5 h-3.5" /> },
]

function computeRange(days: number) {
  const until = subDays(new Date(), 1)
  const since = subDays(new Date(), days)
  return {
    since: format(since, 'yyyy-MM-dd'),
    until: format(until, 'yyyy-MM-dd'),
  }
}

function monthRange(year: number, month: number) {
  const since = format(new Date(year, month, 1), 'yyyy-MM-dd')
  const lastDay = new Date(year, month + 1, 0)
  const yesterday = subDays(new Date(), 1)
  const until = format(lastDay < yesterday ? lastDay : yesterday, 'yyyy-MM-dd')
  return { since, until }
}

function getRecentMonths(count = 12) {
  const today = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i - 1, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
}

const MAX_PAST = format(subDays(new Date(), 365), 'yyyy-MM-dd')
const YESTERDAY = format(subDays(new Date(), 1), 'yyyy-MM-dd')

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('meta')
  const [since, setSince] = useState(() => computeRange(7).since)
  const [until, setUntil] = useState(() => computeRange(7).until)
  const [metaData, setMetaData] = useState<MetaDashboardData | null>(null)
  const [creatives, setCreatives] = useState<MetaAdCreative[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [googleData, setGoogleData] = useState<GoogleDashboardData | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)

  function applyPreset(days: number) {
    const r = computeRange(days)
    setSince(r.since)
    setUntil(r.until)
  }

  function applyMonth(year: number, month: number) {
    const r = monthRange(year, month)
    setSince(r.since)
    setUntil(r.until)
  }

  function isMonthActive(year: number, month: number) {
    const r = monthRange(year, month)
    return since === r.since && until === r.until
  }

  const fetchMeta = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/meta?since=${since}&until=${until}&creatives=true`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao buscar dados da Meta API')
      setMetaData(data)
      setCreatives(data.creatives ?? [])
      setLastFetched(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [since, until])

  const fetchGoogle = useCallback(async () => {
    setGoogleLoading(true)
    setGoogleError(null)
    try {
      const res = await fetch(`/api/google?since=${since}&until=${until}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erro ao buscar dados do Google')
      }
      const data: GoogleDashboardData = await res.json()
      setGoogleData(data)
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setGoogleLoading(false)
    }
  }, [since, until])

  useEffect(() => {
    fetchMeta()
    fetchGoogle()
  }, [fetchMeta, fetchGoogle])

  const periodLabel = `${format(new Date(since + 'T12:00:00'), "dd 'de' MMM", { locale: ptBR })} – ${format(new Date(until + 'T12:00:00'), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Top bar */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">W</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-zinc-100 text-sm">
              WSA Dashboard
            </span>
            {metaData && (
              <span className="hidden sm:inline-block text-xs text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                {metaData.account_name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Preset chips */}
            <div className="flex items-center gap-1">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => applyPreset(d)}
                  className={clsx(
                    'text-xs px-2.5 py-1 rounded-lg transition-colors font-medium',
                    since === computeRange(d).since && until === computeRange(d).until
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>

            {/* Date range inputs */}
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={since}
                min={MAX_PAST}
                max={until}
                onChange={(e) => setSince(e.target.value)}
                className="text-xs bg-gray-100 dark:bg-zinc-800 border-0 rounded-lg px-2 py-1.5 text-gray-700 dark:text-zinc-300"
              />
              <span className="text-xs text-gray-400">–</span>
              <input
                type="date"
                value={until}
                min={since}
                max={YESTERDAY}
                onChange={(e) => setUntil(e.target.value)}
                className="text-xs bg-gray-100 dark:bg-zinc-800 border-0 rounded-lg px-2 py-1.5 text-gray-700 dark:text-zinc-300"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={fetchMeta}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-500 dark:text-zinc-400 disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
            </button>

            <ExportPDFButton data={metaData} />
          </div>
        </div>

        {/* Period badge + last updated */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-1.5 flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-zinc-500">{periodLabel}</p>
          {lastFetched && (
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Atualizado às {format(lastFetched, 'HH:mm')}
            </p>
          )}
        </div>

        {/* Month chips */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[10px] text-gray-400 dark:text-zinc-500 shrink-0 pr-1">Mês:</span>
          {getRecentMonths(12).reverse().filter(({ year }) => year >= 2026).map(({ year, month }) => (
            <button
              key={`${year}-${month}`}
              onClick={() => applyMonth(year, month)}
              className={clsx(
                'text-xs px-2.5 py-1 rounded-lg transition-colors font-medium whitespace-nowrap shrink-0',
                isMonthActive(year, month)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              )}
            >
              {format(new Date(year, month, 1), "MMM/yy", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 border-t border-gray-100 dark:border-zinc-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors',
                tab === t.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300'
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error state */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Erro ao carregar dados da Meta API</p>
              <p className="text-xs mt-1 opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !metaData && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-52 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Meta Ads tab */}
        {tab === 'meta' && metaData && (
          <div className="space-y-10">
            <div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 pb-2.5 border-b border-gray-200 dark:border-zinc-700 mb-4">
                Visão geral
              </h2>
              <MetaOverview data={metaData} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 pb-2.5 border-b border-gray-200 dark:border-zinc-700 mb-4">
                Gráficos diários
              </h2>
              <MetaCharts daily={metaData.daily_insights} />
            </div>

            {CAMPAIGN_CATEGORIES.map(({ label, keywords }) => {
              const filtered = metaData.campaigns.filter(
                c => c.spend > 0 && matchesKeywords(c.name, keywords)
              )
              if (!filtered.length) return null
              return (
                <div key={label}>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 pb-2.5 border-b border-gray-200 dark:border-zinc-700 mb-4">
                    {label} ({filtered.length})
                  </h2>
                  <MetaCampaigns campaigns={filtered} creatives={creatives} />
                </div>
              )
            })}

            {(() => {
              const allKeywords = [...FOLLOWERS_KEYWORDS, ...CAMPAIGN_CATEGORIES.flatMap(c => c.keywords)]
              const others = metaData.campaigns.filter(
                c => c.spend > 0 && !matchesKeywords(c.name, allKeywords)
              )
              if (!others.length) return null
              return (
                <div>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 pb-2.5 border-b border-gray-200 dark:border-zinc-700 mb-4">
                    Construção Inteligente ({others.length})
                  </h2>
                  <MetaCampaigns campaigns={others} creatives={creatives} />
                </div>
              )
            })()}

            <div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 pb-2.5 border-b border-gray-200 dark:border-zinc-700 mb-4">
                Seguidores Instagram
              </h2>
              <FollowersTracker campaigns={metaData.campaigns} creatives={creatives} />
            </div>
          </div>
        )}

        {/* Funil tab */}
        {tab === 'funil' && metaData && (
          <div className="space-y-10">
            <MetaFunnelView campaigns={metaData.campaigns} creatives={creatives} />
          </div>
        )}

        {/* Resumo tab */}
        {tab === 'summary' && (
          <DashboardSummary
            metaData={metaData}
            googleData={googleData}
          />
        )}

        {/* Google Ads tab */}
        {tab === 'google' && (
          <div className="space-y-6">
            {googleError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Erro ao carregar dados do Google Ads</p>
                  <p className="text-xs mt-1 opacity-80">{googleError}</p>
                </div>
              </div>
            )}

            {googleLoading && !googleData && (
              <div className="space-y-4 animate-pulse">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
                  ))}
                </div>
                <div className="h-48 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
              </div>
            )}

            {googleData && (
              <>
                <div>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 pb-2.5 border-b border-gray-200 dark:border-zinc-700 mb-4">
                    Visão geral
                  </h2>
                  <GoogleOverview data={googleData} />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 pb-2.5 border-b border-gray-200 dark:border-zinc-700 mb-4">
                    Campanhas ({googleData.campaigns.filter(c => c.cost > 0).length})
                  </h2>
                  <GoogleCampaigns campaigns={googleData.campaigns} />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 pb-2.5 border-b border-gray-200 dark:border-zinc-700 mb-4">
                    Palavras-chave
                  </h2>
                  <GoogleKeywords keywords={googleData.keywords} />
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
