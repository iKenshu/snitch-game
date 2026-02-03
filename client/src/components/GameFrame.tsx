interface GameFrameProps {
  children: React.ReactNode
}

export default function GameFrame({ children }: GameFrameProps) {
  return (
    <div className="game-frame">
      <div className="game-frame-content">
        {children}
      </div>
    </div>
  )
}
