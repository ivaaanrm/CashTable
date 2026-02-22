import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGame } from '../api/games'

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function NewGameModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [chipsPerEuro, setChipsPerEuro] = useState('1')
  const [bigBlind, setBigBlind] = useState('')
  const queryClient = useQueryClient()

  const chipsNum = parseFloat(chipsPerEuro)
  const chipValue = chipsNum > 0 ? 1 / chipsNum : null

  const mutation = useMutation({
    mutationFn: createGame,
    onSuccess: (createdGame) => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
      if (onCreated) onCreated(createdGame)
      onClose()
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !chipValue) return
    const payload = { name: name.trim(), chip_value: chipValue }
    const bb = parseFloat(bigBlind)
    if (bb > 0) payload.big_blind_value = bb
    mutation.mutate(payload)
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-poker-dark/95 backdrop-blur-xl rounded-2xl w-full max-w-md border border-poker-light/30 shadow-2xl shadow-black animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-poker-light/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
          <h2 className="text-xl font-bold tracking-wide text-slate-100 relative z-10">Nueva partida</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 relative z-10"
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label htmlFor="game-name" className="block text-xs font-bold uppercase tracking-wide text-emerald-200/50 mb-1.5">
              Nombre de la partida
            </label>
            <input
              id="game-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Viernes noche"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all shadow-inner font-medium"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="chips-per-euro" className="block text-xs font-bold uppercase tracking-wide text-emerald-200/50 mb-1.5">
              Fichas por euro
            </label>
            <input
              id="chips-per-euro"
              type="number"
              value={chipsPerEuro}
              onChange={(e) => setChipsPerEuro(e.target.value)}
              min="1"
              step="1"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gold-400 font-mono text-xl font-bold focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all shadow-inner"
            />
            {chipValue && (
              <p className="text-emerald-100/60 text-xs mt-2 font-mono font-medium">
                1€ = {chipsNum} ficha{chipsNum !== 1 ? 's' : ''} · 1 ficha = {chipValue.toFixed(4).replace(/\.?0+$/, '')}€
              </p>
            )}
          </div>

          <div>
            <label htmlFor="big-blind" className="block text-xs font-bold uppercase tracking-wide text-emerald-200/50 mb-1.5">
              Big Blind <span className="normal-case font-normal text-emerald-200/30">(opcional)</span>
            </label>
            <input
              id="big-blind"
              type="number"
              value={bigBlind}
              onChange={(e) => setBigBlind(e.target.value)}
              min="1"
              step="1"
              placeholder="Ej: 100"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gold-400 font-mono text-xl font-bold focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all shadow-inner placeholder-slate-600"
            />
          </div>

          {mutation.isError && (
            <p className="text-chip-red text-sm font-medium bg-chip-red/10 p-2 rounded-lg border border-chip-red/20 text-center" role="alert">
              {mutation.error.message}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !name.trim() || !chipValue}
              className="flex-[1.5] py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed text-poker-dark rounded-xl font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer min-h-[44px] bg-gradient-to-b from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500"
            >
              {mutation.isPending ? 'Creando...' : 'Crear partida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
