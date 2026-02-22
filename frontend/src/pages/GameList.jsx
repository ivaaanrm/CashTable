import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getGames, deleteGame } from '../api/games'
import { clearToken } from '../api/auth'
import NewGameModal from '../components/NewGameModal'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function CardIcon() {
  return (
    <svg className="w-14 h-14 mx-auto text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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

function LogoutIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

export default function GameList() {
  const [showNewGame, setShowNewGame] = useState(false)
  const [gameToDelete, setGameToDelete] = useState(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  const { data: games = [], isLoading, isError } = useQuery({
    queryKey: ['games'],
    queryFn: getGames,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
      setGameToDelete(null)
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Cargando...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">Error al conectar con el servidor</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">CashTable</h1>
          <p className="text-slate-500 text-sm">
            {games.length === 0
              ? 'Sin partidas'
              : `${games.length} partida${games.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewGame(true)}
            className="bg-gradient-to-b from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 text-poker-dark px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer min-h-[44px] flex items-center gap-2 text-sm shadow-md"
          >
            <PlusIcon />
            Nueva
          </button>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar sesión"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {games.length === 0 ? (
        <div className="text-center py-20 bg-black/20 backdrop-blur-sm border-2 border-dashed border-poker-light/40 rounded-2xl">
          <CardIcon className="mx-auto opacity-50 text-poker-light" />
          <p className="text-emerald-200/50 text-lg uppercase tracking-widest font-bold mt-4">Sin partidas</p>
          <p className="text-emerald-200/40 text-sm mt-2">Crea tu primera partida para empezar</p>
          <button
            onClick={() => setShowNewGame(true)}
            className="mt-6 bg-gradient-to-b from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 text-poker-dark px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer min-h-[44px] inline-flex items-center gap-2 shadow-lg"
          >
            <PlusIcon />
            Nueva partida
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-poker-dark/80 backdrop-blur-md rounded-2xl border-2 border-poker-light/20 overflow-hidden hover:border-gold-500/50 hover:shadow-lg hover:shadow-gold-900/10 hover:-translate-y-0.5 transition-all relative"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <Link
                to={game.status === 'closed' ? `/games/${game.id}/settlement` : `/games/${game.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer relative z-10"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-base text-slate-100 truncate tracking-wide flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-gold-500 rounded-sm inline-block" />
                      {game.name}
                    </h2>
                    <span
                      className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider shadow-sm ${game.status === 'active'
                          ? 'bg-poker-light/80 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                        }`}
                    >
                      {game.status === 'active' ? 'Activa' : 'Cerrada'}
                    </span>
                  </div>
                  <p className="text-emerald-100/60 text-xs flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-medium text-slate-200">{Math.round(1 / game.chip_value)}</span> fichas/€
                    <span className="mx-0.5 text-poker-light">·</span>
                    {formatDate(game.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setGameToDelete(game) }}
                    className="text-slate-600 hover:text-chip-red transition-colors cursor-pointer p-2 rounded-lg hover:bg-black/20 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Borrar partida"
                  >
                    <TrashIcon />
                  </button>
                  <div className="text-slate-600">
                    <ChevronRightIcon />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {showNewGame && <NewGameModal onClose={() => setShowNewGame(false)} />}

      {/* Custom Deletion Modal */}
      {gameToDelete && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setGameToDelete(null)}
        >
          <div className="bg-poker-dark/95 backdrop-blur-xl rounded-2xl w-full max-w-sm border border-chip-red/30 shadow-2xl shadow-black animate-slide-up p-6 text-center">
            <div className="w-12 h-12 bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-chip-red/20 shadow-inner">
              <TrashIcon className="w-6 h-6 text-chip-red" />
            </div>
            <h2 className="text-xl font-bold tracking-wide text-slate-100 mb-2">Borrar Partida</h2>
            <p className="text-emerald-100/70 text-sm mb-6">
              ¿Estás seguro de que deseas borrar la partida <span className="text-white font-semibold">"{gameToDelete.name}"</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setGameToDelete(null)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold uppercase tracking-wider transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(gameToDelete.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-3 bg-gradient-to-b from-chip-red to-red-800 hover:from-red-500 hover:to-chip-red disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider transition-colors min-h-[44px] shadow-md shadow-red-900/30"
              >
                {deleteMutation.isPending ? 'Borrando...' : 'Borrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
