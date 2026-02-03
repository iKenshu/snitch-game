interface SnitchProps {
  myProgress: number
  opponentProgress: number
}

export default function Snitch({ myProgress, opponentProgress }: SnitchProps) {
  const maxProgress = Math.max(myProgress, opponentProgress)
  const isHighTension = maxProgress >= 8

  return (
    <div className={`snitch-container ${isHighTension ? 'high-tension' : ''}`}>
      <div className={`snitch-glow-bg ${isHighTension ? 'high-tension' : ''}`} />
      <div className="snitch">
        <img
          src="/snitch.gif"
          alt="Golden Snitch"
          className="snitch-gif"
          draggable={false}
        />
      </div>
    </div>
  )
}

interface HandsProps {
  myProgress: number
  opponentProgress: number
  isPlayer1: boolean
  isMyTurn: boolean
}

export function Hands({ myProgress, opponentProgress, isPlayer1, isMyTurn }: HandsProps) {
  const leftHandProgress = isPlayer1 ? myProgress : opponentProgress
  const rightHandProgress = isPlayer1 ? opponentProgress : myProgress
  const isLeftHandMine = isPlayer1
  const isRightHandMine = !isPlayer1

  const baseOffsetPercent = 30
  const progressAdjust = 2.5

  const leftFinalOffset = baseOffsetPercent - leftHandProgress * progressAdjust
  const rightFinalOffset = baseOffsetPercent - rightHandProgress * progressAdjust

  const leftHandStyle = {
    transform: `translateY(-50%) translateX(-${leftFinalOffset}%)`,
  }
  const rightHandStyle = {
    transform: `translateY(-50%) translateX(${rightFinalOffset}%)`,
  }

  return (
    <>
      <div
        className={`hand hand-left ${isLeftHandMine && isMyTurn ? 'my-turn' : ''}`}
        style={leftHandStyle}
      >
        <img
          src="/izquierda.png"
          alt={isLeftHandMine ? "My hand" : "Opponent hand"}
          draggable={false}
        />
      </div>
      <div
        className={`hand hand-right ${isRightHandMine && isMyTurn ? 'my-turn' : ''}`}
        style={rightHandStyle}
      >
        <img
          src="/derecha.png"
          alt={isRightHandMine ? "My hand" : "Opponent hand"}
          draggable={false}
        />
      </div>
    </>
  )
}
