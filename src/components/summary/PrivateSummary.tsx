'use client'

import { Lock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'
import summaryData from '@/data/private-summary.json'

type Action = 'keep' | 'test' | 'pause'

interface Video {
  rank: number
  name: string
  url: string | null
  reach: number
  clicks: number
  ctr: number | null
  ret25: number | null
  ret50: number | null
  ret95: number | null
  spend: number
  action: Action
  note?: string
}

interface Section {
  id: string
  title: string
  period: string
  updatedAt: string
  totals: { spend: number; clicks: number; results: number }
  observation: string
  videos: Video[]
}

const ACTION_LABEL: Record<Action, string> = {
  keep: 'Manter',
  test: 'Testar',
  pause: 'Pausar',
}

const ACTION_CLASS: Record<Action, string> = {
  keep: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  test: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  pause: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
}

function fmt(n: number, style: 'currency' | 'decimal' = 'decimal') {
  if (style === 'currency') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(n)
  }
  return new Intl.NumberFormat('pt-BR').format(Math.round(n))
}

function pct(v: number | null) {
  if (v === null) return '—'
  return `${v.toFixed(1)}%`
}

function RetBar({ value, max }: { value: number | null; max: number }) {
  if (value === null) return <span className="text-gray-300 dark:text-zinc-600">—</span>
  const w = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const color = value >= 20 ? 'bg-green-500' : value >= 10 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full', color)} style={{ width: `${w}%` }} />
      </div>
      <span className="tabular-nums text-xs">{pct(value)}</span>
    </div>
  )
}

function SectionBlock({ section }: { section: Section }) {
  const [open, setOpen] = useState(true)
  const maxRet = Math.max(...section.videos.map(v => v.ret95 ?? 0))

  const keep = section.videos.filter(v => v.action === 'keep')
  const test = section.videos.filter(v => v.action === 'test')
  const pause = section.videos.filter(v => v.action === 'pause')

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{section.title}</h2>
          <span className="text-xs text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            {section.period}
          </span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            atualizado em {new Date(section.updatedAt + 'T12:00:00').toLocaleDateString('pt-BR')}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-6 border-t border-gray-100 dark:border-zinc-800">
          {/* Totals */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-0.5">Gasto no período</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{fmt(section.totals.spend, 'currency')}</p>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-0.5">Visitas totais</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{fmt(section.totals.clicks)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-0.5">Resultados</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{section.totals.results}</p>
            </div>
          </div>

          {/* Observation */}
          {section.observation && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
              {section.observation}
            </div>
          )}

          {/* Decision summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { action: 'keep' as Action, items: keep },
              { action: 'test' as Action, items: test },
              { action: 'pause' as Action, items: pause },
            ].map(({ action, items }) => (
              <div key={action} className={clsx(
                'rounded-xl border p-3 space-y-1',
                action === 'keep' ? 'border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/10'
                  : action === 'test' ? 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/10'
                  : 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10'
              )}>
                <p className={clsx(
                  'text-xs font-semibold uppercase tracking-wide',
                  action === 'keep' ? 'text-green-700 dark:text-green-400'
                    : action === 'test' ? 'text-amber-700 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                )}>
                  {action === 'keep' ? '✅ Manter' : action === 'test' ? '⏳ Testar' : '❌ Pausar'}
                </p>
                {items.map(v => (
                  <p key={v.rank} className="text-xs text-gray-600 dark:text-zinc-400 leading-snug">
                    • {v.name}
                  </p>
                ))}
              </div>
            ))}
          </div>

          {/* Video table */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
              Análise por vídeo
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400 w-6">#</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Vídeo</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Ret. 95%</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Ret. 50%</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Visitas</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">CTR</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Gasto</th>
                    <th className="text-center px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Decisão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {section.videos.map((v) => (
                    <>
                      <tr
                        key={v.rank}
                        className="bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-400 dark:text-zinc-500 text-xs">{v.rank}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-800 dark:text-zinc-200 font-medium text-xs leading-snug max-w-[220px]">
                              {v.name}
                            </span>
                            {v.url && (
                              <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-500 dark:text-zinc-600 dark:hover:text-blue-400 shrink-0">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <RetBar value={v.ret95} max={maxRet} />
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-xs text-gray-600 dark:text-zinc-400">
                          {pct(v.ret50)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-xs font-semibold text-gray-900 dark:text-zinc-100">
                          {v.clicks > 0 ? fmt(v.clicks) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-xs text-gray-600 dark:text-zinc-400">
                          {v.ctr !== null ? `${v.ctr.toFixed(2)}%` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-xs text-gray-500 dark:text-zinc-400">
                          {fmt(v.spend, 'currency')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', ACTION_CLASS[v.action])}>
                            {ACTION_LABEL[v.action]}
                          </span>
                        </td>
                      </tr>
                      {v.note && (
                        <tr key={`${v.rank}-note`} className="bg-gray-50/50 dark:bg-zinc-900/50">
                          <td />
                          <td colSpan={7} className="px-4 pb-2.5 pt-0">
                            <p className="text-xs text-gray-500 dark:text-zinc-500 italic leading-relaxed">
                              {v.note}
                            </p>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function PrivateSummary() {
  const sections = summaryData.sections as Section[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-zinc-800 dark:bg-zinc-700 flex items-center justify-center">
          <Lock className="w-3.5 h-3.5 text-zinc-300" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-zinc-100">Resumo Privado</h1>
          <p className="text-xs text-gray-400 dark:text-zinc-500">Análises e decisões estratégicas por campanha</p>
        </div>
      </div>

      {/* Sections */}
      {sections.map(section => (
        <SectionBlock key={section.id} section={section} />
      ))}

      {/* Placeholder for future sections */}
      <div className="border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-gray-400 dark:text-zinc-600">
        <p className="text-sm">Análises das demais campanhas serão adicionadas aqui</p>
        <p className="text-xs mt-1">Conversão, Google Ads, etc.</p>
      </div>
    </div>
  )
}
