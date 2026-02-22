import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addPlayer } from '../api/players'

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function AddPlayerModal({ gameId, onClose }) {
  const [name, setName] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data) => addPlayer(gameId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      onClose()
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    mutation.mutate({ name: name.trim() })
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-poker-dark/95 backdrop-blur-xl rounded-2xl w-full max-w-md border border-poker-light/30 shadow-2xl shadow-black animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-poker-light/20">
          <h2 className="text-xl font-bold tracking-wide text-slate-100">Añadir Jugador</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/10"
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="player-name" className="block text-sm font-bold uppercase tracking-wide text-emerald-200/70 mb-1.5">
              Nombre del jugador
            </label>
            <input
              id="player-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Daniel Negreanu"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all shadow-inner"
              autoFocus
            />
          </div>

          {mutation.isError && (
            <p className="text-red-400 text-sm" role="alert">
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
              disabled={mutation.isPending || !name.trim()}
              className="flex-1 py-3 px-4 bg-gradient-to-b from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-poker-dark rounded-xl font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer min-h-[44px]"
            >
              {mutation.isPending ? 'Añadiendo...' : 'Añadir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
