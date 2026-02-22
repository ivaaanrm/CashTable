import { formatChips } from '../utils/format'

export default function PlayerCard({ player, isClosed, onClick, chipValue, bigBlindValue }) {
  const balance = player.net_balance
  const isPositive = balance > 0.01
  const isNegative = balance < -0.01
  const pct = player.money_spent > 0.001
    ? ((balance / player.money_spent) * 100).toFixed(0)
    : null

  const currentChips = player.actual_chips != null ? player.actual_chips : player.chips_in_play
  const virtualMoney = currentChips * chipValue

  return (
    <div
      onClick={onClick}
      className="bg-poker-dark/80 backdrop-blur-md rounded-2xl p-4 border-2 border-poker-light/20 cursor-pointer hover:border-gold-500/50 hover:shadow-lg hover:shadow-gold-900/10 hover:-translate-y-0.5 transition-all active:scale-95 relative overflow-hidden"
    >
      {/* Decorative inner glow for the table seat effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      <div className="flex justify-between items-center gap-4 relative z-10">
        {/* Left: name + stats */}
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-lg text-slate-100 truncate tracking-wide">{player.name}</h3>
          <p className="text-emerald-100/60 text-sm mt-1 flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 border border-gray-600 shadow-[inset_0_1px_rgba(255,255,255,0.4)]" />
            <span className="font-mono font-medium text-slate-200">{formatChips(currentChips)}</span>
            <span className="text-emerald-400/80 text-xs font-mono">({virtualMoney.toFixed(2)}€)</span>
            {bigBlindValue > 0 && (
              <span className="text-gold-400/70 text-xs font-mono">{(currentChips / bigBlindValue).toFixed(1)} BB</span>
            )}
            <span className="text-poker-light mx-1">·</span>
            inv. <span className="font-mono text-slate-300">{player.money_spent.toFixed(2)}€</span>
          </p>
        </div>

        {/* Right: balance + % */}
        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
          <span
            className={`font-mono text-2xl font-black drop-shadow-md tracking-tight ${isPositive ? 'text-emerald-400' : isNegative ? 'text-chip-red' : 'text-slate-400'
              }`}
          >
            {isPositive ? '+' : ''}{balance.toFixed(2)}€
          </span>
          {pct !== null && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${isPositive ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50' : isNegative ? 'bg-red-900/40 text-red-400 border border-red-800/50' : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
            >
              {isPositive ? '+' : ''}{pct}%
            </span>
          )}
        </div>
      </div>

    </div>
  )
}
