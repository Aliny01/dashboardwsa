export type BoletoFrequency = 'semanal' | 'quinzenal' | 'mensal'

export interface BoletoSchedule {
  clientKey: string
  platform: 'Meta' | 'Google'
  amount: number
  frequency: BoletoFrequency
  lastPaymentDate: string // YYYY-MM-DD, data do ultimo boleto confirmado
}

const FREQUENCY_DAYS: Record<BoletoFrequency, number> = {
  semanal: 7,
  quinzenal: 14,
  mensal: 30,
}

export const FREQUENCY_LABEL: Record<BoletoFrequency, string> = {
  semanal: 'semanal',
  quinzenal: 'quinzenal',
  mensal: 'mensal',
}

// Cadencia de boleto confirmada manualmente pela Aliny (nao vem da API).
// Atualizar lastPaymentDate a cada boleto novo enviado.
export const BOLETO_SCHEDULE: BoletoSchedule[] = [
  { clientKey: 'amaranthus', platform: 'Meta', amount: 500, frequency: 'semanal', lastPaymentDate: '2026-09-28' },
  { clientKey: 'santa-cana', platform: 'Meta', amount: 300, frequency: 'semanal', lastPaymentDate: '2026-09-28' },
  { clientKey: 'santa-cana', platform: 'Google', amount: 225, frequency: 'quinzenal', lastPaymentDate: '2026-09-22' },
  { clientKey: 'la-biblioteca', platform: 'Meta', amount: 500, frequency: 'semanal', lastPaymentDate: '2026-09-28' },
  { clientKey: 'la-biblioteca', platform: 'Google', amount: 300, frequency: 'mensal', lastPaymentDate: '2026-09-16' },
  { clientKey: 'madeireira-peroba', platform: 'Google', amount: 150, frequency: 'quinzenal', lastPaymentDate: '2026-09-22' },
]

export function findBoletoSchedule(clientKey: string, platform: 'Meta' | 'Google'): BoletoSchedule | undefined {
  return BOLETO_SCHEDULE.find((s) => s.clientKey === clientKey && s.platform === platform)
}

export function nextExpectedDate(schedule: BoletoSchedule): string {
  const last = new Date(schedule.lastPaymentDate + 'T00:00:00Z')
  const days = FREQUENCY_DAYS[schedule.frequency]
  const next = new Date(last.getTime() + days * 24 * 60 * 60 * 1000)
  return next.toISOString().slice(0, 10)
}
