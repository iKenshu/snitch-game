import { useState, useEffect } from 'react'
import { GameState, RoomCheckResponse } from './types/game'
import { useGameSocket, saveGameSession, clearGameSession, getGameSession } from './hooks/useGameSocket'
import Lobby from './components/Lobby'
import Game from './components/Game'
import SpectatorView from './components/SpectatorView'
import JoinFromUrl from './components/JoinFromUrl'
import StadiumLights from './components/StadiumLights'
import ReconnectingOverlay from './components/ReconnectingOverlay'

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
  const [opponentDisconnected, setOpponentDisconnected] = useState(false)
  const [reconnectAttempted, setReconnectAttempted] = useState(false)

  const { createRoom, joinRoom, joinAsSpectator, checkRoom, takeQuaffles, leaveRoom, attemptReconnect, isConnected, isReconnecting } = useGameSocket({
    onGameState: (state) => setGameState(state),
    onGameStart: (state) => {
      setGameState(state)
      setError(null)
    },
    onGameUpdate: (state) => setGameState(state),
    onGameOver: (_winnerId, winnerName) => {
      setGameOverMessage(`${winnerName} wins!`)
      clearGameSession()
    },
    onPlayerLeft: (name) => {
      setGameOverMessage(`${name} left the game`)
      clearGameSession()
      setOpponentDisconnected(false)
    },
    onPlayerDisconnected: (name) => {
      setOpponentDisconnected(true)
      setError(`${name} se desconectó. Esperando reconexión...`)
    },
    onPlayerReconnected: (name) => {
      setOpponentDisconnected(false)
      setError(null)
      console.log(`${name} reconnected!`)
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
    if (isConnected && !reconnectAttempted) {
      setReconnectAttempted(true)
      const session = getGameSession()
      if (session) {
        console.log('Found saved session, attempting reconnect...')
        attemptReconnect().then((result) => {
          if (result.success && result.session) {
            setRoomId(result.session.roomId)
            setPlayerId(result.session.playerId)
            setUserRole('player')
            updateUrl(result.session.roomId)
          }
        })
      }
    }
  }, [isConnected, reconnectAttempted, attemptReconnect])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roomCode = params.get('room')

    const session = getGameSession()
    if (roomCode && isConnected && !session) {
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
    if (response.success && response.roomId && response.playerId && response.sessionToken) {
      setRoomId(response.roomId)
      setPlayerId(response.playerId)
      setUserRole('player')
      updateUrl(response.roomId)

      saveGameSession({
        roomId: response.roomId,
        playerId: response.playerId,
        sessionToken: response.sessionToken,
        playerName: name,
      })
    } else {
      setError(response.error || 'Failed to create room')
    }
  }

  const handleJoinRoom = async (code: string, name: string) => {
    setError(null)
    const response = await joinRoom(code, name)
    if (response.success && response.playerId && response.sessionToken) {
      setRoomId(code.toUpperCase())
      setPlayerId(response.playerId)
      setUserRole('player')
      updateUrl(code.toUpperCase())

      saveGameSession({
        roomId: code.toUpperCase(),
        playerId: response.playerId,
        sessionToken: response.sessionToken,
        playerName: name,
      })
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

      const response = await joinRoom(pendingRoomCode, name)
      if (response.success && response.playerId && response.sessionToken) {
        setRoomId(pendingRoomCode)
        setPlayerId(response.playerId)
        setUserRole('player')
        setPendingRoomCode(null)
        setRoomCheckResult(null)

        saveGameSession({
          roomId: pendingRoomCode,
          playerId: response.playerId,
          sessionToken: response.sessionToken,
          playerName: name,
        })
        if (response.gameState) {
          setGameState(response.gameState)
        }
      } else {
        setError(response.error || 'Failed to join room')
      }
    } else if (roomCheckResult.canJoinAsSpectator) {

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
    clearGameSession()
    setRoomId(null)
    setPlayerId(null)
    setGameState(null)
    setGameOverMessage(null)
    setError(null)
    setUserRole(null)
    setSpectatorCount(0)
    setOpponentDisconnected(false)
    updateUrl(null)
  }

  const handlePlayAgain = () => {
    clearGameSession()
    setGameOverMessage(null)
    setGameState(null)
    setRoomId(null)
    setPlayerId(null)
    setUserRole(null)
    setOpponentDisconnected(false)
    updateUrl(null)
  }

  if (isReconnecting) {
    return (
      <>
        <StadiumLights />
        <ReconnectingOverlay />
      </>
    )
  }

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
          opponentDisconnected={opponentDisconnected}
        />
      </div>
    </>
  )
}

export default App
