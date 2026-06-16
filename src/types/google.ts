export interface GoogleConversions {
  calls: number
  contacts: number
  directions: number
  conversations: number
  total: number
}

export interface GoogleCampaign {
  id: string
  name: string
  status: string
  clicks: number
  impressions: number
  cost: number
  cpc: number
  conversions: number
  ctr: number
  conversionBreakdown: GoogleConversions
}

export interface GoogleKeyword {
  keyword: string
  matchType: string
  clicks: number
  impressions: number
  cost: number
  cpc: number
  conversions: number
  position: number
  campaignId: string
  campaignName: string
}

export interface GoogleDashboardData {
  period: { since: string; until: string }
  overview: {
    cost: number
    clicks: number
    impressions: number
    ctr: number
    cpc: number
    conversions: number
    conversionBreakdown: GoogleConversions
  }
  campaigns: GoogleCampaign[]
  keywords: GoogleKeyword[]
}
