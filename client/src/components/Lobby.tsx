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
    <div className="bg-gradient-to-b from-amber-900/90 via-amber-800/90 to-amber-900/90 border-2 border-yellow-600/50 rounded-2xl shadow-[0_0_40px_rgba(255,215,0,0.2)] p-8 w-full max-w-md backdrop-blur-sm">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-magic font-bold text-yellow-400 mb-2 tracking-wider drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
          Snitch Capture
        </h1>
        <p className="text-amber-300/70">A magical quaffle game</p>
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
            className="w-full bg-gradient-to-b from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:from-amber-900 disabled:to-amber-950 disabled:cursor-not-allowed text-amber-950 font-magic font-semibold py-4 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:shadow-[0_0_25px_rgba(255,215,0,0.5)]"
          >
            Create Game
          </button>
          <button
            onClick={() => setMode('join')}
            onMouseEnter={preloadGameAssets}
            onFocus={preloadGameAssets}
            disabled={!isConnected}
            className="w-full bg-gradient-to-b from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 disabled:from-amber-900 disabled:to-amber-950 disabled:cursor-not-allowed text-yellow-200 font-magic font-semibold py-4 px-6 rounded-xl transition-all border border-yellow-700/50"
          >
            Join Game
          </button>
        </div>
      )}

      {mode === 'create' && (
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-amber-300/80 mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-amber-950/50 border border-yellow-700/50 rounded-lg px-4 py-3 text-yellow-100 placeholder-amber-600/60 focus:outline-none focus:border-yellow-500"
              maxLength={20}
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode('select')}
              className="flex-1 bg-gradient-to-b from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-yellow-200 font-semibold py-3 px-4 rounded-xl transition-colors border border-yellow-700/50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 bg-gradient-to-b from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:from-amber-900 disabled:to-amber-950 disabled:text-amber-700 disabled:cursor-not-allowed text-amber-950 font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {mode === 'join' && (
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-amber-300/80 mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-amber-950/50 border border-yellow-700/50 rounded-lg px-4 py-3 text-yellow-100 placeholder-amber-600/60 focus:outline-none focus:border-yellow-500"
              maxLength={20}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-amber-300/80 mb-2">Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="XXXX"
              className="w-full bg-amber-950/50 border border-yellow-700/50 rounded-lg px-4 py-3 text-yellow-400 placeholder-amber-600/60 focus:outline-none focus:border-yellow-500 uppercase text-center tracking-widest text-xl font-mono"
              maxLength={4}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode('select')}
              className="flex-1 bg-gradient-to-b from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-yellow-200 font-semibold py-3 px-4 rounded-xl transition-colors border border-yellow-700/50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !roomCode.trim()}
              className="flex-1 bg-gradient-to-b from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:from-amber-900 disabled:to-amber-950 disabled:text-amber-700 disabled:cursor-not-allowed text-amber-950 font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Join
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-yellow-700/30">
        <h3 className="text-amber-400 font-magic font-semibold mb-3">How to Play:</h3>
        <ul className="text-amber-300/60 text-sm space-y-2">
          <li>• Take 1-3 quaffles from your first 3 each turn</li>
          <li>• Red quaffles = +1 point</li>
          <li>• Gray quaffles = 0 points</li>
          <li>• First to 10 red quaffles wins!</li>
        </ul>
      </div>
    </div>
  )
}
