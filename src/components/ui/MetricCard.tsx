import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { clsx } from 'clsx'

interface MetricCardProps {
  label: string
  value: string
  delta?: number          // percentage change vs previous period
  deltaLabel?: string
  prefix?: string
  suffix?: string
  highlight?: boolean
}

export function MetricCard({
  label,
  value,
  delta,
  deltaLabel,
  highlight = false,
}: MetricCardProps) {
  const hasDelta = delta !== undefined
  const isUp = hasDelta && delta > 0
  const isDown = hasDelta && delta < 0

  return (
    <div
      className={clsx(
        'rounded-xl border p-4 transition-all',
        highlight
          ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800'
          : 'bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-800'
      )}
    >
      <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 tabular-nums">
        {value}
      </p>
      {hasDelta && (
        <div className="flex items-center gap-1 mt-1.5">
          {isUp && <TrendingUp className="w-3 h-3 text-green-600" />}
          {isDown && <TrendingDown className="w-3 h-3 text-red-500" />}
          {!isUp && !isDown && <Minus className="w-3 h-3 text-gray-400" />}
          <span
            className={clsx(
              'text-xs font-medium',
              isUp && 'text-green-600',
              isDown && 'text-red-500',
              !isUp && !isDown && 'text-gray-400'
            )}
          >
            {isUp ? '+' : ''}{delta?.toFixed(1)}%
          </span>
          {deltaLabel && (
            <span className="text-xs text-gray-400">{deltaLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
