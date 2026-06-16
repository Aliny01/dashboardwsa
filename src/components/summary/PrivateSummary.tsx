'use client'

import { Lock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'
import summaryData from '@/data/private-summary.json'

type Action = 'keep' | 'test' | 'pause'

interface Creative {
  rank: number
  name: string
  campaign: string
  url: string | null
  reach: number
  clicks: number
  ctr: number | null
  ret25: number | null
  ret50: number | null
  ret95: number | null
  spend: number
  messages: number
  costPerMessage: number | null
  action: Action
  note?: string
}

interface CampaignSummary {
  name: string
  messages: number
  spend: number
  costPerMessage: number
  reach: number
  action: Action
  note?: string
}

interface Section {
  id: string
  sectionType: string
  title: string
  period: string
  updatedAt: string
  totals: { spend: number; clicks: number; results: number; resultLabel: string }
  observation: string
  campaigns: CampaignSummary[]
  videos: Creative[]
}

const ACTION_LABEL: Record<Action, string> = { keep: 'Manter', test: 'Testar', pause: 'Pausar' }
const ACTION_CLASS: Record<Action, string> = {
  keep: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  test: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  pause: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
}
const ACTION_BORDER: Record<Action, string> = {
  keep: 'border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/10',
  test: 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/10',
  pause: 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10',
}
const ACTION_EMOJI: Record<Action, string> = { keep: '✅ Manter', test: '⏳ Testar', pause: '❌ Pausar' }

function fmt(n: number, style: 'currency' | 'decimal' = 'decimal') {
  if (style === 'currency')
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(n)
  return new Intl.NumberFormat('pt-BR').format(Math.round(n))
}

function pct(v: number | null) {
  return v === null ? '—' : `${v.toFixed(1)}%`
}

function RetBar({ value, max }: { value: number | null; max: number }) {
  if (value === null) return <span className="text-gray-300 dark:text-zinc-600 text-xs">—</span>
  const w = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const color = value >= 20 ? 'bg-green-500' : value >= 10 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="w-14 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full', color)} style={{ width: `${w}%` }} />
      </div>
      <span className="tabular-nums text-xs w-10 text-right">{pct(value)}</span>
    </div>
  )
}

function NameCell({ item }: { item: Creative }) {
  return (
    <div className="flex items-start gap-2">
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-800 dark:text-zinc-200 font-medium text-xs leading-snug">{item.name}</span>
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer"
              className="text-gray-300 hover:text-blue-500 dark:text-zinc-600 dark:hover:text-blue-400 shrink-0">
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        {item.campaign && (
          <span className="text-[10px] text-gray-400 dark:text-zinc-500">{item.campaign}</span>
        )}
      </div>
    </div>
  )
}

function DecisionCards({ items }: { items: Creative[] | CampaignSummary[] }) {
  const groups: Record<Action, string[]> = { keep: [], test: [], pause: [] }
  items.forEach(i => groups[i.action as Action].push(i.name))
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {(['keep', 'test', 'pause'] as Action[]).map(action => (
        <div key={action} className={clsx('rounded-xl border p-3 space-y-1', ACTION_BORDER[action])}>
          <p className={clsx('text-xs font-semibold uppercase tracking-wide',
            action === 'keep' ? 'text-green-700 dark:text-green-400'
            : action === 'test' ? 'text-amber-700 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400'
          )}>
            {ACTION_EMOJI[action]}
          </p>
          {groups[action].map((name, i) => (
            <p key={i} className="text-xs text-gray-600 dark:text-zinc-400 leading-snug">• {name}</p>
          ))}
        </div>
      ))}
    </div>
  )
}

function NoteRow({ item, colSpan }: { item: Creative; colSpan: number }) {
  if (!item.note) return null
  return (
    <tr className="bg-gray-50/50 dark:bg-zinc-900/50">
      <td />
      <td colSpan={colSpan} className="px-4 pb-2.5 pt-0">
        <p className="text-xs text-gray-500 dark:text-zinc-500 italic leading-relaxed">{item.note}</p>
      </td>
    </tr>
  )
}

