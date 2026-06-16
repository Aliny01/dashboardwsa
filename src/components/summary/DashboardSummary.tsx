'use client'

import { ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import type { MetaDashboardData } from '@/types/meta'
import type { GoogleDashboardData } from '@/types/google'
import { FOLLOWERS_KEYWORDS, CAMPAIGN_CATEGORIES, matchesKeywords } from '@/lib/campaign-categories'

interface DashboardSummaryProps {
  metaData: MetaDashboardData | null
  googleData: GoogleDashboardData | null
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

function CategoryCard({
  label,
  campaigns,
}: {
  label: string
  campaigns: { name: string; spend: number; leads: number; messages: number }[]
}) {
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0)
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0)
  const totalMessages = campaigns.reduce((s, c) => s + c.messages, 0)
  const totalConversions = totalLeads + totalMessages

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600 dark:text-zinc-300 uppercase tracking-wide">
          {label}
        </p>
        <span className="text-xs text-gray-400 bg-gray-50 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
          {campaigns.length} camp.
        </span>
      </div>

      <div>
        <p className="text-xl font-semibold text-gray-900 dark:text-zinc-100 tabular-nums">
          {fmt(totalSpend, 'currency')}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">total investido</p>
      </div>

      {totalConversions > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
            {totalLeads > 0 && totalMessages > 0
              ? `${fmt(totalLeads)} leads + ${fmt(totalMessages)} conversas`
              : totalLeads > 0
              ? `${fmt(totalLeads)} leads`
              : `${fmt(totalMessages)} conversas`}
          </p>
          {totalSpend > 0 && (
            <p className="text-[11px] text-blue-500 dark:text-blue-400 mt-0.5">
              {fmt(totalSpend / totalConversions, 'currency')} por conversão
            </p>
          )}
        </div>
      )}

      <div>
        {campaigns.slice(0, 3).map((c) => (
          <div key={c.name} className="flex items-center gap-2 py-1">
            <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
            <span className="text-[11px] text-gray-500 dark:text-zinc-400 truncate flex-1">{c.name}</span>
            <span className="text-[11px] font-medium text-gray-700 dark:text-zinc-300 tabular-nums shrink-0">
              {fmt(c.spend, 'currency')}
            </span>
          </div>
        ))}
        {campaigns.length > 3 && (
          <p className="text-[10px] text-gray-400 pl-5 pt-0.5">
            +{campaigns.length - 3} campanha{campaigns.length - 3 > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

function ConvCard({ label, value, color }: { label: string; value: number; color: string }) {
  if (value <= 0) return null
  return (
    <div className={clsx('rounded-xl border p-3', color)}>
      <p className="text-xs font-medium uppercase tracking-wide mb-1 opacity-70">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{fmt(value)}</p>
    </div>
  )
}

export function DashboardSummary({ metaData, googleData }: DashboardSummaryProps) {
  if (!metaData && !googleData) {
    return (
      <div className="text-center py-20 text-gray-400 text-sm">
        Carregando dados…
      </div>
    )
  }

  const metaActive = metaData?.campaigns.filter((c) => c.spend > 0) ?? []
  const googleActive = googleData?.campaigns.filter((c) => c.cost > 0) ?? []

  const totalInvested = (metaData?.overview.spend ?? 0) + (googleData?.overview.cost ?? 0)
  const totalLeads = metaData?.overview.leads ?? 0
  const totalMessages = metaData?.overview.messages ?? 0
  const gBd = googleData?.overview.conversionBreakdown
  const googleConvTotal = gBd?.total ?? 0

  const categorized = CAMPAIGN_CATEGORIES.map(({ label, keywords }) => ({
    label,
    campaigns: metaActive.filter((c) => matchesKeywords(c.name, keywords)),
  })).filter((cat) => cat.campaigns.length > 0)

  const followersCampaigns = metaActive.filter((c) => matchesKeywords(c.name, FOLLOWERS_KEYWORDS))
  const allCategorizedKw = [...FOLLOWERS_KEYWORDS, ...CAMPAIGN_CATEGORIES.flatMap((c) => c.keywords)]
  const otherCampaigns = metaActive.filter((c) => !matchesKeywords(c.name, allCategorizedKw))

  return (
    <div className="space-y-8">
      {/* Investimento consolidado */}
      <div>
        <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 pb-2.5 border-b border-gray-200 dark:border-zinc-700 mb-4">
          Investimento total no período
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-1 bg-blue-600 rounded-xl p-4 text-white">
            <p className="text-xs font-medium opacity-80 uppercase tracking-wide mb-1">Total investido</p>
            <p className="text-2xl font-bold tabular-nums">{fmt(totalInvested, 'currency')}</p>
            <p className="text-xs opacity-70 mt-1">Meta + Google</p>
          </div>

          {metaData && (
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Meta Ads</p>
              <p className="text-xl font-semibold tabular-nums text-gray-900 dark:text-zinc-100">
                {fmt(metaData.overview.spend, 'currency')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{fmt(metaData.overview.reach)} alcance</p>
            </div>
          )}

          {googleData && (
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Google Ads</p>
              <p className="text-xl font-semibold tabular-nums text-gray-900 dark:text-zinc-100">
                {fmt(googleData.overview.cost, 'currency')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{fmt(googleData.overview.clicks)} cliques</p>
            </div>
          )}

          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Conversões totais</p>
            <p className="text-xl font-semibold tabular-nums text-gray-900 dark:text-zinc-100">
              {fmt(totalLeads + totalMessages + googleConvTotal)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              {[
                totalLeads > 0 && `${fmt(totalLeads)} leads`,
                totalMessages > 0 && `${fmt(totalMessages)} conv. Meta`,
                googleConvTotal > 0 && `${fmt(googleConvTotal)} Google`,
              ].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Conversões Google detalhadas */}
      {gBd && googleConvTotal > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 pb-2.5 border-b border-gray-200 dark:border-zinc-700 mb-4">
            Google Ads — conversões
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ConvCard
              label="Cliques para ligar"
              value={gBd.calls}
              color="bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-300"
            />
            <ConvCard
              label="Contato no site"
              value={gBd.contacts}
              color="bg-green-50 border-green-100 text-green-700 dark:bg-green-950/30 dark:border-green-900 dark:text-green-300"
            />
            <ConvCard
              label="Ver rota"
              value={gBd.directions}
              color="bg-orange-50 border-orange-100 text-orange-700 dark:bg-orange-950/30 dark:border-orange-900 dark:text-orange-300"
            />
            <ConvCard
              label="WhatsApp"
              value={gBd.conversations}
              color="bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300"
            />
          </div>
        </div>
      )}

      {/* Meta por categoria */}
      {(categorized.length > 0 || followersCampaigns.length > 0 || otherCampaigns.length > 0) && (
        <div>
          <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 pb-2.5 border-b border-gray-200 dark:border-zinc-700 mb-4">
            Meta Ads — por categoria
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorized.map(({ label, campaigns }) => (
              <CategoryCard key={label} label={label} campaigns={campaigns} />
            ))}
            {followersCampaigns.length > 0 && (
              <CategoryCard label="Seguidores Instagram" campaigns={followersCampaigns} />
            )}
            {otherCampaigns.length > 0 && (
              <CategoryCard label="Construção Inteligente" campaigns={otherCampaigns} />
            )}
          </div>
        </div>
      )}

      {/* Google campanhas */}
      {googleActive.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 pb-2.5 border-b border-gray-200 dark:border-zinc-700 mb-4">
            Google Ads — campanhas
          </h2>
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Campanha</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Investido</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Cliques</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Conversões</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                {googleActive.map((c) => {
                  const bd = c.conversionBreakdown
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                      <td className="px-4 py-2.5 text-gray-700 dark:text-zinc-300 max-w-[220px] truncate">{c.name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-gray-900 dark:text-zinc-100">
                        {fmt(c.cost, 'currency')}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-600 dark:text-zinc-400">
                        {fmt(c.clicks)}
                      </td>
                      <td className="px-4 py-2.5">
                        {bd.total > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {bd.calls > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">Lig.: {bd.calls}</span>}
                            {bd.contacts > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300">Site: {bd.contacts}</span>}
                            {bd.directions > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">Rota: {bd.directions}</span>}
                            {bd.conversations > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">WA: {bd.conversations}</span>}
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
        </div>
      )}
    </div>
  )
}
