import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getGame, getSettlement } from '../api/games'

function BackIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function Settlement() {
  const { id } = useParams()
  const gameId = parseInt(id)

  const { data: game } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => getGame(id),
  })

  const { data: settlement, isLoading, isError } = useQuery({
    queryKey: ['settlement', gameId],
    queryFn: () => getSettlement(id),
  })

  function copyForWhatsApp() {
    if (!settlement || !game) return

    const lines = [`🃏 ${game.name} — Resultado final`, '']

    if (settlement.transfers.length === 0) {
      lines.push('¡Todos en tablas! No hay transferencias.')
    } else {
      settlement.transfers.forEach((t) => {
        lines.push(`${t.from_player} paga ${t.amount.toFixed(0)}€ a ${t.to_player}`)
      })
    }

    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => alert('¡Copiado al portapapeles!'))
      .catch(() => alert('No se pudo copiar. Copia el texto manualmente.'))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Calculando liquidación...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-red-400 mb-2">No se puede calcular la liquidación</p>
          <p className="text-slate-500 text-sm mb-4">La partida debe estar cerrada</p>
          <Link to={`/games/${id}`} className="text-emerald-400 text-sm underline">
            Volver a la partida
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent max-w-lg mx-auto px-4 py-6">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors mb-4 cursor-pointer text-sm min-h-[44px]"
      >
        <BackIcon />
        Partidas
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gold-500 rounded-sm inline-block" />
          {game?.name}
        </h1>
        <p className="text-emerald-100/60 font-medium uppercase tracking-widest text-xs mt-1">Resultado final</p>
      </div>

      {/* Player summary */}
      <div className="bg-poker-dark/60 backdrop-blur-md rounded-2xl border-2 border-poker-light/20 mb-6 overflow-hidden shadow-lg">
        <div className="px-4 py-3 border-b border-poker-light/20 bg-black/10">
          <h2 className="font-bold text-slate-200 text-sm uppercase tracking-wider">
            Resumen de Jugadores
          </h2>
        </div>
        <div className="divide-y divide-poker-light/20">
          {settlement?.player_summary.map((p) => {
            const isPositive = p.profit_loss > 0.01
            const isNegative = p.profit_loss < -0.01
            return (
              <div key={p.name} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div className="min-w-0">
                  <p className="font-bold text-lg text-slate-100 truncate tracking-wide">{p.name}</p>
                  <p className="text-emerald-100/50 text-xs font-mono mt-0.5">
                    Inv. {p.money_spent.toFixed(2)}€ → <span className="text-slate-300 font-medium">{p.final_value.toFixed(2)}€</span>
                  </p>
                </div>
                <span
                  className={`font-mono font-black text-xl drop-shadow-md flex-shrink-0 ${isPositive
                      ? 'text-emerald-400'
                      : isNegative
                        ? 'text-chip-red'
                        : 'text-slate-400'
                    }`}
                >
                  {isPositive ? '+' : ''}
                  {p.profit_loss.toFixed(2)}€
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Transfers */}
      <div className="bg-poker-dark/60 backdrop-blur-md rounded-2xl border-2 border-poker-light/20 mb-6 overflow-hidden shadow-lg">
        <div className="px-4 py-3 border-b border-poker-light/20 bg-black/10">
          <h2 className="font-bold text-slate-200 text-sm uppercase tracking-wider">
            Transferencias
          </h2>
        </div>
        {settlement?.transfers.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-slate-300 font-bold tracking-wide">¡Todos en tablas!</p>
            <p className="text-emerald-100/50 text-sm mt-1">No hay transferencias pendientes</p>
          </div>
        ) : (
          <div className="divide-y divide-poker-light/20">
            {settlement?.transfers.map((t, i) => (
              <div key={i} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:bg-white/5 transition-colors">
                <div className="flex-1 flex items-center justify-between sm:justify-start gap-4 min-w-0 bg-black/20 p-3 rounded-xl border border-white/5 shadow-inner">
                  <span className="font-bold text-chip-red truncate text-lg">{t.from_player}</span>
                  <ArrowRightIcon className="text-gold-500 opacity-80" />
                  <span className="font-bold text-emerald-400 truncate text-lg">{t.to_player}</span>
                </div>
                <div className="flex items-center sm:justify-end">
                  <span className="font-mono font-black text-gold-400 text-2xl drop-shadow-md sm:text-right">
                    {t.amount.toFixed(2)}€
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Copy for WhatsApp */}
      <button
        onClick={copyForWhatsApp}
        className="w-full py-4 bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 active:scale-95 text-white rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-900/30"
      >
        <WhatsAppIcon />
        Copiar para WhatsApp
      </button>
    </div>
  )
}
