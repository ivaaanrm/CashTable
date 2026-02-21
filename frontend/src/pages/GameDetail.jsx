import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGame, closeGame } from '../api/games'
import PlayerCard from '../components/PlayerCard'
import PlayerModal from '../components/PlayerModal'
import TransactionModal from '../components/TransactionModal'
import AddPlayerModal from '../components/AddPlayerModal'

function BackIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

export default function GameDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showTransaction, setShowTransaction] = useState(false)
  const [transactionDefaults, setTransactionDefaults] = useState({})
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  const gameId = parseInt(id)

  const { data: game, isLoading, isError } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => getGame(id),
  })

  const closeMutation = useMutation({
    mutationFn: () => closeGame(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      navigate(`/games/${id}/settlement`)
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Cargando...</p>
      </div>
    )
  }

  if (isError || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-3">Error al cargar la partida</p>
          <Link to="/" className="text-emerald-400 text-sm">
            Volver a inicio
          </Link>
        </div>
      </div>
    )
  }

  const isClosed = game.status === 'closed'
  const players = game.players ?? []
  const totalPot = players.reduce((sum, p) => sum + p.money_spent, 0)
  const totalChipsInPlay = players.reduce((sum, p) => sum + p.chips_in_play, 0)
  const balanceInPlay = totalChipsInPlay * game.chip_value

  // Chip reconciliation: compare actual reported chips vs expected
  const playersWithActual = players.filter((p) => p.actual_chips != null)
  const hasAnyActual = playersWithActual.length > 0
  const totalActualChips = hasAnyActual
    ? players.reduce((sum, p) => sum + (p.actual_chips != null ? p.actual_chips : p.chips_in_play), 0)
    : totalChipsInPlay
  const chipDifference = totalActualChips - totalChipsInPlay
  const isReconciled = chipDifference === 0
  const playersNotReported = players.filter((p) => p.actual_chips == null).length

  function openTransactionFor(player, type = 'buy_in') {
    setTransactionDefaults({
      playerId: player.id,
      type,
      lockedPlayerId: player.id,
    })
    setShowTransaction(true)
  }

  return (
    <div className="min-h-screen bg-slate-900 max-w-lg mx-auto px-4 py-6 pb-28">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors mb-4 cursor-pointer text-sm min-h-[44px]"
      >
        <BackIcon />
        Partidas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">{game.name}</h1>
          <p className="text-slate-500 text-sm font-mono mt-0.5">{game.chip_value}€/ficha</p>
        </div>
        <span
          className={`mt-1 flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isClosed
              ? 'bg-slate-700 text-slate-400 border border-slate-600'
              : 'bg-emerald-900/50 text-emerald-400 border border-emerald-800'
            }`}
        >
          {isClosed ? 'Cerrada' : 'Activa'}
        </span>
      </div>

      {/* Stats */}
      {players.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
            <p className="text-xs text-slate-500 mb-0.5">Jugadores</p>
            <p className="text-xl font-bold text-slate-100 font-mono">{players.length}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
            <p className="text-xs text-slate-500 mb-0.5">Pot total</p>
            <p className="text-xl font-bold text-slate-100 font-mono">{totalPot.toFixed(2)}€</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
            <p className="text-xs text-slate-500 mb-0.5">En mesa</p>
            <p
              className={`text-xl font-bold font-mono ${balanceInPlay > 0 ? 'text-emerald-400' : 'text-slate-400'
                }`}
            >
              {balanceInPlay.toFixed(2)}€
            </p>
          </div>
        </div>
      )}

      {/* Chip reconciliation warning */}
      {!isClosed && hasAnyActual && !isReconciled && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800/50 rounded-xl flex items-start gap-3">
          <span className="flex-shrink-0 mt-0.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01M12 3l9.66 16.5H2.34L12 3z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-red-300 text-sm font-medium">Fichas no cuadran</p>
            <p className="text-red-400/80 text-xs mt-0.5">
              Diferencia de <span className="font-mono font-bold">{chipDifference > 0 ? '+' : ''}{chipDifference}</span> fichas
              {playersNotReported > 0 && (
                <span> · {playersNotReported} jugador{playersNotReported > 1 ? 'es' : ''} sin reportar</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Players */}
      {players.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-700 rounded-xl mb-4">
          <p className="text-slate-500">Sin jugadores</p>
          <p className="text-slate-600 text-sm mt-1">Añade jugadores para empezar</p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isClosed={isClosed}
              chipValue={game.chip_value}
              onClick={() => setSelectedPlayer(player)}
            />
          ))}
        </div>
      )}

      {/* Actions (active game only) */}
      {!isClosed && (
        <>
          <button
            onClick={() => setShowAddPlayer(true)}
            className="w-full mb-3 py-3 border border-dashed border-slate-600 hover:border-emerald-600 text-slate-500 hover:text-emerald-400 rounded-xl text-sm font-medium transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
          >
            <UserIcon />
            Añadir jugador
          </button>

          {players.length > 0 && (
            <button
              onClick={() => {
                if (confirm('¿Cerrar la partida? Ya no se podrán añadir más movimientos.')) {
                  closeMutation.mutate()
                }
              }}
              disabled={closeMutation.isPending}
              className="w-full py-3 bg-slate-700 hover:bg-red-900/40 border border-slate-600 hover:border-red-800/50 text-slate-300 hover:text-red-400 rounded-xl font-medium transition-colors cursor-pointer min-h-[44px] text-sm disabled:opacity-50"
            >
              {closeMutation.isPending ? 'Cerrando...' : 'Cerrar partida'}
            </button>
          )}
        </>
      )}

      {/* Go to settlement if closed */}
      {isClosed && (
        <Link
          to={`/games/${id}/settlement`}
          className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors cursor-pointer min-h-[44px] text-center text-sm"
        >
          Ver liquidación
        </Link>
      )}

      {/* FAB — only for active game with players */}
      {!isClosed && players.length > 0 && (
        <button
          onClick={() => {
            setTransactionDefaults({})
            setShowTransaction(true)
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-full shadow-xl shadow-black/40 transition-all cursor-pointer flex items-center justify-center"
          aria-label="Registrar movimiento"
        >
          <PlusIcon />
        </button>
      )}

      {/* Modals */}
      {showTransaction && (
        <TransactionModal
          gameId={gameId}
          players={players}
          onClose={() => setShowTransaction(false)}
          defaultPlayerId={transactionDefaults.playerId}
          defaultType={transactionDefaults.type}
          defaultChips={transactionDefaults.chips}
          lockedPlayerId={transactionDefaults.lockedPlayerId ?? null}
        />
      )}
      {showAddPlayer && (
        <AddPlayerModal gameId={gameId} onClose={() => setShowAddPlayer(false)} />
      )}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          gameId={gameId}
          isClosed={isClosed}
          onClose={() => setSelectedPlayer(null)}
          onRegisterMovement={(player, type) => {
            setSelectedPlayer(null)
            openTransactionFor(player, type)
          }}
        />
      )}
    </div>
  )
}