function VideoBody({ section }: { section: Section }) {
  const maxRet = Math.max(...section.videos.map(v => v.ret95 ?? 0))
  return (
    <>
      <DecisionCards items={section.videos} />
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Análise por vídeo</p>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400 w-5">#</th>
                <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Vídeo</th>
                <th className="text-right px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Ret. 95%</th>
                <th className="text-right px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Ret. 50%</th>
                <th className="text-right px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Visitas</th>
                <th className="text-right px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400">CTR</th>
                <th className="text-right px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Gasto</th>
                <th className="text-center px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Decisão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {section.videos.map(v => (
                <>
                  <tr key={v.rank} className="bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                    <td className="px-3 py-3 text-gray-400 dark:text-zinc-500 text-xs">{v.rank}</td>
                    <td className="px-3 py-3 max-w-[200px]"><NameCell item={v} /></td>
                    <td className="px-3 py-3"><RetBar value={v.ret95} max={maxRet} /></td>
                    <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-600 dark:text-zinc-400">{pct(v.ret50)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-xs font-semibold text-gray-900 dark:text-zinc-100">
                      {v.clicks > 0 ? fmt(v.clicks) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-600 dark:text-zinc-400">
                      {v.ctr !== null ? `${v.ctr.toFixed(2)}%` : '—'}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-500 dark:text-zinc-400">{fmt(v.spend, 'currency')}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', ACTION_CLASS[v.action])}>
                        {ACTION_LABEL[v.action]}
                      </span>
                    </td>
                  </tr>
                  <NoteRow item={v} colSpan={7} />
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function MensagemBody({ section }: { section: Section }) {
  return (
    <>
      {/* Campaign comparison */}
      {section.campaigns.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Por campanha</p>
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Campanha</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Mensagens</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Custo/msg</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Alcance</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Gasto</th>
                  <th className="text-center px-4 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Decisão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {section.campaigns.map((c, i) => (
                  <>
                    <tr key={i} className="bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                      <td className="px-4 py-3 font-medium text-xs text-gray-800 dark:text-zinc-200">{c.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs font-semibold text-gray-900 dark:text-zinc-100">{c.messages}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {fmt(c.costPerMessage, 'currency')}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs text-gray-500 dark:text-zinc-400">{fmt(c.reach)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs text-gray-500 dark:text-zinc-400">{fmt(c.spend, 'currency')}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', ACTION_CLASS[c.action as Action])}>
                          {ACTION_LABEL[c.action as Action]}
                        </span>
                      </td>
                    </tr>
                    {c.note && (
                      <tr key={`${i}-note`} className="bg-gray-50/50 dark:bg-zinc-900/50">
                        <td colSpan={6} className="px-4 pb-2.5 pt-0">
                          <p className="text-xs text-gray-500 dark:text-zinc-500 italic leading-relaxed">{c.note}</p>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DecisionCards items={section.videos} />

      {/* Creatives table */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Análise por criativo</p>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400 w-5">#</th>
                <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Criativo</th>
                <th className="text-right px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Mensagens</th>
                <th className="text-right px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Custo/msg</th>
                <th className="text-right px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Visitas</th>
                <th className="text-right px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Alcance</th>
                <th className="text-right px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Gasto</th>
                <th className="text-center px-3 py-2.5 font-medium text-gray-500 dark:text-zinc-400">Decisão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {section.videos.map(v => (
                <>
                  <tr key={v.rank} className="bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                    <td className="px-3 py-3 text-gray-400 dark:text-zinc-500 text-xs">{v.rank}</td>
                    <td className="px-3 py-3 max-w-[200px]"><NameCell item={v} /></td>
                    <td className="px-3 py-3 text-right tabular-nums text-xs font-semibold text-gray-900 dark:text-zinc-100">
                      {v.messages > 0 ? v.messages : '—'}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {v.costPerMessage !== null ? fmt(v.costPerMessage, 'currency') : '—'}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-600 dark:text-zinc-400">
                      {v.clicks > 0 ? fmt(v.clicks) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-500 dark:text-zinc-400">{fmt(v.reach)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-500 dark:text-zinc-400">{fmt(v.spend, 'currency')}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', ACTION_CLASS[v.action])}>
                        {ACTION_LABEL[v.action]}
                      </span>
                    </td>
                  </tr>
                  <NoteRow item={v} colSpan={7} />
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function SectionBlock({ section }: { section: Section }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{section.title}</h2>
          <span className="text-xs text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            {section.period}
          </span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            atualizado em {new Date(section.updatedAt + 'T12:00:00').toLocaleDateString('pt-BR')}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
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
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-0.5 capitalize">{section.totals.resultLabel}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{section.totals.results}</p>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-0.5">Custo / {section.totals.resultLabel.replace(/s$/, '')}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                {section.totals.results > 0 ? fmt(section.totals.spend / section.totals.results, 'currency') : '—'}
              </p>
            </div>
          </div>

          {/* Observation */}
          {section.observation && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
              {section.observation}
            </div>
          )}

          {section.sectionType === 'mensagem'
            ? <MensagemBody section={section} />
            : <VideoBody section={section} />
          }
        </div>
      )}
    </div>
  )
}

export function PrivateSummary() {
  const sections = summaryData.sections as Section[]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-zinc-800 dark:bg-zinc-700 flex items-center justify-center">
          <Lock className="w-3.5 h-3.5 text-zinc-300" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-zinc-100">Resumo Privado</h1>
          <p className="text-xs text-gray-400 dark:text-zinc-500">Análises e decisões estratégicas por campanha</p>
        </div>
      </div>

      {sections.map(section => (
        <SectionBlock key={section.id} section={section} />
      ))}

      <div className="border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-gray-400 dark:text-zinc-600">
        <p className="text-sm">Análises das demais campanhas serão adicionadas aqui</p>
        <p className="text-xs mt-1">Galpões, Orçamentista, Google Ads, etc.</p>
      </div>
    </div>
  )
}
