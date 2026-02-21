import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPlayerTransactions, deletePlayer, updatePlayerChips } from '../api/players'
import { deleteTransaction } from '../api/transactions'

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PlayerModal({ player, gameId, isClosed, chipValue = 1, onClose, onRegisterMovement }) {
  const queryClient = useQueryClient()
  const serverChips = player.actual_chips != null ? player.actual_chips : player.chips_in_play
  const [optimisticChips, setOptimisticChips] = useState(null)
  const currentChips = optimisticChips != null ? optimisticChips : serverChips
  const [editingChips, setEditingChips] = useState(false)
  const [chipInput, setChipInput] = useState(String(currentChips))
  const inputRef = useRef(null)

  // Sync optimistic state when server data catches up
  useEffect(() => {
    if (optimisticChips != null && serverChips === optimisticChips) {
      setOptimisticChips(null)
    }
  }, [serverChips, optimisticChips])

  useEffect(() => {
    if (editingChips && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingChips])

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['player-transactions', player.id],
    queryFn: () => getPlayerTransactions(player.id),
  })

  const deleteTransactionMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-transactions', player.id] })
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
    },
  })

  const deletePlayerMutation = useMutation({
    mutationFn: () => deletePlayer(player.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      onClose()
    },
  })

  const updateChipsMutation = useMutation({
    mutationFn: (chips) => updatePlayerChips(player.id, chips),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      setEditingChips(false)
    },
    onError: () => {
      setOptimisticChips(null)
    },
  })

  const isPositive = player.net_balance > 0.01
  const isNegative = player.net_balance < -0.01
  const hasChipsInPlay = currentChips > 0
  const virtualMoney = currentChips * chipValue
  const pct = player.money_spent > 0.001
    ? (player.net_balance / player.money_spent) * 100
    : null

  function handleStepChips(delta) {
    const newVal = Math.max(0, currentChips + delta)
    setOptimisticChips(newVal)
    updateChipsMutation.mutate(newVal)
  }

  function handleSubmitChips() {
    const val = parseInt(chipInput)
    if (!isNaN(val) && val >= 0) {
      setOptimisticChips(val)
      updateChipsMutation.mutate(val)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-poker-dark/95 backdrop-blur-xl rounded-2xl w-full max-w-md border border-poker-light/30 shadow-2xl shadow-black max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-poker-light/20 flex-shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
          <h2 className="text-xl font-bold tracking-wide text-slate-100 flex items-center gap-2">
            <span className="w-2 h-6 bg-gold-500 rounded-sm inline-block" />
            {player.name}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 relative z-10"
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* HERO: Fichas en Juego */}
          <div className="flex flex-col items-center py-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-3">
              Fichas en juego
            </p>

            {!isClosed && editingChips ? (
              /* Edit mode: centered input */
              <div className="flex items-center gap-2 mb-2">
                <input
                  ref={inputRef}
                  type="number"
                  value={chipInput}
                  onChange={(e) => setChipInput(e.target.value)}
                  min="0"
                  className="w-28 bg-black/40 border-2 border-gold-500/50 rounded-xl px-3 py-2 text-center text-gold-400 font-mono text-3xl font-bold focus:outline-none focus:border-gold-400 focus:shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmitChips()
                    if (e.key === 'Escape') setEditingChips(false)
                  }}
                />
                <button
                  onClick={handleSubmitChips}
                  disabled={updateChipsMutation.isPending}
                  className="p-3 bg-gradient-to-b from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 text-poker-dark rounded-xl transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50 min-h-[44px] min-w-[44px] shadow-lg"
                  aria-label="Confirmar fichas"
                >
                  <CheckIcon />
                </button>
              </div>
            ) : (
              /* Display mode: big number with steppers */
              <div className="flex items-center gap-3 mb-2">
                {!isClosed && (
                  <button
                    onClick={() => handleStepChips(-10)}
                    disabled={currentChips <= 0 || updateChipsMutation.isPending}
                    className="w-12 h-12 rounded-full bg-white/5 hover:bg-chip-red/20 border border-white/10 hover:border-chip-red/50 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default gap-0.5"
                    aria-label="Restar 10 fichas"
                  >
                    <span className="text-xs font-bold font-mono">-10</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (!isClosed) {
                      setChipInput(String(currentChips))
                      setEditingChips(true)
                    }
                  }}
                  disabled={isClosed}
                  className={`font-mono text-5xl font-bold text-slate-100 tabular-nums px-4 py-2 border border-transparent rounded-xl transition-all ${!isClosed
                      ? 'hover:bg-white/5 hover:border-white/10 hover:shadow-inner cursor-pointer'
                      : 'cursor-default'
                    }`}
                  aria-label={!isClosed ? 'Editar fichas' : undefined}
                >
                  {currentChips}
                </button>

                {!isClosed && (
                  <button
                    onClick={() => handleStepChips(10)}
                    disabled={updateChipsMutation.isPending}
                    className="w-12 h-12 rounded-full bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 gap-0.5"
                    aria-label="Sumar 10 fichas"
                  >
                    <span className="text-xs font-bold font-mono">+10</span>
                  </button>
                )}
              </div>
            )}

            <p className="font-mono text-sm text-slate-400">
              {virtualMoney.toFixed(2)}€
            </p>

            {!isClosed && !editingChips && (
              <p className="text-[10px] text-slate-600 mt-1.5">
                Toca el numero para editar
              </p>
            )}
          </div>

          {/* Secondary stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5 shadow-inner">
              <p className="text-emerald-200/50 text-[10px] uppercase tracking-wider font-bold">Inversión</p>
              <p className="font-mono font-bold text-slate-100 text-sm mt-1">{player.money_spent.toFixed(2)}€</p>
              <p className="font-mono text-[10px] text-emerald-200/40">{player.buy_in_chips} fichas</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5 shadow-inner">
              <p className="text-emerald-200/50 text-[10px] uppercase tracking-wider font-bold">P/L</p>
              <p
                className={`font-mono font-black text-sm mt-1 drop-shadow-sm ${isPositive ? 'text-emerald-400' : isNegative ? 'text-chip-red' : 'text-slate-400'
                  }`}
              >
                {isPositive ? '+' : ''}{player.net_balance.toFixed(2)}€
              </p>
              <p className="font-mono text-[10px] text-emerald-200/40">cash-out: {player.cash_out_chips}</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5 shadow-inner">
              <p className="text-emerald-200/50 text-[10px] uppercase tracking-wider font-bold">ROI</p>
              {pct !== null ? (
                <p
                  className={`font-mono font-black text-sm mt-1 drop-shadow-sm ${pct > 0.5 ? 'text-emerald-400' : pct < -0.5 ? 'text-chip-red' : 'text-slate-400'
                    }`}
                >
                  {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                </p>
              ) : (
                <p className="font-mono font-bold text-slate-600 text-sm mt-1">—</p>
              )}
            </div>
          </div>

          {/* Actions (active game only) */}
          {!isClosed && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onClose()
                  onRegisterMovement(player, 'buy_in')
                }}
                className="flex-1 py-3 bg-gradient-to-b from-emerald-600 to-poker-light hover:from-emerald-500 hover:to-emerald-600 border border-emerald-400/30 text-white rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer min-h-[44px] text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30"
              >
                <PlusIcon />
                Buy-in
              </button>
              {hasChipsInPlay && (
                <button
                  onClick={() => {
                    onClose()
                    onRegisterMovement(player, 'cash_out')
                  }}
                  className="flex-1 py-3 bg-gradient-to-b from-chip-red to-red-800 hover:from-red-500 hover:to-chip-red border border-red-400/30 text-white rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer min-h-[44px] text-sm shadow-md shadow-red-900/30"
                >
                  Cash-out
                </button>
              )}
            </div>
          )}

          {/* Transaction history */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Movimientos
            </p>
            {isLoading ? (
              <p className="text-slate-500 text-sm text-center py-4">Cargando...</p>
            ) : transactions.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-4">Sin movimientos</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 bg-slate-700/40 rounded-lg px-3 py-2.5"
                  >
                    <span
                      className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${tx.type === 'buy_in'
                          ? 'bg-emerald-900/60 text-emerald-400'
                          : 'bg-red-900/60 text-red-400'
                        }`}
                    >
                      {tx.type === 'buy_in' ? 'Buy-in' : 'Cash-out'}
                    </span>
                    <span className="font-mono text-slate-100 font-medium flex-1">
                      {tx.chips} fichas
                    </span>
                    <span className="text-slate-600 text-xs">{formatTime(tx.created_at)}</span>
                    {!isClosed && (
                      <button
                        onClick={() => {
                          if (confirm('¿Anular este movimiento?')) {
                            deleteTransactionMutation.mutate(tx.id)
                          }
                        }}
                        disabled={deleteTransactionMutation.isPending}
                        className="text-slate-600 hover:text-red-400 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
                        aria-label="Anular movimiento"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer — delete player (only active, no transactions) */}
        {!isClosed && transactions.length === 0 && (
          <div className="p-5 border-t border-poker-light/20 flex-shrink-0 bg-black/10">
            <button
              onClick={() => {
                if (confirm(`¿Eliminar a ${player.name} de la partida?`)) {
                  deletePlayerMutation.mutate()
                }
              }}
              disabled={deletePlayerMutation.isPending}
              className="w-full py-2.5 text-slate-500 hover:text-chip-red transition-colors cursor-pointer text-sm font-bold uppercase tracking-wider min-h-[44px] flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <TrashIcon />
              Eliminar jugador
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
