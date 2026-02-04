import { useEffect, useRef, useState, useCallback } from 'react'
import type { Socket } from 'socket.io-client'
import {
  ClientToServerEvents,
  ServerToClientEvents,
  GameState,
  RoomResponse,
  JoinResponse,
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
  onError: (message: string) => void
  onSpectatorJoined?: (spectatorName: string, spectatorCount: number) => void
  onSpectatorLeft?: (spectatorName: string, spectatorCount: number) => void
}

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function useGameSocket(options: UseGameSocketOptions) {
  const socketRef = useRef<GameSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
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
      }) as GameSocket

      socketRef.current = socket

      socket.on('connect', () => {
        console.log('Connected to server')
        setIsConnected(true)
      })

      socket.on('disconnect', () => {
        console.log('Disconnected from server')
        setIsConnected(false)
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

  return {
    createRoom,
    joinRoom,
    takeQuaffles,
    leaveRoom,
    checkRoom,
    joinAsSpectator,
    isConnected,
  }
}
