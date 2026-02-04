import { useState } from 'react'
import { RoomCheckResponse } from '../types/game'

interface JoinFromUrlProps {
  roomCode: string
  roomInfo: RoomCheckResponse
  onJoin: (name: string) => void
  onCancel: () => void
  error: string | null
}

export default function JoinFromUrl({
  roomCode,
  roomInfo,
  onJoin,
  onCancel,
  error,
}: JoinFromUrlProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onJoin(name.trim())
    }
  }

  const getRoleMessage = () => {
    if (roomInfo.canJoinAsPlayer) {
      return '¡Puedes unirte como jugador!'
    }
    if (roomInfo.canJoinAsSpectator) {
      return 'El juego está lleno. Te unirás como espectador.'
    }
    return 'La sala está llena.'
  }

  const canJoin = roomInfo.canJoinAsPlayer || roomInfo.canJoinAsSpectator

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md border border-yellow-700/30">
        <h2 className="text-2xl font-serif font-bold text-yellow-400 mb-2 text-center">
          Unirse a Sala
        </h2>
        <p className="text-4xl font-mono font-bold text-yellow-300 tracking-widest text-center mb-6">
          {roomCode}
        </p>

        <div className="bg-amber-900/50 border border-amber-600/50 rounded-lg p-4 mb-6">
          <p className="text-amber-300 text-center">{getRoleMessage()}</p>
          <p className="text-slate-400 text-sm mt-2 text-center">
            Jugadores: {roomInfo.playerCount}/2 | Espectadores: {roomInfo.spectatorCount}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ingresa tu nombre"
            className="w-full bg-slate-700/80 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
            maxLength={20}
            autoFocus
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !canJoin}
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-bold py-3 px-4 rounded-xl transition-colors"
            >
              {roomInfo.canJoinAsPlayer ? 'Unirse al Juego' : 'Ver Partida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
