import { format, subDays } from 'date-fns'
import type {
  MetaDashboardData,
  MetaCampaign,
  MetaInsights,
  MetaCampaignSummary,
  MetaDailyInsight,
  MetaAdCreative,
} from '@/types/meta'

const BASE_URL = 'https://graph.facebook.com/v19.0'
const TOKEN = process.env.META_ACCESS_TOKEN!
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID!

function getDateRange(days = 7) {
  const until = new Date()
  const since = subDays(until, days)
  return {
    since: format(since, 'yyyy-MM-dd'),
    until: format(until, 'yyyy-MM-dd'),
  }
}

function parseNum(val: string | undefined): number {
  return parseFloat(val ?? '0') || 0
}

function getActionValue(actions: MetaInsights['actions'], type: string): number {
  const action = actions?.find((a) => a.action_type === type)
  return parseNum(action?.value)
}

async function metaFetch(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}/${path}`)
  url.searchParams.set('access_token', TOKEN)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), { next: { revalidate: 300 } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Meta API error: ${res.status} — ${err?.error?.message ?? res.statusText}`)
  }
  return res.json()
}

export async function fetchMetaDashboard(
  daysOrRange: number | { since: string; until: string } = 7,
  accountId?: string
): Promise<MetaDashboardData> {
  const { since, until } = typeof daysOrRange === 'number'
    ? getDateRange(daysOrRange)
    : daysOrRange

  const account = accountId ?? AD_ACCOUNT_ID
  const insightFields = ['spend', 'reach', 'impressions', 'clicks', 'cpc', 'cpm', 'cpp', 'actions', 'video_p25_watched_actions', 'video_p50_watched_actions', 'video_p95_watched_actions'].join(',')
  const timeRange = JSON.stringify({ since, until })

  const [accountData, campaignData, dailyData, igRaw] = await Promise.all([
    metaFetch(`${account}/insights`, {
      fields: insightFields,
      time_range: timeRange,
      level: 'account',
    }),
    metaFetch(`${account}/campaigns`, {
      fields: `id,name,status,objective,insights.time_range(${timeRange}){${insightFields}}`,
      effective_status: '["ACTIVE","PAUSED","CAMPAIGN_PAUSED","ADSET_PAUSED"]',
      limit: '50',
    }),
    metaFetch(`${account}/insights`, {
      fields: insightFields,
      time_range: timeRange,
      time_increment: '1',
      level: 'account',
    }),
    metaFetch(`${account}`, {
      fields: 'name,instagram_accounts{followers_count,name,username,profile_picture_url}',
    }).catch(() => ({})),
  ])

  const accountInsight = (accountData.data?.[0] ?? {}) as Partial<MetaInsights>

  let instagram: MetaDashboardData['instagram'] | undefined
  let accountName = 'Conta de Anúncios'
  if (igRaw.name) accountName = igRaw.name
  const igAccount = igRaw.instagram_accounts?.data?.[0]
  if (igAccount) {
    instagram = {
      followers_count: igAccount.followers_count,
      name: igAccount.name,
      username: igAccount.username,
      profile_picture_url: igAccount.profile_picture_url,
    }
  }

  const overview = {
    spend: parseNum(accountInsight.spend),
    reach: parseNum(accountInsight.reach),
    impressions: parseNum(accountInsight.impressions),
    clicks: parseNum(accountInsight.clicks),
    cpc: parseNum(accountInsight.cpc),
    cpm: parseNum(accountInsight.cpm),
    leads: getActionValue(accountInsight.actions, 'lead'),
    messages: getActionValue(accountInsight.actions, 'onsite_conversion.messaging_first_reply'),
    link_clicks: getActionValue(accountInsight.actions, 'link_click'),
  }

  const campaigns: MetaCampaignSummary[] = (campaignData.data ?? []).map((c: MetaCampaign) => {
    const ins = (c.insights?.data?.[0] ?? {}) as Partial<MetaInsights>
    return {
      id: c.id,
      name: c.name,
      objective: c.objective,
      status: c.status,
      spend: parseNum(ins.spend),
      reach: parseNum(ins.reach),
      impressions: parseNum(ins.impressions),
      clicks: parseNum(ins.clicks),
      cpc: parseNum(ins.cpc),
      leads: getActionValue(ins.actions, 'lead'),
      messages: getActionValue(ins.actions, 'onsite_conversion.messaging_first_reply'),
      link_clicks: getActionValue(ins.actions, 'link_click'),
      video_p25: getActionValue(ins.video_p25_watched_actions, 'video_view'),
      video_p50: getActionValue(ins.video_p50_watched_actions, 'video_view'),
      video_p95: getActionValue(ins.video_p95_watched_actions, 'video_view'),
    }
  })

  const daily_insights: MetaDailyInsight[] = (dailyData.data ?? [])
    .map((d: MetaInsights) => ({
      date: d.date_start,
      spend: parseNum(d.spend),
      reach: parseNum(d.reach),
      clicks: parseNum(d.clicks),
      leads: getActionValue(d.actions, 'lead'),
      messages: getActionValue(d.actions, 'onsite_conversion.messaging_first_reply'),
    }))
    .sort((a: MetaDailyInsight, b: MetaDailyInsight) => a.date.localeCompare(b.date))

  return {
    account_name: accountName,
    period: { since, until },
    overview,
    campaigns,
    daily_insights,
    instagram,
  }
}

