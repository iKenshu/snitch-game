import { Player, QUAFFLES_TO_WIN } from '../types/game'

interface PlayerHandProps {
  player: Player
  isCurrentPlayer: boolean
  isActive: boolean
}

export default function PlayerHand({ player, isCurrentPlayer, isActive }: PlayerHandProps) {
  const redQuaffles = player.redQuaffles
  const displayQuaffles = Math.min(redQuaffles, QUAFFLES_TO_WIN)

  return (
    <div
      className={`
        relative animate-float
        bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900
        border-2 border-yellow-600
        rounded-xl p-4 min-w-[140px]
        shadow-[0_0_20px_rgba(255,215,0,0.3)]
        ${isActive ? 'ring-2 ring-yellow-400 shadow-[0_0_30px_rgba(255,215,0,0.5)]' : ''}
        ${isCurrentPlayer ? 'border-yellow-400' : ''}
      `}
    >
      {/* Decorative corner - top left */}
      <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-yellow-500 rounded-tl"></div>
      {/* Decorative corner - top right */}
      <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-yellow-500 rounded-tr"></div>
      {/* Decorative corner - bottom left */}
      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-yellow-500 rounded-bl"></div>
      {/* Decorative corner - bottom right */}
      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-yellow-500 rounded-br"></div>

      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-semibold truncate ${isCurrentPlayer ? 'text-yellow-300' : 'text-amber-200'}`}>
          {player.name}
          {isCurrentPlayer && ' (You)'}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
        {Array.from({ length: displayQuaffles }).map((_, i) => (
          <img
            key={i}
            src="/quaffle.png"
            alt="Quaffle"
            className="w-5 h-5 object-contain drop-shadow-[0_0_4px_rgba(255,0,0,0.8)]"
          />
        ))}
      </div>

      <div className="text-amber-300/80 text-sm">
        <span className="text-red-400 font-bold drop-shadow-[0_0_4px_rgba(255,0,0,0.5)]">{redQuaffles}</span>
        <span>/{QUAFFLES_TO_WIN}</span>
      </div>

      {isActive && (
        <div className="mt-2 text-xs text-yellow-300 font-semibold animate-glow-pulse">
          Active Turn
        </div>
      )}
    </div>
  )
}
