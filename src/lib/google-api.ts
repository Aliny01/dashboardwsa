import { GoogleAdsApi } from 'google-ads-api'
import { format, subDays } from 'date-fns'
import type { GoogleDashboardData, GoogleConversions } from '@/types/google'

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
})

function getDateRange(days = 7) {
  const until = new Date()
  const since = subDays(until, days)
  return {
    since: format(since, 'yyyy-MM-dd'),
    until: format(until, 'yyyy-MM-dd'),
  }
}

function emptyConversions(): GoogleConversions {
  return { calls: 0, contacts: 0, directions: 0, conversations: 0, total: 0 }
}

function classifyConversion(name: string, value: number, acc: GoogleConversions): GoogleConversions {
  const n = name.toLowerCase()
  const result = { ...acc, total: acc.total + value }

  if (n.includes('clicks to call') || n.includes('calls from ads') || n.includes('chamadas')) {
    result.calls += value
  } else if (n.includes('contato') || n.includes('contaco')) {
    result.contacts += value
  } else if (n.includes('direction') || n.includes('ver rota')) {
    result.directions += value
  } else if (n.includes('conversation')) {
    result.conversations += value
  }

  return result
}

export async function fetchGoogleDashboard(
  daysOrRange: number | { since: string; until: string } = 7
): Promise<GoogleDashboardData> {
  const { since, until } = typeof daysOrRange === 'number'
    ? getDateRange(daysOrRange)
    : daysOrRange

  const customer = client.Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
  })

  const [campaignsResponse, conversionResponse, keywordsResponse] = await Promise.all([
    customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.average_cpc,
        metrics.conversions,
        metrics.ctr
      FROM campaign
      WHERE segments.date BETWEEN '${since}' AND '${until}'
      AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
    `),

    customer.query(`
      SELECT
        campaign.id,
        segments.conversion_action_name,
        metrics.all_conversions
      FROM campaign
      WHERE segments.date BETWEEN '${since}' AND '${until}'
      AND campaign.status != 'REMOVED'
      AND metrics.all_conversions > 0
    `).catch(() => []),

    customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.average_cpc,
        metrics.conversions
      FROM keyword_view
      WHERE segments.date BETWEEN '${since}' AND '${until}'
      AND campaign.status != 'REMOVED'
      AND metrics.impressions > 0
      ORDER BY metrics.impressions DESC
      LIMIT 300
    `),
  ])

  const convMap = new Map<string, GoogleConversions>()
  for (const row of conversionResponse as any[]) {
    const id = String(row.campaign.id)
    const name: string = row.segments?.conversion_action_name ?? ''
    const value: number = row.metrics.all_conversions ?? 0
    convMap.set(id, classifyConversion(name, value, convMap.get(id) ?? emptyConversions()))
  }

  const campaigns = (campaignsResponse as any[]).map((row) => ({
    id: String(row.campaign.id),
    name: row.campaign.name,
    status: row.campaign.status,
    clicks: row.metrics.clicks ?? 0,
    impressions: row.metrics.impressions ?? 0,
    cost: (row.metrics.cost_micros ?? 0) / 1_000_000,
    cpc: (row.metrics.average_cpc ?? 0) / 1_000_000,
    conversions: row.metrics.conversions ?? 0,
    ctr: row.metrics.ctr ?? 0,
    conversionBreakdown: convMap.get(String(row.campaign.id)) ?? emptyConversions(),
  }))

  const keywords = (keywordsResponse as any[]).map((row) => ({
    keyword: row.ad_group_criterion?.keyword?.text ?? '',
    matchType: row.ad_group_criterion?.keyword?.match_type ?? '',
    clicks: row.metrics.clicks ?? 0,
    impressions: row.metrics.impressions ?? 0,
    cost: (row.metrics.cost_micros ?? 0) / 1_000_000,
    cpc: (row.metrics.average_cpc ?? 0) / 1_000_000,
    conversions: row.metrics.conversions ?? 0,
    position: 0,
    campaignId: String(row.campaign.id),
    campaignName: row.campaign.name ?? '',
  }))

  const overview = campaigns.reduce(
    (acc, c) => ({
      cost: acc.cost + c.cost,
      clicks: acc.clicks + c.clicks,
      impressions: acc.impressions + c.impressions,
      conversions: acc.conversions + c.conversions,
      ctr: 0,
      cpc: 0,
      conversionBreakdown: {
        calls: acc.conversionBreakdown.calls + c.conversionBreakdown.calls,
        contacts: acc.conversionBreakdown.contacts + c.conversionBreakdown.contacts,
        directions: acc.conversionBreakdown.directions + c.conversionBreakdown.directions,
        conversations: acc.conversionBreakdown.conversations + c.conversionBreakdown.conversations,
        total: acc.conversionBreakdown.total + c.conversionBreakdown.total,
      },
    }),
    { cost: 0, clicks: 0, impressions: 0, conversions: 0, ctr: 0, cpc: 0, conversionBreakdown: emptyConversions() }
  )

  overview.ctr = overview.impressions > 0 ? (overview.clicks / overview.impressions) * 100 : 0
  overview.cpc = overview.clicks > 0 ? overview.cost / overview.clicks : 0

  return { period: { since, until }, overview, campaigns, keywords }
}
