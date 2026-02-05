export default function ReconnectingOverlay() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 rounded-2xl p-8 border border-emerald-500/30 shadow-[0_0_50px_rgba(15,46,26,0.5)] text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto border-4 border-emerald-500/30 border-t-yellow-400 rounded-full animate-spin"></div>
        </div>
        <h2 className="font-magic text-2xl text-yellow-300 mb-2">
          Reconectando...
        </h2>
        <p className="text-emerald-300/70 text-sm">
          Recuperando tu partida
        </p>
      </div>
    </div>
  )
}
