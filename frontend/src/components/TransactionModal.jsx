import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addTransaction } from '../api/transactions'

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function TransactionModal({ gameId, players, onClose }) {
  const [playerId, setPlayerId] = useState(players[0]?.id ?? '')
  const [type, setType] = useState('buy_in')
  const [chips, setChips] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: addTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      onClose()
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!chips || !playerId) return
    mutation.mutate({
      game_id: gameId,
      player_id: parseInt(playerId),
      type,
      chips: parseInt(chips),
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">Registrar movimiento</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-700"
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Player selector */}
          <div>
            <label htmlFor="player-select" className="block text-sm font-medium text-slate-300 mb-1.5">
              Jugador
            </label>
            <select
              id="player-select"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors cursor-pointer"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type toggle */}
          <div>
            <p className="block text-sm font-medium text-slate-300 mb-1.5">Tipo</p>
            <div className="flex rounded-lg border border-slate-600 overflow-hidden">
              <button
                type="button"
                onClick={() => setType('buy_in')}
                className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer min-h-[44px] ${
                  type === 'buy_in'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Buy-in
              </button>
              <button
                type="button"
                onClick={() => setType('cash_out')}
                className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer min-h-[44px] ${
                  type === 'cash_out'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Cash-out
              </button>
            </div>
          </div>

          {/* Chips input */}
          <div>
            <label htmlFor="chips-input" className="block text-sm font-medium text-slate-300 mb-1.5">
              Cantidad de fichas
            </label>
            <input
              id="chips-input"
              type="number"
              value={chips}
              onChange={(e) => setChips(e.target.value)}
              min="1"
              placeholder="Ej: 100"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
              autoFocus
            />
          </div>

          {mutation.isError && (
            <p className="text-red-400 text-sm" role="alert">
              {mutation.error.message}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-colors cursor-pointer min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !chips || !playerId}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors cursor-pointer min-h-[44px]"
            >
              {mutation.isPending ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
