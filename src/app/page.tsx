'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, BarChart2, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'

const PASSWORD = '123456'
const SESSION_KEY = 'wsa_hub_auth'

const CLIENTS = [
  {
    key: 'wsa',
    name: 'WSA Dashboard',
    description: 'Amancio Construtora · Planta Arquitetura · Galpões',
    href: '/dashboard',
    color: 'bg-blue-600',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-900',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    initial: 'W',
  },
  {
    key: 'excelencia',
    name: 'Excelência Transporte Executivo',
    description: 'Meta Ads · Google Ads',
    href: '/dashboard/excelencia',
    color: 'bg-emerald-600',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-900',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    initial: 'E',
  },
]

function PasswordScreen({ onAuth }: { onAuth: () => void }) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onAuth()
    } else {
      setError(true)
      setShake(true)
      setValue('')
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg">
            <BarChart2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">WSA Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Área restrita</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={clsx('space-y-3', shake && 'animate-[shake_0.4s_ease]')}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(false) }}
              placeholder="Senha de acesso"
              autoFocus
              className={clsx(
                'w-full pl-9 pr-10 py-3 rounded-xl border text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder-gray-400 outline-none transition-colors',
                error
                  ? 'border-red-400 dark:border-red-600'
                  : 'border-gray-200 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-500'
              )}
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">Senha incorreta</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) }
          20% { transform: translateX(-8px) }
          40% { transform: translateX(8px) }
          60% { transform: translateX(-6px) }
          80% { transform: translateX(6px) }
        }
      `}</style>
    </div>
  )
}

function ClientHub() {
  const router = useRouter()

  function logout() {
    sessionStorage.removeItem(SESSION_KEY)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-zinc-100 text-sm">WSA Dashboard</span>
          </div>
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Selecionar cliente</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Escolha o cliente para acessar o dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CLIENTS.map((client) => (
            <button
              key={client.key}
              onClick={() => router.push(client.href)}
              className={clsx(
                'group text-left rounded-2xl border p-5 transition-all hover:shadow-md',
                client.borderColor,
                client.bgColor
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', client.color)}>
                  <span className="text-white font-bold text-base">{client.initial}</span>
                </div>
                <ExternalLink className={clsx('w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity', client.textColor)} />
              </div>
              <p className={clsx('font-semibold text-sm', client.textColor)}>{client.name}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{client.description}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    setAuthed(sessionStorage.getItem(SESSION_KEY) === '1')
  }, [])

  if (authed === null) return null

  if (!authed) return <PasswordScreen onAuth={() => setAuthed(true)} />

  return <ClientHub />
}
