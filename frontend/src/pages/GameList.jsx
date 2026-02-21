import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getGames, deleteGame } from '../api/games'
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

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

export default function GameList() {
  const [showNewGame, setShowNewGame] = useState(false)
  const queryClient = useQueryClient()

  const { data: games = [], isLoading, isError } = useQuery({
    queryKey: ['games'],
    queryFn: getGames,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteGame,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['games'] }),
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
    <div className="min-h-screen bg-slate-900 max-w-lg mx-auto px-4 py-6">
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
        <button
          onClick={() => setShowNewGame(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-medium transition-colors cursor-pointer min-h-[44px] flex items-center gap-2 text-sm"
        >
          <PlusIcon />
          Nueva
        </button>
      </div>

      {/* Empty state */}
      {games.length === 0 ? (
        <div className="text-center py-20">
          <CardIcon />
          <p className="text-slate-500 text-lg mt-4">Sin partidas todavía</p>
          <p className="text-slate-600 text-sm mt-1">Crea tu primera partida para empezar</p>
          <button
            onClick={() => setShowNewGame(true)}
            className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium transition-colors cursor-pointer min-h-[44px] inline-flex items-center gap-2"
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
              className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
            >
              <Link
                to={game.status === 'closed' ? `/games/${game.id}/settlement` : `/games/${game.id}`}
                className="flex items-center gap-3 p-4 hover:bg-slate-750 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-slate-100 truncate">{game.name}</h2>
                    <span
                      className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        game.status === 'active'
                          ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-700 text-slate-400 border border-slate-600'
                      }`}
                    >
                      {game.status === 'active' ? 'Activa' : 'Cerrada'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {formatDate(game.created_at)}
                    <span className="mx-1.5 text-slate-700">·</span>
                    <span className="font-mono">{game.chip_value}€</span>/ficha
                  </p>
                </div>
                <ChevronRightIcon />
              </Link>

              <div className="px-4 pb-3 flex justify-end border-t border-slate-700/50">
                <button
                  onClick={() => {
                    if (confirm(`¿Borrar "${game.name}"? Esta acción no se puede deshacer.`)) {
                      deleteMutation.mutate(game.id)
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="text-slate-600 hover:text-red-400 transition-colors cursor-pointer text-xs min-h-[44px] px-2 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <TrashIcon />
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewGame && <NewGameModal onClose={() => setShowNewGame(false)} />}
    </div>
  )
}
