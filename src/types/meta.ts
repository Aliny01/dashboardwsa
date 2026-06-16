export interface MetaInsights {
  date_start: string
  date_stop: string
  spend: string
  reach: string
  impressions: string
  clicks: string
  cpc: string
  cpm: string
  cpp: string
  actions?: MetaAction[]
  video_p25_watched_actions?: MetaAction[]
  video_p50_watched_actions?: MetaAction[]
  video_p95_watched_actions?: MetaAction[]
}

export interface MetaAction {
  action_type: string
  value: string
}

export interface MetaCampaign {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED'
  objective: string
  insights?: {
    data: MetaInsights[]
  }
}

export interface MetaInstagramPage {
  followers_count: number
  name: string
  username: string
  profile_picture_url?: string
}

export interface MetaDashboardData {
  account_name: string
  period: {
    since: string
    until: string
  }
  overview: {
    spend: number
    reach: number
    impressions: number
    clicks: number
    cpc: number
    cpm: number
    leads: number
    messages: number
    link_clicks: number
  }
  campaigns: MetaCampaignSummary[]
  daily_insights: MetaDailyInsight[]
  instagram?: MetaInstagramPage
}

export interface MetaCampaignSummary {
  id: string
  name: string
  objective: string
  status: string
  spend: number
  reach: number
  impressions: number
  clicks: number
  cpc: number
  leads: number
  messages: number
  link_clicks: number
  video_p25: number
  video_p50: number
  video_p95: number
}

export interface MetaDailyInsight {
  date: string
  spend: number
  reach: number
  clicks: number
  leads: number
  messages: number
}

export interface MetaAdCreative {
  adId: string
  adName: string
  campaignId: string
  campaignName: string
  thumbnailUrl?: string
  videoId?: string
  imageUrl?: string
  permalinkUrl?: string
  type: 'video' | 'image' | 'unknown'
  spend?: number
  leads?: number
  messages?: number
  clicks?: number
  reach?: number
  video_p25?: number
  video_p50?: number
  video_p95?: number
}

