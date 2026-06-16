'use client'

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { MetaDailyInsight } from '@/types/meta'

interface MetaChartsProps {
  daily: MetaDailyInsight[]
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'dd/MM', { locale: ptBR })
  } catch {
    return dateStr
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-gray-700 dark:text-zinc-300 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function MetaCharts({ daily }: MetaChartsProps) {
  const data = daily.map((d) => ({
    ...d,
    date: formatDate(d.date),
    spend: Math.round(d.spend * 100) / 100,
  }))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Leads + Conversas por dia */}
      <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-4">
          Leads e Conversas por dia
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="leads" name="Leads" fill="#3B82F6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="messages" name="Conversas" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Investimento diário */}
      <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-4">
          Investimento diário (R$)
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="spend"
              name="Investido (R$)"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#spendGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Alcance diário */}
      <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-4">
          Alcance diário
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="reach"
              name="Alcance"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#reachGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Cliques diários */}
      <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-4">
          Cliques diários
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barCategoryGap="40%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="clicks" name="Cliques" fill="#F59E0B" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
