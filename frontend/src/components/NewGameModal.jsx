import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGame } from '../api/games'

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function NewGameModal({ onClose }) {
  const [name, setName] = useState('')
  const [chipValue, setChipValue] = useState('1')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
      onClose()
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    mutation.mutate({ name: name.trim(), chip_value: parseFloat(chipValue) })
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">Nueva partida</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-700"
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="game-name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Nombre de la partida
            </label>
            <input
              id="game-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Viernes noche"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="chip-value" className="block text-sm font-medium text-slate-300 mb-1.5">
              Valor por ficha (€)
            </label>
            <input
              id="chip-value"
              type="number"
              value={chipValue}
              onChange={(e) => setChipValue(e.target.value)}
              min="0.01"
              step="0.01"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
            />
          </div>

          {mutation.isError && (
            <p className="text-red-400 text-sm" role="alert">
              {mutation.error.message}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-colors cursor-pointer min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !name.trim()}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors cursor-pointer min-h-[44px]"
            >
              {mutation.isPending ? 'Creando...' : 'Crear partida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
