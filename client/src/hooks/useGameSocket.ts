import { useEffect, useRef, useState, useCallback } from 'react'
import type { Socket } from 'socket.io-client'
import {
  ClientToServerEvents,
  ServerToClientEvents,
  GameState,
  RoomResponse,
  JoinResponse,
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
}

const SOCKET_URL = import.meta.env.PROD
  ? window.location.origin
  : 'http://localhost:3001'

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

  return {
    createRoom,
    joinRoom,
    takeQuaffles,
    leaveRoom,
    isConnected,
  }
}
