'use client'

import React, { useState } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, Play, Image } from 'lucide-react'
import type { MetaCampaignSummary, MetaAdCreative } from '@/types/meta'
import { FOLLOWERS_KEYWORDS, CAMPAIGN_CATEGORIES, matchesKeywords } from '@/lib/campaign-categories'

interface MetaFunnelViewProps {
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

function pct(num: number, den: number): string {
  if (!den || !num) return '0%'
  return `${((num / den) * 100).toFixed(1)}%`
}

// ── Barra de funil (campanha) ─────────────────────────────────────────────────
function FunnelStage({
  label,
  value,
  maxValue,
  color,
  bg,
  dropFrom,
}: {
  label: string
  value: number
  maxValue: number
  color: string
  bg: string
  dropFrom?: number
}) {
  const width = maxValue > 0 ? Math.max((value / maxValue) * 100, 2) : 0
  const rate = dropFrom && dropFrom > 0 ? pct(value, dropFrom) : null
  return (
    <div className="space-y-0.5">
      {rate && (
        <div className="pl-[108px]">
          <span className="text-[9px] text-gray-400 dark:text-zinc-500">↓ {rate}</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-gray-500 dark:text-zinc-400 w-24 shrink-0 text-right leading-none">
          {label}
        </span>
        <div className={clsx('flex-1 h-5 rounded-md overflow-hidden', bg)}>
          <div
            className={clsx('h-full rounded-md transition-all duration-700', color)}
            style={{ width: `${width}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold tabular-nums text-gray-800 dark:text-zinc-200 w-16 shrink-0">
          {fmt(value)}
        </span>
      </div>
    </div>
  )
}

// ── Barra de retenção de vídeo ────────────────────────────────────────────────
function VideoBar({
  label,
  value,
  maxValue,
  base,
  color,
}: {
  label: string
  value: number
  maxValue: number
  base: number
  color: string
}) {
  const width = maxValue > 0 ? Math.max((value / maxValue) * 100, 1) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 w-8 shrink-0 text-right">
        {label}
      </span>
      <div className="flex-1 h-5 bg-gray-100 dark:bg-zinc-800 rounded-md overflow-hidden">
        <div
          className={clsx('h-full rounded-md transition-all duration-700', color)}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold tabular-nums text-gray-800 dark:text-zinc-200 w-14 shrink-0 text-right">
        {fmt(value)}
      </span>
      <span className="text-[10px] text-gray-400 dark:text-zinc-500 w-10 shrink-0">
        {pct(value, base)}
      </span>
    </div>
  )
}

// ── Bloco de retenção de vídeo ────────────────────────────────────────────────
function VideoRetention({
  p25,
  p50,
  p95,
  base,
}: {
  p25: number
  p50: number
  p95: number
  base: number
}) {
  if (!p25 && !p50 && !p95) return null
  const maxVal = p25 || p50 || p95
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
        Retenção de vídeo
      </p>
      {p25 > 0 && (
        <VideoBar label="25%" value={p25} maxValue={maxVal} base={base} color="bg-amber-400 dark:bg-amber-500" />
      )}
      {p50 > 0 && (
        <VideoBar label="50%" value={p50} maxValue={maxVal} base={base} color="bg-orange-500 dark:bg-orange-600" />
      )}
      {p95 > 0 && (
        <VideoBar label="95%" value={p95} maxValue={maxVal} base={base} color="bg-red-500 dark:bg-red-600" />
      )}
      {p95 > 0 && p25 > 0 && (
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 pt-1">
          {pct(p95, p25)} completaram o vídeo
        </p>
      )}
    </div>
  )
}

// ── Mini barra de funil (nível de anúncio) ────────────────────────────────────
function AdFunnelRow({
  label,
  value,
  maxValue,
  color,
  rate,
}: {
  label: string
  value: number
  maxValue: number
  color: string
  rate?: string
}) {
  const width = maxValue > 0 ? Math.max((value / maxValue) * 100, 2) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-400 w-14 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-3.5 bg-gray-100 dark:bg-zinc-800 rounded overflow-hidden">
        <div className={clsx('h-full rounded transition-all duration-500', color)} style={{ width: `${width}%` }} />
      </div>
      <span className="text-[10px] font-medium tabular-nums text-gray-700 dark:text-zinc-300 w-10 shrink-0 text-right">
        {fmt(value)}
      </span>
      <span className="text-[10px] text-gray-400 w-10 shrink-0">{rate ?? ''}</span>
    </div>
  )
}

// ── Card de campanha ──────────────────────────────────────────────────────────
function CampaignFunnel({
  campaign,
  creatives,
}: {
  campaign: MetaCampaignSummary
  creatives: MetaAdCreative[]
}) {
  const [expanded, setExpanded] = useState(false)
  const { impressions, reach, clicks, leads, messages, spend, video_p25, video_p50, video_p95 } = campaign
  const conversions = leads + messages
  const maxVal = impressions || reach
  const hasVideo = video_p25 > 0 || video_p50 > 0 || video_p95 > 0

  const ads = creatives.filter((cr) => cr.campaignId === campaign.id && (cr.reach ?? 0) > 0)

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-zinc-800 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={clsx(
              'shrink-0 w-1.5 h-1.5 rounded-full',
              campaign.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'
            )}
          />
          <p className="font-medium text-sm text-gray-900 dark:text-zinc-100 truncate">{campaign.name}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-semibold tabular-nums text-gray-700 dark:text-zinc-300">
            {fmt(spend, 'currency')}
          </span>
          {ads.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={clsx(
                'flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all whitespace-nowrap',
                expanded
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-zinc-800 dark:text-zinc-400'
              )}
            >
              {ads.length} anúncio{ads.length !== 1 ? 's' : ''}
              <ChevronDown className={clsx('w-3 h-3 transition-transform', expanded && 'rotate-180')} />
            </button>
          )}
        </div>
      </div>

      {/* Funil + retenção de vídeo */}
      <div className={clsx('px-5 py-4', hasVideo && 'grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6')}>
        {/* Funil de métricas */}
        <div className="space-y-1.5">
          {impressions > 0 && (
            <FunnelStage
              label="Impressões"
              value={impressions}
              maxValue={maxVal}
              color="bg-slate-400 dark:bg-slate-500"
              bg="bg-slate-100 dark:bg-zinc-800"
            />
          )}
          {reach > 0 && (
            <FunnelStage
              label="Alcance"
              value={reach}
              maxValue={maxVal}
              color="bg-blue-500 dark:bg-blue-600"
              bg="bg-blue-50 dark:bg-blue-950/30"
              dropFrom={impressions || undefined}
            />
          )}
          {clicks > 0 && (
            <FunnelStage
              label="Cliques"
              value={clicks}
              maxValue={maxVal}
              color="bg-violet-500 dark:bg-violet-600"
              bg="bg-violet-50 dark:bg-violet-950/30"
              dropFrom={reach || undefined}
            />
          )}
          {leads > 0 && (
            <FunnelStage
              label="Leads"
              value={leads}
              maxValue={maxVal}
              color="bg-emerald-500 dark:bg-emerald-600"
              bg="bg-emerald-50 dark:bg-emerald-950/30"
              dropFrom={clicks || undefined}
            />
          )}
          {messages > 0 && (
            <FunnelStage
              label="Mensagens"
              value={messages}
              maxValue={maxVal}
              color="bg-orange-500 dark:bg-orange-600"
              bg="bg-orange-50 dark:bg-orange-950/30"
              dropFrom={clicks || undefined}
            />
          )}

          {conversions > 0 && (
            <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-zinc-800 mt-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
                <span>Taxa de conv.:</span>
                <span className="font-semibold text-gray-800 dark:text-zinc-200">
                  {pct(conversions, impressions || reach)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
                <span>CPL:</span>
                <span className="font-semibold text-gray-800 dark:text-zinc-200">
                  {fmt(spend / conversions, 'currency')}
                </span>
              </div>
              {clicks > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
                  <span>CTR:</span>
                  <span className="font-semibold text-gray-800 dark:text-zinc-200">
                    {pct(clicks, impressions || reach)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Retenção de vídeo */}
        {hasVideo && (
          <div className="lg:border-l border-gray-100 dark:border-zinc-800 lg:pl-6 pt-4 lg:pt-0">
            <VideoRetention
              p25={video_p25}
              p50={video_p50}
              p95={video_p95}
              base={impressions || reach}
            />
          </div>
        )}
      </div>

      {/* Funil por anúncio */}
      {expanded && ads.length > 0 && (
        <div className="border-t border-blue-100 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/10 px-5 py-4">
          <p className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-4 uppercase tracking-wider">
            Funil por anúncio
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ads.map((ad) => {
              const adConv = (ad.leads ?? 0) + (ad.messages ?? 0)
              const adMax = ad.reach ?? 0
              const adHasVideo = (ad.video_p25 ?? 0) > 0 || (ad.video_p50 ?? 0) > 0 || (ad.video_p95 ?? 0) > 0
              return (
                <div
                  key={ad.adId}
                  className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 p-3 space-y-2"
                >
                  {/* Thumbnail + nome */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0">
                      {ad.thumbnailUrl || ad.imageUrl ? (
                        <img
                          src={ad.thumbnailUrl ?? ad.imageUrl}
                          alt={ad.adName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          {ad.type === 'video' ? <Play className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-gray-700 dark:text-zinc-300 truncate flex-1">
                      {ad.adName}
                    </p>
                    {(ad.spend ?? 0) > 0 && (
                      <span className="text-[10px] text-gray-400 tabular-nums shrink-0">
                        {fmt(ad.spend!, 'currency')}
                      </span>
                    )}
                  </div>

                  {/* Funil do anúncio */}
                  <div className="space-y-1">
                    {(ad.reach ?? 0) > 0 && (
                      <AdFunnelRow label="Alcance" value={ad.reach!} maxValue={adMax} color="bg-blue-400" />
                    )}
                    {(ad.clicks ?? 0) > 0 && (
                      <AdFunnelRow
                        label="Cliques"
                        value={ad.clicks!}
                        maxValue={adMax}
                        color="bg-violet-400"
                        rate={ad.reach ? pct(ad.clicks!, ad.reach) : undefined}
                      />
                    )}
                    {(ad.leads ?? 0) > 0 && (
                      <AdFunnelRow
                        label="Leads"
                        value={ad.leads!}
                        maxValue={adMax}
                        color="bg-emerald-400"
                        rate={ad.clicks ? pct(ad.leads!, ad.clicks!) : undefined}
                      />
                    )}
                    {(ad.messages ?? 0) > 0 && (
                      <AdFunnelRow
                        label="Mensagens"
                        value={ad.messages!}
                        maxValue={adMax}
                        color="bg-orange-400"
                        rate={ad.clicks ? pct(ad.messages!, ad.clicks!) : undefined}
                      />
                    )}
                    {adConv === 0 && (ad.clicks ?? 0) > 0 && (
                      <p className="text-[10px] text-gray-400 pt-0.5">Sem conversões no período</p>
                    )}
                  </div>

                  {/* Retenção de vídeo do anúncio */}
                  {adHasVideo && (
                    <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                        Retenção
                      </p>
                      <div className="space-y-1">
                        {(ad.video_p25 ?? 0) > 0 && (
                          <AdFunnelRow
                            label="25%"
                            value={ad.video_p25!}
                            maxValue={ad.video_p25!}
                            color="bg-amber-400"
                            rate={ad.reach ? pct(ad.video_p25!, ad.reach) : undefined}
                          />
                        )}
                        {(ad.video_p50 ?? 0) > 0 && (
                          <AdFunnelRow
                            label="50%"
                            value={ad.video_p50!}
                            maxValue={ad.video_p25 || ad.video_p50!}
                            color="bg-orange-400"
                            rate={ad.video_p25 ? pct(ad.video_p50!, ad.video_p25) : undefined}
                          />
                        )}
                        {(ad.video_p95 ?? 0) > 0 && (
                          <AdFunnelRow
                            label="95%"
                            value={ad.video_p95!}
                            maxValue={ad.video_p25 || ad.video_p95!}
                            color="bg-red-400"
                            rate={ad.video_p25 ? pct(ad.video_p95!, ad.video_p25) : undefined}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── View principal ────────────────────────────────────────────────────────────
export function MetaFunnelView({ campaigns, creatives }: MetaFunnelViewProps) {
  const active = campaigns.filter((c) => c.spend > 0)

  const allKeywords = [...FOLLOWERS_KEYWORDS, ...CAMPAIGN_CATEGORIES.flatMap((c) => c.keywords)]

  const grouped = CAMPAIGN_CATEGORIES.map(({ label, keywords }) => ({
    label,
    campaigns: active.filter((c) => matchesKeywords(c.name, keywords)),
  })).filter((g) => g.campaigns.length > 0)

  const followers = active.filter((c) => matchesKeywords(c.name, FOLLOWERS_KEYWORDS))
  const others = active.filter((c) => !matchesKeywords(c.name, allKeywords))

  if (!active.length) {
    return (
      <div className="text-center py-20 text-gray-400 text-sm">
        Nenhuma campanha com gasto no período.
      </div>
    )
  }

  const renderGroup = (label: string, items: MetaCampaignSummary[]) => {
    if (!items.length) return null
    return (
      <div key={label}>
        <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 pb-2.5 border-b border-gray-200 dark:border-zinc-700 mb-4">
          {label} ({items.length})
        </h2>
        <div className="space-y-3">
          {items.map((c) => (
            <CampaignFunnel key={c.id} campaign={c} creatives={creatives} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {grouped.map(({ label, campaigns: items }) => renderGroup(label, items))}
      {renderGroup('Construção Inteligente', others)}
      {renderGroup('Seguidores Instagram', followers)}
    </div>
  )
}
