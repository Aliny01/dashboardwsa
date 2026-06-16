'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { MetaDashboardData } from '@/types/meta'

interface ExportPDFButtonProps {
  data: MetaDashboardData | null
}

export function ExportPDFButton({ data }: ExportPDFButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    if (!data) return
    setLoading(true)
    try {
      const { exportMetaPDF } = await import('@/lib/export-pdf')
      exportMetaPDF(data)
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
      alert('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={!data || loading}
      className={clsx(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {loading ? 'Gerando PDF…' : 'Exportar PDF'}
    </button>
  )
}
