import { useState } from 'react'
import { GameState } from './types/game'
import { useGameSocket } from './hooks/useGameSocket'
import Lobby from './components/Lobby'
import Game from './components/Game'
import StadiumLights from './components/StadiumLights'

function App() {
    const [playerId, setPlayerId] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null)

  const { createRoom, joinRoom, takeQuaffles, leaveRoom, isConnected } = useGameSocket({
    onGameState: (state) => setGameState(state),
    onGameStart: (state) => {
      setGameState(state)
      setError(null)
    },
    onGameUpdate: (state) => setGameState(state),
    onGameOver: (_winnerId, winnerName) => {
      setGameOverMessage(`${winnerName} wins!`)
    },
    onPlayerLeft: (name) => {
      setGameOverMessage(`${name} left the game`)
    },
    onError: (message) => setError(message),
  })

  const handleCreateRoom = async (name: string) => {
    setError(null)
    const response = await createRoom(name)
    if (response.success && response.roomId && response.playerId) {
      setRoomId(response.roomId)
      setPlayerId(response.playerId)
    } else {
      setError(response.error || 'Failed to create room')
    }
  }

  const handleJoinRoom = async (code: string, name: string) => {
    setError(null)
    const response = await joinRoom(code, name)
    if (response.success && response.playerId) {
      setRoomId(code.toUpperCase())
      setPlayerId(response.playerId)
      if (response.gameState) {
        setGameState(response.gameState)
      }
    } else {
      setError(response.error || 'Failed to join room')
    }
  }

  const handleTakeQuaffles = (indices: number[]) => {
    takeQuaffles(indices)
  }

  const handleLeaveGame = () => {
    leaveRoom()
    setRoomId(null)
    setPlayerId(null)
    setGameState(null)
    setGameOverMessage(null)
    setError(null)
  }

  const handlePlayAgain = () => {
    setGameOverMessage(null)
    setGameState(null)
    setRoomId(null)
    setPlayerId(null)
  }

  if (!roomId) {
    return (
      <>
        <StadiumLights />
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <Lobby
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            error={error}
            isConnected={isConnected}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <StadiumLights />
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        <Game
          gameState={gameState}
          playerId={playerId}
          roomId={roomId}
          onTakeQuaffles={handleTakeQuaffles}
          onLeaveGame={handleLeaveGame}
          gameOverMessage={gameOverMessage}
          onPlayAgain={handlePlayAgain}
          error={error}
        />
      </div>
    </>
  )
}

export default App
