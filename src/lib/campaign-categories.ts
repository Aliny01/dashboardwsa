export const FOLLOWERS_KEYWORDS = [
  '[TRÁFEGO] [SEGUIDORES]',
  'Post do Instagram',
  'Publicação do Instagram',
]

export const CAMPAIGN_CATEGORIES = [
  { label: 'Planta Arquitetura', keywords: ['[PA]'] },
  { label: 'Amancio Construtora', keywords: ['[AMC]'] },
  { label: 'Galpões', keywords: ['GALPÕES'] },
  { label: 'Cursos', keywords: ['[ORÇAMENTISTA]'] },
]

export function matchesKeywords(name: string, keywords: string[]): boolean {
  return keywords.some((kw) => name.toLowerCase().includes(kw.toLowerCase()))
}
