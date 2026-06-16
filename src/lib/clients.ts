export interface ClientConfig {
  name: string
  metaAccountId: string
  googleCustomerId: string
}

export const CLIENTS: Record<string, ClientConfig> = {
  default: {
    name: 'WSA Dashboard',
    metaAccountId: process.env.META_AD_ACCOUNT_ID ?? '',
    googleCustomerId: process.env.GOOGLE_ADS_CUSTOMER_ID ?? '',
  },
  excelencia: {
    name: 'Excelência Transporte Executivo',
    metaAccountId: 'act_815866793070355',
    googleCustomerId: '4096505407',
  },
}
