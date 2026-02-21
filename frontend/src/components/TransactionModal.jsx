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

export default function TransactionModal({
  gameId,
  players,
  onClose,
  defaultPlayerId = null,
  defaultType = 'buy_in',
  defaultChips = '',
  lockedPlayerId = null,
}) {
  const [playerId, setPlayerId] = useState(
    lockedPlayerId ?? defaultPlayerId ?? players[0]?.id ?? ''
  )
  const [type, setType] = useState(defaultType)
  const [chips, setChips] = useState(defaultChips !== '' ? String(defaultChips) : '')
  const queryClient = useQueryClient()

  const selectedPlayer = players.find((p) => p.id === parseInt(playerId))
  const currentChips = selectedPlayer
    ? (selectedPlayer.actual_chips != null ? selectedPlayer.actual_chips : selectedPlayer.chips_in_play)
    : 0
  const maxChips = type === 'cash_out' && selectedPlayer ? currentChips : undefined

  const mutation = useMutation({
    mutationFn: addTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      queryClient.invalidateQueries({ queryKey: ['player-transactions', parseInt(playerId)] })
      onClose()
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    const chipsVal = parseInt(chips)
    if (!chips || !playerId || isNaN(chipsVal)) return
    mutation.mutate({
      game_id: gameId,
      player_id: parseInt(playerId),
      type,
      chips: chipsVal,
    })
  }

  function handleChipsChange(e) {
    const val = e.target.value
    if (maxChips !== undefined && parseInt(val) > maxChips) {
      setChips(String(maxChips))
    } else {
      setChips(val)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-poker-dark/95 backdrop-blur-xl rounded-2xl w-full max-w-md border border-poker-light/30 shadow-2xl shadow-black animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-poker-light/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
          <h2 className="text-xl font-bold tracking-wide text-slate-100 relative z-10">Registrar movimiento</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 relative z-10"
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Player — locked or selectable */}
          {lockedPlayerId ? (
            <div>
              <p className="block text-xs font-bold uppercase tracking-wide text-emerald-200/50 mb-1.5">Jugador</p>
              <div className="w-full bg-black/30 border border-white/5 shadow-inner rounded-xl px-4 py-3 text-slate-100 font-bold tracking-wide text-lg">
                {selectedPlayer?.name ?? '—'}
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="player-select" className="block text-xs font-bold uppercase tracking-wide text-emerald-200/50 mb-1.5">
                Jugador
              </label>
              <select
                id="player-select"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-100 font-medium focus:outline-none focus:border-gold-500 transition-colors cursor-pointer shadow-inner"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type toggle */}
          <div>
            <p className="block text-xs font-bold uppercase tracking-wide text-emerald-200/50 mb-1.5">Tipo de Movimiento</p>
            <div className="flex rounded-xl border border-white/10 overflow-hidden shadow-inner p-1 bg-black/40 gap-1">
              <button
                type="button"
                onClick={() => setType('buy_in')}
                className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer min-h-[44px] ${type === 'buy_in'
                    ? 'bg-gradient-to-b from-gold-400 to-gold-600 text-poker-dark shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
              >
                Buy-in
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('cash_out')
                  if (maxChips !== undefined && parseInt(chips) > maxChips) {
                    setChips(String(maxChips))
                  }
                }}
                className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer min-h-[44px] ${type === 'cash_out'
                    ? 'bg-gradient-to-b from-chip-red to-red-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
              >
                Cash-out
              </button>
            </div>
          </div>

          {/* Chips input */}
          <div>
            <label htmlFor="chips-input" className="block text-xs font-bold uppercase tracking-wide text-emerald-200/50 mb-1.5">
              Cantidad de fichas
              {type === 'cash_out' && maxChips !== undefined && (
                <span className="ml-2 text-slate-500 font-normal normal-case tracking-normal">
                  (máx. {maxChips})
                </span>
              )}
            </label>
            <input
              id="chips-input"
              type="number"
              value={chips}
              onChange={handleChipsChange}
              min="1"
              max={maxChips}
              placeholder="Ej: 100"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gold-400 font-mono text-xl font-bold placeholder-slate-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all shadow-inner"
              autoFocus
            />
            {type === 'cash_out' && maxChips === 0 && (
              <p className="text-amber-500 text-xs mt-2 font-medium">Este jugador no tiene fichas en juego.</p>
            )}
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
              disabled={mutation.isPending || !chips || !playerId || (type === 'cash_out' && maxChips === 0)}
              className={`flex-[1.5] py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer min-h-[44px] ${type === 'buy_in'
                  ? 'bg-gradient-to-b from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 text-poker-dark'
                  : 'bg-gradient-to-b from-chip-red to-red-800 hover:from-red-500 hover:to-chip-red text-white'
                }`}
            >
              {mutation.isPending ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
