import { useState, useCallback, useRef } from 'react'

interface LobbyProps {
  onCreateRoom: (name: string) => void
  onJoinRoom: (code: string, name: string) => void
  error: string | null
  isConnected: boolean
}

const GAME_ASSETS = ['/snitch.gif', '/izquierda.png', '/derecha.png', '/quaffle.png']

export default function Lobby({ onCreateRoom, onJoinRoom, error, isConnected }: LobbyProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const assetsPreloaded = useRef(false)

  const preloadGameAssets = useCallback(() => {
    if (assetsPreloaded.current) return
    assetsPreloaded.current = true

    GAME_ASSETS.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreateRoom(name.trim())
    }
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && roomCode.trim()) {
      onJoinRoom(roomCode.trim(), name.trim())
    }
  }

  return (
    <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">
          Snitch Capture
        </h1>
        <p className="text-slate-400">A magical quaffle game</p>
      </div>

      {!isConnected && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-300 text-center">Connecting to server...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-300 text-center">{error}</p>
        </div>
      )}

      {mode === 'select' && (
        <div className="space-y-4">
          <button
            onClick={() => setMode('create')}
            onMouseEnter={preloadGameAssets}
            onFocus={preloadGameAssets}
            disabled={!isConnected}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-bold py-4 px-6 rounded-xl transition-colors"
          >
            Create Game
          </button>
          <button
            onClick={() => setMode('join')}
            onMouseEnter={preloadGameAssets}
            onFocus={preloadGameAssets}
            disabled={!isConnected}
            className="w-full bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-colors"
          >
            Join Game
          </button>
        </div>
      )}

      {mode === 'create' && (
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-slate-300 mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-yellow-400"
              maxLength={20}
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode('select')}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {mode === 'join' && (
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-slate-300 mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-yellow-400"
              maxLength={20}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-2">Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="XXXX"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-yellow-400 uppercase text-center tracking-widest text-xl"
              maxLength={4}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode('select')}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !roomCode.trim()}
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Join
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-slate-700">
        <h3 className="text-slate-400 font-semibold mb-3">How to Play:</h3>
        <ul className="text-slate-500 text-sm space-y-2">
          <li>• Take 1-3 quaffles from your first 3 each turn</li>
          <li>• Red quaffles = +1 point</li>
          <li>• Gray quaffles = 0 points</li>
          <li>• First to 10 red quaffles wins!</li>
        </ul>
      </div>
    </div>
  )
}
