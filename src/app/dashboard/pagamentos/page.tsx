'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, AlertCircle, CircleDot, CreditCard, Wallet, HelpCircle } from 'lucide-react'
import { clsx } from 'clsx'
import type { ClientPaymentRow } from '@/lib/payments-api'

const AUTO_REFRESH_MS = 5 * 60 * 1000 // 5 minutos

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
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
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
            ))}
          </div>
        )}

        {rows.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-800/50 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400">
                  <th className="px-4 py-2.5 font-medium">Cliente</th>
                  <th className="px-4 py-2.5 font-medium">Plataforma</th>
                  <th className="px-4 py-2.5 font-medium">Ativo</th>
                  <th className="px-4 py-2.5 font-medium">Pagamento</th>
                  <th className="px-4 py-2.5 font-medium">Verba / Saldo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={`${row.clientKey}-${row.platform}`}
                    className="border-t border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-zinc-100">
                      {row.clientName}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={clsx(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          row.platform === 'Meta'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        )}
                      >
                        {row.platform}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {row.error ? (
                        <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400" title={row.error}>
                          <HelpCircle className="w-3.5 h-3.5" /> Erro
                        </span>
                      ) : (
                        <span
                          className={clsx(
                            'flex items-center gap-1.5 text-xs font-medium',
                            row.active ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-zinc-500'
                          )}
                        >
                          <CircleDot className="w-3.5 h-3.5" />
                          {row.active ? 'Ativo' : 'Sem veiculação'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.paymentType === 'Cartão' && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400">
                          <CreditCard className="w-3.5 h-3.5" /> {row.cardLabel ?? 'Cartão'}
                        </span>
                      )}
                      {row.paymentType === 'Verba' && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400">
                          <Wallet className="w-3.5 h-3.5" /> Verba
                        </span>
                      )}
                      {row.paymentType === 'Sem dados' && (
                        <span className="text-xs text-gray-400 dark:text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.paymentType === 'Verba' ? (
                        <span
                          className={clsx(
                            'text-xs font-semibold',
                            row.exhausted ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-zinc-300'
                          )}
                        >
                          {row.exhausted ? 'Esgotado' : row.balanceLabel}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-zinc-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-zinc-500 text-center">
          Atualiza sozinho a cada 5 minutos, ou clique em &quot;Atualizar agora&quot;.
        </p>
      </main>
    </div>
  )
}