export async function fetchAdCreatives(
  campaigns: { id: string; name: string }[],
  since?: string,
  until?: string
): Promise<MetaAdCreative[]> {
  if (!campaigns.length) return []
  const results: MetaAdCreative[] = []
  const timeRange = since && until ? JSON.stringify({ since, until }) : undefined
  const insightFields = 'spend,reach,clicks,actions,video_p25_watched_actions,video_p50_watched_actions,video_p95_watched_actions'

  for (const campaign of campaigns.slice(0, 10)) {
    try {
      const fields = [
        'id',
        'name',
        'creative{id,thumbnail_url,video_id,image_url,effective_object_story_id}',
        timeRange ? `insights.time_range(${timeRange}){${insightFields}}` : null,
      ].filter(Boolean).join(',')

      const data = await metaFetch(`${campaign.id}/ads`, {
        fields,
        effective_status: '["ACTIVE","PAUSED"]',
        limit: '5',
      })

      for (const ad of data.data ?? []) {
        const creative = ad.creative
        if (!creative) continue

        let permalinkUrl: string | undefined
        if (creative.effective_object_story_id) {
          const [pageId, postId] = creative.effective_object_story_id.split('_')
          permalinkUrl = `https://www.facebook.com/${pageId}/posts/${postId}`
        }

        const ins = ad.insights?.data?.[0]
        const leads = ins ? getActionValue(ins.actions, 'lead') : 0
        const messages = ins ? getActionValue(ins.actions, 'onsite_conversion.messaging_first_reply') : 0

        results.push({
          adId: ad.id,
          adName: ad.name,
          campaignId: campaign.id,
          campaignName: campaign.name,
          thumbnailUrl: creative.thumbnail_url,
          videoId: creative.video_id,
          imageUrl: creative.image_url,
          permalinkUrl,
          type: creative.video_id ? 'video' : creative.image_url ? 'image' : 'unknown',
          spend: ins ? parseNum(ins.spend) : 0,
          reach: ins ? parseNum(ins.reach) : 0,
          clicks: ins ? parseNum(ins.clicks) : 0,
          leads,
          messages,
          video_p25: ins ? getActionValue(ins.video_p25_watched_actions, 'video_view') : 0,
          video_p50: ins ? getActionValue(ins.video_p50_watched_actions, 'video_view') : 0,
          video_p95: ins ? getActionValue(ins.video_p95_watched_actions, 'video_view') : 0,
        })
      }
    } catch {}
  }
  return results
}
