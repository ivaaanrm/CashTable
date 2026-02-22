import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'

function LockIcon() {
  return (
    <svg className="w-8 h-8 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

export default function Login() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handlePinChange(e) {
    const value = e.target.value.replace(/\D/g, '')
    setPin(value)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(pin)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-xs animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-poker-dark/80 border border-poker-light/30 rounded-2xl flex items-center justify-center mb-4">
            <LockIcon />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-wide">CashTable</h1>
          <p className="text-slate-500 text-sm mt-1">Introduce tu PIN para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={handlePinChange}
            placeholder="····"
            autoFocus
            className="w-full bg-poker-dark/60 border border-poker-light/30 rounded-xl px-4 py-3 text-2xl font-mono tracking-[0.5em] text-gold-400 text-center placeholder-slate-700 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-colors"
          />

          {error && (
            <p className="text-chip-red text-sm text-center font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={pin.length < 4 || loading}
            className="w-full bg-gradient-to-b from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 disabled:opacity-40 disabled:cursor-not-allowed text-poker-dark py-3 rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer min-h-[44px] shadow-md text-sm"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
