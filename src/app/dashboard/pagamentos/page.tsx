'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw, AlertCircle, CircleDot, HelpCircle } from 'lucide-react'
import { clsx } from 'clsx'
import type { ClientPaymentRow } from '@/lib/payments-api'

const AUTO_REFRESH_MS = 5 * 60 * 1000 // 5 minutos

interface ClientGroup {
  clientKey: string
  clientName: string
  platforms: ClientPaymentRow[]
}

export default function PagamentosPage() {
  const [rows, setRows] = useState<ClientPaymentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao buscar pagamentos')
      setRows(data.rows)
      setLastFetched(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
    timerRef.current = setInterval(fetchPayments, AUTO_REFRESH_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [fetchPayments])

  const exhaustedCount = rows.filter((r) => r.exhausted).length
  const inactiveCount = rows.filter((r) => !r.active && !r.error).length

  const groups = useMemo<ClientGroup[]>(() => {
    const map = new Map<string, ClientGroup>()
    for (const row of rows) {
      if (!map.has(row.clientKey)) {
        map.set(row.clientKey, { clientKey: row.clientKey, clientName: row.clientName, platforms: [] })
      }
      map.get(row.clientKey)!.platforms.push(row)
    }
    return Array.from(map.values()).sort((a, b) => a.clientName.localeCompare(b.clientName))
  }, [rows])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">W</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-zinc-100 text-sm">
              Pagamentos · Agência Win
            </span>
          </div>

          <div className="flex items-center gap-3">
            {lastFetched && (
              <span className="text-xs text-gray-400 dark:text-zinc-500 hidden sm:inline">
                Atualizado às {lastFetched.toLocaleTimeString('pt-BR')}
              </span>
            )}
            <button
              onClick={fetchPayments}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
              Atualizar agora
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 sm:px-8 py-6 space-y-4">
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Erro ao carregar pagamentos</p>
              <p className="text-xs mt-1 opacity-80">{error}</p>
            </div>
          </div>
        )}

        {(exhaustedCount > 0 || inactiveCount > 0) && !loading && (
          <div className="flex flex-wrap gap-3">
            {exhaustedCount > 0 && (
              <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">
                <AlertCircle className="w-3.5 h-3.5" />
                {exhaustedCount} conta{exhaustedCount > 1 ? 's' : ''} com verba esgotada
              </div>
            )}
            {inactiveCount > 0 && (
              <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                <CircleDot className="w-3.5 h-3.5" />
                {inactiveCount} conta{inactiveCount > 1 ? 's' : ''} sem veiculação nos últimos 7 dias
              </div>
            )}
          </div>
        )}

        {loading && rows.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
            ))}
          </div>
        )}

        {groups.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groups.map((group) => {
              const anyActive = group.platforms.some((p) => p.active)
              const anyExhausted = group.platforms.some((p) => p.exhausted)

              return (
                <div
                  key={group.clientKey}
                  className={clsx(
                    'bg-white dark:bg-zinc-900 border rounded-xl p-4 flex flex-col gap-3',
                    anyExhausted
                      ? 'border-red-200 dark:border-red-900'
                      : 'border-gray-200 dark:border-zinc-800'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-zinc-100 truncate">
                      {group.clientName}
                    </h3>
                    <span
                      className={clsx(
                        'flex items-center gap-1 text-[11px] font-medium shrink-0',
                        anyActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-zinc-500'
                      )}
                    >
                      <CircleDot className="w-3 h-3" />
                      {anyActive ? 'Ativo' : 'Parado'}
                    </span>
                  </div>

                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                        <th className="font-medium pb-1.5">Plataforma</th>
                        <th className="font-medium pb-1.5">Pagamento</th>
                        <th className="font-medium pb-1.5 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.platforms.map((p) => (
                        <tr key={p.platform} className="border-t border-gray-100 dark:border-zinc-800">
                          <td className="py-1.5">
                            <span
                              className={clsx(
                                'text-[10px] font-medium px-1.5 py-0.5 rounded',
                                p.platform === 'Meta'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                              )}
                            >
                              {p.platform}
                            </span>
                          </td>
                          <td className="py-1.5 text-gray-600 dark:text-zinc-400">
                            {p.error ? (
                              <span className="flex items-center gap-1 text-red-600 dark:text-red-400" title={p.error}>
                                <HelpCircle className="w-3 h-3" /> Erro
                              </span>
                            ) : p.paymentType === 'Cartão' ? (
                              p.cardLabel ?? 'Cartão'
                            ) : p.paymentType === 'Verba' ? (
                              'Verba'
                            ) : (
                              <span className="text-gray-400 dark:text-zinc-500">—</span>
                            )}
                          </td>
                          <td
                            className={clsx(
                              'py-1.5 text-right font-semibold',
                              p.exhausted
                                ? 'text-red-600 dark:text-red-400'
                                : p.paymentType === 'Verba'
                                  ? 'text-gray-700 dark:text-zinc-300'
                                  : 'text-gray-400 dark:text-zinc-500'
                            )}
                          >
                            {p.paymentType === 'Verba' ? (p.exhausted ? 'Esgotado' : p.balanceLabel) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-zinc-500 text-center">
          Atualiza sozinho a cada 5 minutos, ou clique em &quot;Atualizar agora&quot;.
        </p>
      </main>
    </div>
  )
}
