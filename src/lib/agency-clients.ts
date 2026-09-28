// Roster de clientes da carteira Agência Win pra tela de pagamentos.
// Fonte dos IDs: .env.local (Meta) e MCC "ADM TRÁFEGO" (Google).

export interface AgencyClient {
  key: string
  name: string
  metaAccountId?: string
  googleCustomerId?: string
}

export const AGENCY_CLIENTS: AgencyClient[] = [
  { key: 'acropole', name: 'Acrópole', metaAccountId: 'act_779054466124732', googleCustomerId: '1588009041' },
  { key: 'agencia-win', name: 'Agência Win', metaAccountId: 'act_736277248119513' },
  { key: 'amaranthus', name: 'Amaranthus', metaAccountId: 'act_1044986413650048' },
  { key: 'amio', name: 'Amió', metaAccountId: 'act_880543225947472' },
  { key: 'barbosa-amorim', name: 'Barbosa Amorim', metaAccountId: 'act_391220260708345' },
  { key: 'bullteco', name: 'Bullteco', metaAccountId: 'act_145059650121924' },
  { key: 'castelli', name: 'Castelli', metaAccountId: 'act_1228708261921539' },
  { key: 'dra-cynthia', name: 'Dra Cynthia', metaAccountId: 'act_1354338580178693' },
  { key: 'dreste', name: 'Dreste', metaAccountId: 'act_708006763527474' },
  { key: 'espeto-imperial', name: 'Espeto Imperial', metaAccountId: 'act_527854649326210' },
  { key: 'esquina-espetinho', name: 'Esquina do Espetinho', metaAccountId: 'act_427551698538886' },
  { key: 'freeway', name: 'Freeway', metaAccountId: 'act_899075609601073', googleCustomerId: '7173142409' },
  { key: 'la-biblioteca', name: 'La Biblioteca', metaAccountId: 'act_858666333498261', googleCustomerId: '5433413925' },
  { key: 'mova-parts', name: 'Mova Parts', metaAccountId: 'act_954295689040652', googleCustomerId: '2027952298' },
  { key: 'santa-cana', name: 'Santa Cana', metaAccountId: 'act_927857472509595', googleCustomerId: '8960847497' },
  { key: 'madeireira-peroba', name: 'Madeireira Peroba', googleCustomerId: '3017184711' },
]

export const GOOGLE_MCC_LOGIN_CUSTOMER_ID = '5065296288'
