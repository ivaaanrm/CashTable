export default function PlayerCard({ player, isClosed, onClick, chipValue }) {
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
      className="bg-slate-800 rounded-xl p-4 border border-slate-700 cursor-pointer hover:border-slate-500 transition-colors active:scale-[0.99]"
    >
      <div className="flex justify-between items-center gap-4">
        {/* Left: name + stats */}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-100 truncate">{player.name}</h3>
          <p className="text-slate-400 text-sm mt-0.5">
            <span className="font-mono">{currentChips}</span> fichas
            <span className="text-emerald-400/80 ml-1 text-xs font-mono">({virtualMoney.toFixed(2)}€)</span>
            <span className="text-slate-600 mx-1.5">·</span>
            inv. <span className="font-mono">{player.money_spent.toFixed(2)}€</span>
          </p>
        </div>

        {/* Right: balance + % */}
        <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
          <span
            className={`font-mono text-xl font-bold ${isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-slate-400'
              }`}
          >
            {isPositive ? '+' : ''}{balance.toFixed(2)}€
          </span>
          {pct !== null && (
            <span
              className={`text-xs font-mono ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-600'
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
