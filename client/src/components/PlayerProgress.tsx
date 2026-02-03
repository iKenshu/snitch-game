interface PlayerProgressProps {
  name: string
  redQuaffles: number
  target: number
  isCurrentPlayer?: boolean
}

export default function PlayerProgress({
  name,
  redQuaffles,
  target,
  isCurrentPlayer = false,
}: PlayerProgressProps) {
  const percentage = Math.min((redQuaffles / target) * 100, 100)

  return (
    <div className={`bg-slate-700 rounded-xl p-4 ${isCurrentPlayer ? 'ring-2 ring-yellow-400/50' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`font-semibold truncate ${isCurrentPlayer ? 'text-yellow-400' : 'text-slate-300'}`}>
          {name}
        </span>
        <span className="text-red-400 font-bold">
          {redQuaffles}/{target}
        </span>
      </div>
      <div className="h-3 bg-slate-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
