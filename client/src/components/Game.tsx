import { useState, useEffect, useRef } from 'react'
import { GameState, MAX_SELECTABLE } from '../types/game'
import GameFrame from './GameFrame'
import QuaffleRow from './QuaffleRow'
import Snitch, { Hands } from './Snitch'

const WAITING_PARTICLES = [
  { top: '10%', left: '15%', animationDelay: '0s' },
  { top: '20%', right: '20%', animationDelay: '0.5s' },
  { bottom: '30%', left: '25%', animationDelay: '1s' },
] as const

const GAME_PARTICLES = [
  { position: 'absolute' as const, top: '5%', left: '10%', animationDelay: '0s' },
  { position: 'absolute' as const, top: '15%', right: '15%', animationDelay: '0.7s' },
  { position: 'absolute' as const, bottom: '25%', left: '5%', animationDelay: '1.2s' },
  { position: 'absolute' as const, bottom: '10%', right: '10%', animationDelay: '0.3s' },
] as const

interface GameProps {
  gameState: GameState | null
  playerId: string | null
  roomId: string
  onTakeQuaffles: (indices: number[]) => void
  onLeaveGame: () => void
  gameOverMessage: string | null
  onPlayAgain: () => void
  error: string | null
  spectatorCount?: number
}

export default function Game({
  gameState,
  playerId,
  roomId,
  onTakeQuaffles,
  onLeaveGame,
  gameOverMessage,
  onPlayAgain,
  error,
  spectatorCount = 0,
}: GameProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}?room=${roomId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [turnFlash, setTurnFlash] = useState(false)
  const prevTurnRef = useRef<string | null>(null)

  useEffect(() => {
    if (gameState?.currentTurnPlayerId && gameState.currentTurnPlayerId !== prevTurnRef.current) {
      if (prevTurnRef.current !== null) {
        setTurnFlash(true)
        setTimeout(() => setTurnFlash(false), 600)
      }
      prevTurnRef.current = gameState.currentTurnPlayerId
    }
  }, [gameState?.currentTurnPlayerId])

  if (!gameState || gameState.status === 'waiting') {
    return (
      <div className="relative bg-gradient-to-b from-amber-900/90 via-amber-800/90 to-amber-900/90 border-2 border-yellow-600 rounded-2xl shadow-[0_0_40px_rgba(255,215,0,0.3)] p-8 w-full max-w-md text-center backdrop-blur-sm">
        {WAITING_PARTICLES.map((style, i) => (
          <div key={i} className="ambient-particle" style={style} />
        ))}

        <h2 className="text-2xl font-serif font-bold text-yellow-300 mb-4 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
          Waiting for opponent...
        </h2>
        <div className="bg-amber-950/50 border border-yellow-700/50 rounded-xl p-6 mb-4">
          <p className="text-amber-300/80 mb-2">Share this code:</p>
          <p className="text-4xl font-mono font-bold text-yellow-400 tracking-widest drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]">
            {roomId}
          </p>
          <button
            onClick={handleCopyShareLink}
            className="mt-4 bg-amber-700 hover:bg-amber-600 text-yellow-200 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Share Link'}
          </button>
        </div>

        {spectatorCount > 0 && (
          <p className="text-purple-400 text-sm mb-4">
            {spectatorCount} spectator{spectatorCount !== 1 ? 's' : ''} watching
          </p>
        )}

        <button
          onClick={onLeaveGame}
          className="bg-gradient-to-b from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 border border-yellow-600 text-yellow-200 font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:shadow-[0_0_20px_rgba(255,215,0,0.4)]"
        >
          Leave Room
        </button>
      </div>
    )
  }

  if (gameOverMessage) {
    const currentPlayer = gameState.players.find(p => p.id === playerId)
    const opponent = gameState.players.find(p => p.id !== playerId)
    const didWin = gameState.winner === playerId

    return (
      <div className="victory-overlay">
        <div className="victory-burst" />
        <div className={`victory-card ${didWin ? '' : 'defeat-card'}`}>
          <img
            src="/snitch.gif"
            alt="Snitch"
            className="victory-snitch"
            draggable={false}
          />
          <h2 className={`victory-title ${didWin ? '' : 'defeat-title'}`}>
            {didWin ? 'VICTORY!' : 'DEFEAT'}
          </h2>
          <p className="victory-subtitle">{gameOverMessage}</p>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <p className="text-amber-300/80 text-sm mb-1">{currentPlayer?.name || 'You'}</p>
              <p className="text-3xl font-bold text-red-400 drop-shadow-[0_0_10px_rgba(255,0,0,0.6)]">
                {currentPlayer?.redQuaffles || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-amber-300/80 text-sm mb-1">{opponent?.name || 'Opponent'}</p>
              <p className="text-3xl font-bold text-red-400 drop-shadow-[0_0_10px_rgba(255,0,0,0.6)]">
                {opponent?.redQuaffles || 0}
              </p>
            </div>
          </div>

          <button onClick={onPlayAgain} className="victory-button">
            Play Again
          </button>
        </div>
      </div>
    )
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId)
  const opponent = gameState.players.find(p => p.id !== playerId)
  const isMyTurn = gameState.currentTurnPlayerId === playerId

  const handleQuaffleClick = (index: number) => {
    if (!isMyTurn || index >= MAX_SELECTABLE) return
    onTakeQuaffles(Array.from({ length: index + 1 }, (_, i) => i))
  }

  const handleHoverChange = (index: number | null) => {
    setHoveredIndex(index)
  }

  return (
    <main className="w-full max-w-6xl relative px-4">
      {GAME_PARTICLES.map((style, i) => (
        <div key={i} className="ambient-particle" style={style} />
      ))}

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4 backdrop-blur-sm">
          <p className="text-red-300 text-center text-sm">{error}</p>
        </div>
      )}

      <div className={`turn-indicator text-center mb-6 py-3 rounded-xl transition-all ${
        turnFlash ? 'flash' : ''
      } ${
        isMyTurn
          ? 'my-turn bg-gradient-to-r from-yellow-600/30 via-yellow-500/40 to-yellow-600/30 border border-yellow-500 shadow-[0_0_20px_rgba(255,215,0,0.3)]'
          : 'bg-amber-900/50 border border-amber-700/50'
      }`}>
        <p className={`font-serif font-bold relative z-10 ${isMyTurn ? 'text-yellow-300' : 'text-amber-400'}`}>
          {isMyTurn ? 'Your turn!' : `${opponent?.name}'s turn...`}
        </p>
      </div>

      <div className="flex justify-between items-center mb-8 px-8">
        <div className="text-center">
          <p className="text-yellow-300 font-serif font-bold text-2xl mb-2 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            {gameState.players[0]?.name || 'Player 1'}
          </p>
          <p className="text-red-400 font-bold text-6xl drop-shadow-[0_0_15px_rgba(255,0,0,0.6)]">
            {gameState.players[0]?.redQuaffles || 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-yellow-300 font-serif font-bold text-2xl mb-2 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            {gameState.players[1]?.name || 'Player 2'}
          </p>
          <p className="text-red-400 font-bold text-6xl drop-shadow-[0_0_15px_rgba(255,0,0,0.6)]">
            {gameState.players[1]?.redQuaffles || 0}
          </p>
        </div>
      </div>

      <div className="game-area">
        <GameFrame>
          <Hands
            myProgress={currentPlayer?.redQuaffles || 0}
            opponentProgress={opponent?.redQuaffles || 0}
            isPlayer1={gameState.players[0]?.id === playerId}
            isMyTurn={isMyTurn}
          />
          <Snitch
            myProgress={currentPlayer?.redQuaffles || 0}
            opponentProgress={opponent?.redQuaffles || 0}
          />
        </GameFrame>
      </div>

      <section className="bg-gradient-to-b from-amber-900/80 to-amber-950/80 border border-yellow-700/50 rounded-2xl mb-4 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <QuaffleRow
          quaffles={gameState.sharedQuaffleRow}
          hoveredIndex={hoveredIndex}
          onQuaffleClick={handleQuaffleClick}
          onHoverChange={handleHoverChange}
          isInteractive={isMyTurn}
        />
      </section>
    </main>
  )
}
