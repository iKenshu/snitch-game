import { GameState } from '../types/game'
import GameFrame from './GameFrame'
import QuaffleRow from './QuaffleRow'
import Snitch, { Hands } from './Snitch'

const GAME_PARTICLES = [
  { position: 'absolute' as const, top: '5%', left: '10%', animationDelay: '0s' },
  { position: 'absolute' as const, top: '15%', right: '15%', animationDelay: '0.7s' },
  { position: 'absolute' as const, bottom: '25%', left: '5%', animationDelay: '1.2s' },
  { position: 'absolute' as const, bottom: '10%', right: '10%', animationDelay: '0.3s' },
] as const

interface SpectatorViewProps {
  gameState: GameState | null
  roomId: string
  spectatorCount: number
  onLeave: () => void
}

export default function SpectatorView({
  gameState,
  roomId,
  spectatorCount,
  onLeave,
}: SpectatorViewProps) {
  // Waiting for game to start
  if (!gameState || gameState.status === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-gradient-to-b from-amber-900/90 via-amber-800/90 to-amber-900/90 border-2 border-purple-600 rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.3)] p-8 pt-6 w-full max-w-md text-center backdrop-blur-sm">
          <div className="flex justify-center mb-4">
            <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
              Spectator Mode
            </span>
          </div>

          <h2 className="text-2xl font-magic font-semibold text-yellow-300 mb-4 tracking-wide drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            Waiting for players...
          </h2>

          <div className="bg-amber-950/50 border border-yellow-700/50 rounded-xl p-6 mb-4">
            <p className="text-amber-300/80 mb-2">Room Code:</p>
            <p className="text-4xl font-mono font-bold text-yellow-400 tracking-widest drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]">
              {roomId}
            </p>
          </div>

          <p className="text-purple-300 text-sm mb-6">
            {spectatorCount} spectator{spectatorCount !== 1 ? 's' : ''} watching
          </p>

          <button
            onClick={onLeave}
            className="bg-gradient-to-b from-purple-700 to-purple-800 hover:from-purple-600 hover:to-purple-700 border border-purple-500 text-purple-200 font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            Stop Watching
          </button>
        </div>
      </div>
    )
  }

  // Game finished
  if (gameState.status === 'finished') {
    const winner = gameState.players.find(p => p.id === gameState.winner)

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-gradient-to-b from-amber-900/90 via-amber-800/90 to-amber-900/90 border-2 border-purple-600 rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.3)] p-8 pt-6 w-full max-w-md text-center backdrop-blur-sm">
          <div className="flex justify-center mb-4">
            <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
              Spectator Mode
            </span>
          </div>

          <img
            src="/snitch.gif"
            alt="Snitch"
            className="w-24 h-24 mx-auto mb-4"
            draggable={false}
          />

          <h2 className="text-3xl font-magic font-semibold text-yellow-300 mb-2 tracking-wide drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            Game Over!
          </h2>
          <p className="text-amber-300 mb-6">
            {winner?.name || 'Someone'} wins!
          </p>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {gameState.players.map((player) => (
              <div key={player.id} className="text-center">
                <p className="text-amber-300/80 font-magic text-sm mb-1">{player.name}</p>
                <p className="text-3xl font-magic font-bold text-red-400 drop-shadow-[0_0_10px_rgba(255,0,0,0.6)]">
                  {player.redQuaffles}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={onLeave}
            className="bg-gradient-to-b from-purple-700 to-purple-800 hover:from-purple-600 hover:to-purple-700 border border-purple-500 text-purple-200 font-bold py-3 px-6 rounded-xl transition-all"
          >
            Leave
          </button>
        </div>
      </div>
    )
  }

  // Active game - spectator view
  const currentTurnPlayer = gameState.players.find(
    (p) => p.id === gameState.currentTurnPlayerId
  )

  return (
    <main className="w-full max-w-6xl relative px-4 mx-auto">
      {GAME_PARTICLES.map((style, i) => (
        <div key={i} className="ambient-particle" style={style} />
      ))}

      {/* Spectator badge */}
      <div className="fixed top-4 right-4 z-50">
        <span className="bg-purple-600/90 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm shadow-lg flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Spectating ({spectatorCount})
        </span>
      </div>

      <div className="turn-indicator text-center mb-6 py-3 rounded-xl bg-amber-900/50 border border-amber-700/50">
        <p className="font-magic font-semibold text-lg tracking-wide text-amber-400">
          {currentTurnPlayer
            ? `${currentTurnPlayer.name}'s turn`
            : 'Waiting...'}
        </p>
      </div>

      <div className="flex justify-between items-center mb-8 px-8">
        <div className="text-center">
          <p className="text-yellow-300 font-magic font-semibold text-2xl mb-2 tracking-wide drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            {gameState.players[0]?.name || 'Player 1'}
          </p>
          <p className="text-red-400 font-magic font-bold text-6xl drop-shadow-[0_0_15px_rgba(255,0,0,0.6)]">
            {gameState.players[0]?.redQuaffles || 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-yellow-300 font-magic font-semibold text-2xl mb-2 tracking-wide drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            {gameState.players[1]?.name || 'Player 2'}
          </p>
          <p className="text-red-400 font-magic font-bold text-6xl drop-shadow-[0_0_15px_rgba(255,0,0,0.6)]">
            {gameState.players[1]?.redQuaffles || 0}
          </p>
        </div>
      </div>

      <div className="game-area">
        <GameFrame>
          <Hands
            myProgress={gameState.players[0]?.redQuaffles || 0}
            opponentProgress={gameState.players[1]?.redQuaffles || 0}
            isPlayer1={true}
            isMyTurn={false}
          />
          <Snitch
            myProgress={gameState.players[0]?.redQuaffles || 0}
            opponentProgress={gameState.players[1]?.redQuaffles || 0}
          />
        </GameFrame>
      </div>

      <section className="bg-gradient-to-b from-amber-900/80 to-amber-950/80 border border-yellow-700/50 rounded-2xl mb-4 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <QuaffleRow
          quaffles={gameState.sharedQuaffleRow}
          hoveredIndex={null}
          onQuaffleClick={() => {}}
          onHoverChange={() => {}}
          isInteractive={false}
        />
      </section>

      <div className="text-center mt-4 mb-8">
        <button
          onClick={onLeave}
          className="text-purple-400 hover:text-purple-300 underline transition-colors"
        >
          Stop Watching
        </button>
      </div>
    </main>
  )
}
