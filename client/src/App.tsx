import { useState, useEffect } from 'react'
import { GameState, RoomCheckResponse } from './types/game'
import { useGameSocket } from './hooks/useGameSocket'
import Lobby from './components/Lobby'
import Game from './components/Game'
import SpectatorView from './components/SpectatorView'
import JoinFromUrl from './components/JoinFromUrl'
import StadiumLights from './components/StadiumLights'

function App() {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'player' | 'spectator' | null>(null)
  const [spectatorCount, setSpectatorCount] = useState(0)
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null)
  const [roomCheckResult, setRoomCheckResult] = useState<RoomCheckResponse | null>(null)

  const { createRoom, joinRoom, joinAsSpectator, checkRoom, takeQuaffles, leaveRoom, isConnected } = useGameSocket({
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
    onSpectatorJoined: (_name, count) => {
      setSpectatorCount(count)
    },
    onSpectatorLeft: (_name, count) => {
      setSpectatorCount(count)
    },
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roomCode = params.get('room')

    if (roomCode && isConnected) {
      const code = roomCode.toUpperCase()
      setPendingRoomCode(code)
      checkRoom(code).then((result) => {
        setRoomCheckResult(result)
      })
    }
  }, [isConnected, checkRoom])

  const updateUrl = (code: string | null) => {
    const url = new URL(window.location.href)
    if (code) {
      url.searchParams.set('room', code)
    } else {
      url.searchParams.delete('room')
    }
    window.history.pushState({}, '', url.toString())
  }

  const handleCreateRoom = async (name: string) => {
    setError(null)
    const response = await createRoom(name)
    if (response.success && response.roomId && response.playerId) {
      setRoomId(response.roomId)
      setPlayerId(response.playerId)
      setUserRole('player')
      updateUrl(response.roomId)
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
      setUserRole('player')
      updateUrl(code.toUpperCase())
      if (response.gameState) {
        setGameState(response.gameState)
      }
    } else {
      setError(response.error || 'Failed to join room')
    }
  }

  const handleUrlJoin = async (name: string) => {
    if (!pendingRoomCode || !roomCheckResult) return

    setError(null)

    if (roomCheckResult.canJoinAsPlayer) {
      // Can join as player
      const response = await joinRoom(pendingRoomCode, name)
      if (response.success && response.playerId) {
        setRoomId(pendingRoomCode)
        setPlayerId(response.playerId)
        setUserRole('player')
        setPendingRoomCode(null)
        setRoomCheckResult(null)
        if (response.gameState) {
          setGameState(response.gameState)
        }
      } else {
        setError(response.error || 'Failed to join room')
      }
    } else if (roomCheckResult.canJoinAsSpectator) {
      // Join as spectator
      const response = await joinAsSpectator(pendingRoomCode, name)
      if (response.success) {
        setRoomId(pendingRoomCode)
        setUserRole('spectator')
        setSpectatorCount(response.spectatorCount || 1)
        setPendingRoomCode(null)
        setRoomCheckResult(null)
        if (response.gameState) {
          setGameState(response.gameState)
        }
      } else {
        setError(response.error || 'Failed to join as spectator')
      }
    }
  }

  const handleCancelUrlJoin = () => {
    setPendingRoomCode(null)
    setRoomCheckResult(null)
    updateUrl(null)
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
    setUserRole(null)
    setSpectatorCount(0)
    updateUrl(null)
  }

  const handlePlayAgain = () => {
    setGameOverMessage(null)
    setGameState(null)
    setRoomId(null)
    setPlayerId(null)
    setUserRole(null)
    updateUrl(null)
  }

  // Show URL join screen if there's a pending room code
  if (pendingRoomCode && roomCheckResult) {
    return (
      <>
        <StadiumLights />
        <JoinFromUrl
          roomCode={pendingRoomCode}
          roomInfo={roomCheckResult}
          onJoin={handleUrlJoin}
          onCancel={handleCancelUrlJoin}
          error={error}
        />
      </>
    )
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

  // Spectator view
  if (userRole === 'spectator') {
    return (
      <>
        <StadiumLights />
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
          <SpectatorView
            gameState={gameState}
            roomId={roomId}
            spectatorCount={spectatorCount}
            onLeave={handleLeaveGame}
          />
        </div>
      </>
    )
  }

  // Player view
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
          spectatorCount={spectatorCount}
        />
      </div>
    </>
  )
}

export default App
