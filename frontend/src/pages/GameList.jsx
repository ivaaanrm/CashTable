import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getGames, deleteGame, joinGameByPin } from '../api/games'
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

function isSixDigitPin(pin) {
  return /^\d{6}$/.test(pin)
}

export default function GameList() {
  const [showNewGame, setShowNewGame] = useState(false)
  const [showJoinPin, setShowJoinPin] = useState(false)
  const [gameToDelete, setGameToDelete] = useState(null)
  const [pinInput, setPinInput] = useState('')
  const [showJoinName, setShowJoinName] = useState(false)
  const [joinName, setJoinName] = useState('')
  const [pendingJoinPin, setPendingJoinPin] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  useEffect(() => {
    if (showNewGame || showJoinPin || showJoinName || gameToDelete) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [showNewGame, showJoinPin, showJoinName, gameToDelete])

  const { data: games = [], isLoading, isError, error } = useQuery({
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

  const joinMutation = useMutation({
    mutationFn: joinGameByPin,
    onSuccess: (payload) => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
      setJoinName('')
      setPendingJoinPin('')
      setShowJoinName(false)
      setPinInput('')
      navigate(`/games/${payload.game.id}`)
    },
  })

  function startJoinFlow(e) {
    e.preventDefault()
    if (!isSixDigitPin(pinInput)) return
    setPendingJoinPin(pinInput)
    setShowJoinPin(false)
    setShowJoinName(true)
  }

  function submitJoin(e) {
    e.preventDefault()
    if (!joinName.trim() || !isSixDigitPin(pendingJoinPin)) return
    joinMutation.mutate({ pin: pendingJoinPin, player_name: joinName.trim() })
  }

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
        <p className="text-red-400">{error?.message ?? 'Error al conectar con el servidor'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center shadow-lg shadow-gold-500/20">
              <svg className="w-6 h-6 text-poker-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-300 tracking-tight">
              CashTable
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base font-medium flex items-center gap-2">
            {games.length === 0 ? (
              'Crea o únete a una mesa para comenzar'
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {games.length} mesa{games.length !== 1 ? 's' : ''} activa{games.length !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowJoinPin(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-poker-light/10 hover:bg-poker-light/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-emerald-500/10 backdrop-blur-sm"
          >
            Unirse
          </button>

          <button
            onClick={() => setShowNewGame(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-br from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 text-poker-dark font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5"
          >
            <PlusIcon />
            Nueva mesa
          </button>
        </div>
      </div>

      {/* Empty state */}
      {games.length === 0 ? (
        <div className="relative overflow-hidden group rounded-3xl bg-poker-dark/40 border border-white/5 backdrop-blur-xl p-12 text-center transition-all hover:bg-poker-dark/60 hover:border-white/10">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-20 h-20 mx-auto bg-black/30 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-inner">
            <CardIcon />
          </div>
          <h3 className="text-xl font-bold text-slate-200 mb-2">Ninguna mesa activa</h3>
          <p className="text-slate-400 max-w-sm mx-auto">
            Aún no estás participando en ninguna partida. Puedes crear una nueva mesa o unirte a una existente usando un PIN de 6 dígitos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {games.map((game) => (
            <div
              key={game.id}
              className="group relative bg-poker-dark/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-gold-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-gold-500/10 hover:-translate-y-1"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/0 via-gold-500/0 to-emerald-500/0 group-hover:via-gold-500/50 transition-all duration-500" />

              <Link
                to={game.status === 'closed' ? `/games/${game.id}/settlement` : `/games/${game.id}`}
                className="block p-5 sm:p-6 cursor-pointer relative z-10 h-full flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase backdrop-blur-sm ${game.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}
                    >
                      {game.status === 'active' ? 'En curso' : 'Finalizada'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm ${game.session_role === 'host'
                        ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                        : 'bg-white/5 text-slate-300 border border-white/10'
                        }`}
                    >
                      {game.session_role === 'host' ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      )}
                      {game.session_role === 'host' ? 'Host' : 'Jugador'}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-100 mb-1 line-clamp-1 group-hover:text-gold-400 transition-colors">
                    {game.name}
                  </h2>

                  <div className="flex items-center gap-3 text-sm text-slate-400 mb-6">
                    <span className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded text-emerald-300/80 font-mono text-xs border border-white/5">
                      <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {Math.round(1 / game.chip_value)} fichas/€
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                  <span className="text-xs text-slate-500 font-medium tracking-wide">
                    {formatDate(game.created_at)}
                  </span>
                  <div className="flex items-center gap-1">
                    {game.session_role === 'host' && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setGameToDelete(game) }}
                        className="text-slate-500 hover:text-chip-red hover:bg-chip-red/10 transition-colors p-2 rounded-lg"
                        aria-label="Borrar partida"
                      >
                        <TrashIcon />
                      </button>
                    )}
                    <div className="text-poker-light group-hover:text-gold-400 group-hover:translate-x-1 transition-all p-2">
                      <ChevronRightIcon />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {showNewGame && (
        <NewGameModal
          onClose={() => setShowNewGame(false)}
          onCreated={(game) => navigate(`/games/${game.id}`)}
        />
      )}

      {/* Join pin modal */}
      {showJoinPin && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowJoinPin(false)}
        >
          <div className="bg-poker-dark/95 backdrop-blur-xl rounded-3xl w-full max-w-sm border border-white/10 shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Unirse por PIN</h2>
            <p className="text-slate-400 text-sm mb-6">Introduce el código de 6 dígitos que te ha compartido el Host de la mesa.</p>
            <form onSubmit={startJoinFlow} className="space-y-6">
              <div>
                <input
                  type="text"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-emerald-400 font-mono text-3xl font-bold tracking-[0.3em] text-center focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 shadow-inner transition-all placeholder-white/5"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowJoinPin(false)}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isSixDigitPin(pinInput)}
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:bg-emerald-500/30 disabled:text-emerald-900/50 text-poker-dark rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/20 disabled:shadow-none"
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join name modal */}
      {showJoinName && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowJoinName(false)}
        >
          <div className="bg-poker-dark/95 backdrop-blur-xl rounded-3xl w-full max-w-sm border border-white/10 shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gold-500 to-gold-400" />

            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-1">Tu Nombre</h2>
                <p className="text-slate-400 text-sm">Identifícate en la mesa</p>
              </div>
              <div className="bg-black/30 border border-white/5 px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-400 font-bold tracking-widest shadow-inner">
                {pendingJoinPin}
              </div>
            </div>

            <form onSubmit={submitJoin} className="space-y-6">
              <div>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="Ej. Jugador 1"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-slate-100 text-lg placeholder-slate-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 shadow-inner transition-all"
                  autoFocus
                />
              </div>
              {joinMutation.isError && (
                <div className="bg-chip-red/10 border border-chip-red/20 rounded-xl p-3 flex items-start gap-2">
                  <svg className="w-5 h-5 text-chip-red shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-chip-red/90 text-sm mt-0.5">{joinMutation.error.message}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowJoinName(false)}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={joinMutation.isPending || !joinName.trim()}
                  className="flex-1 py-3.5 bg-gold-500 hover:bg-gold-400 active:bg-gold-600 disabled:opacity-50 text-poker-dark rounded-xl font-bold transition-all shadow-lg hover:shadow-gold-500/20 disabled:shadow-none flex items-center justify-center"
                >
                  {joinMutation.isPending ? (
                    <svg className="animate-spin h-5 w-5 text-poker-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    'Entrar a Mesa'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Deletion Modal */}
      {gameToDelete && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setGameToDelete(null)}
        >
          <div className="bg-poker-dark/95 backdrop-blur-xl rounded-3xl w-full max-w-sm border border-chip-red/20 shadow-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 to-chip-red" />
            <div className="w-16 h-16 bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-5 border border-chip-red/20 shadow-inner">
              <svg className="w-8 h-8 text-chip-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-3">Borrar Mesa</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              ¿Estás seguro de que deseas borrar la mesa <br />
              <span className="text-white font-semibold text-base block mt-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5 line-clamp-1">"{gameToDelete.name}"</span>
              <span className="block mt-4 text-chip-red/80 font-medium">Esta acción no se puede deshacer.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setGameToDelete(null)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold transition-colors"
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(gameToDelete.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-3 bg-chip-red hover:bg-red-500 active:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Borrando...
                  </>
                ) : (
                  'Borrar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
