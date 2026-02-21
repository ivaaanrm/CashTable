export default function PlayerCard({ player }) {
  const balance = player.net_balance
  const isPositive = balance > 0.01
  const isNegative = balance < -0.01

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex justify-between items-center gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-100 truncate">{player.name}</h3>
          <p className="text-slate-400 text-sm mt-0.5">
            <span className="font-mono">{player.chips_in_play}</span> fichas
            <span className="text-slate-600 mx-1.5">·</span>
            inv. <span className="font-mono">{player.money_spent.toFixed(2)}€</span>
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span
            className={`font-mono text-xl font-bold ${
              isPositive
                ? 'text-emerald-400'
                : isNegative
                ? 'text-red-400'
                : 'text-slate-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {balance.toFixed(2)}€
          </span>
        </div>
      </div>
    </div>
  )
}
