import { useEffect, useRef, useState, useCallback } from 'react'
import type { Socket } from 'socket.io-client'
import {
  ClientToServerEvents,
  ServerToClientEvents,
  GameState,
  RoomResponse,
  JoinResponse,
  ReconnectResponse,
  RoomCheckResponse,
  SpectatorJoinResponse,
} from '../types/game'

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>

const loadSocketIO = async () => {
  const { io } = await import('socket.io-client')
  return io
}

interface UseGameSocketOptions {
  onGameState: (state: GameState) => void
  onGameStart: (state: GameState) => void
  onGameUpdate: (state: GameState) => void
  onGameOver: (winnerId: string, winnerName: string) => void
  onPlayerLeft: (playerName: string) => void
  onPlayerDisconnected?: (playerName: string) => void
  onPlayerReconnected?: (playerName: string) => void
  onError: (message: string) => void
  onSpectatorJoined?: (spectatorName: string, spectatorCount: number) => void
  onSpectatorLeft?: (spectatorName: string, spectatorCount: number) => void
}

const SESSION_STORAGE_KEY = 'snitch_game_session'

export interface GameSession {
  roomId: string
  playerId: string
  sessionToken: string
  playerName: string
}

export function saveGameSession(session: GameSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function getGameSession(): GameSession | null {
  const stored = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function clearGameSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function useGameSocket(options: UseGameSocketOptions) {
  const socketRef = useRef<GameSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    let socket: GameSocket | null = null
    let mounted = true

    const initSocket = async () => {
      const io = await loadSocketIO()

      if (!mounted) return

      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      }) as GameSocket

      socketRef.current = socket

      socket.on('connect', () => {
        console.log('Connected to server')
        setIsConnected(true)
        setIsReconnecting(false)
      })

      socket.on('disconnect', () => {
        console.log('Disconnected from server')
        setIsConnected(false)
        if (getGameSession()) {
          setIsReconnecting(true)
        }
      })

      socket.on('player_disconnected', (playerName) => {
        optionsRef.current.onPlayerDisconnected?.(playerName)
      })

      socket.on('player_reconnected', (playerName) => {
        optionsRef.current.onPlayerReconnected?.(playerName)
      })

      socket.on('game_state', (state) => {
        optionsRef.current.onGameState(state)
      })

      socket.on('game_start', (state) => {
        optionsRef.current.onGameStart(state)
      })

      socket.on('game_update', (state) => {
        optionsRef.current.onGameUpdate(state)
      })

      socket.on('game_over', (winnerId, winnerName) => {
        optionsRef.current.onGameOver(winnerId, winnerName)
      })

      socket.on('player_left', (playerName) => {
        optionsRef.current.onPlayerLeft(playerName)
      })

      socket.on('error', (message) => {
        optionsRef.current.onError(message)
      })

      socket.on('spectator_joined', (spectatorName, spectatorCount) => {
        optionsRef.current.onSpectatorJoined?.(spectatorName, spectatorCount)
      })

      socket.on('spectator_left', (spectatorName, spectatorCount) => {
        optionsRef.current.onSpectatorLeft?.(spectatorName, spectatorCount)
      })
    }

    initSocket()

    return () => {
      mounted = false
      socket?.disconnect()
    }
  }, [])

  const createRoom = useCallback((playerName: string): Promise<RoomResponse> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Not connected' })
        return
      }
      socketRef.current.emit('create_room', playerName, resolve)
    })
  }, [])

  const joinRoom = useCallback((roomId: string, playerName: string): Promise<JoinResponse> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Not connected' })
        return
      }
      socketRef.current.emit('join_room', roomId, playerName, resolve)
    })
  }, [])

  const takeQuaffles = useCallback((indices: number[]) => {
    if (socketRef.current) {
      socketRef.current.emit('take_quaffles', indices)
    }
  }, [])

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave_room')
    }
  }, [])

  const checkRoom = useCallback((roomId: string): Promise<RoomCheckResponse> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({
          exists: false,
          canJoinAsPlayer: false,
          canJoinAsSpectator: false,
          playerCount: 0,
          spectatorCount: 0,
          gameStatus: null,
        })
        return
      }
      socketRef.current.emit('check_room', roomId, resolve)
    })
  }, [])

  const joinAsSpectator = useCallback((roomId: string, spectatorName: string): Promise<SpectatorJoinResponse> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Not connected' })
        return
      }
      socketRef.current.emit('join_as_spectator', roomId, spectatorName, resolve)
    })
  }, [])

  const reconnectGame = useCallback((roomId: string, playerId: string, sessionToken: string): Promise<ReconnectResponse> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Not connected' })
        return
      }
      socketRef.current.emit('reconnect_game', roomId, playerId, sessionToken, resolve)
    })
  }, [])

  const attemptReconnect = useCallback(async (): Promise<{ success: boolean; session?: GameSession }> => {
    const session = getGameSession()
    if (!session) {
      return { success: false }
    }

    if (!socketRef.current?.connected) {
      return { success: false }
    }

    console.log('Attempting to reconnect to game...', session.roomId)
    setIsReconnecting(true)

    const response = await reconnectGame(session.roomId, session.playerId, session.sessionToken)

    if (response.success && response.gameState) {
      console.log('Reconnected successfully!')
      setIsReconnecting(false)
      return { success: true, session }
    } else {
      console.log('Reconnection failed:', response.error)
      clearGameSession()
      setIsReconnecting(false)
      return { success: false }
    }
  }, [reconnectGame])

  return {
    createRoom,
    joinRoom,
    takeQuaffles,
    leaveRoom,
    checkRoom,
    joinAsSpectator,
    reconnectGame,
    attemptReconnect,
    isConnected,
    isReconnecting,
  }
}
