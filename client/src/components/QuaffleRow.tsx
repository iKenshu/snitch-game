import React from 'react'
import { Quaffle, MAX_SELECTABLE } from '../types/game'

interface QuaffleButtonProps {
  quaffle: Quaffle
  index: number
  isHoverPreview: boolean
  isSelectable: boolean
  onClick: (index: number) => void
  onHover: (index: number) => void
  onHoverEnd: () => void
}

const QuaffleButton = React.memo(function QuaffleButton({
  quaffle,
  index,
  isHoverPreview,
  isSelectable,
  onClick,
  onHover,
  onHoverEnd,
}: QuaffleButtonProps) {
  return (
    <button
      onClick={() => onClick(index)}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={onHoverEnd}
      disabled={!isSelectable}
      className={`
        quaffle-btn
        w-10 h-10 rounded-full flex items-center justify-center
        transition-all duration-200
        ${isSelectable ? 'cursor-pointer' : 'cursor-default opacity-50'}
        ${isHoverPreview ? 'hover-preview' : ''}
        ${index < MAX_SELECTABLE ? 'shadow-lg shadow-black/50' : 'shadow-sm'}
      `}
      title={isSelectable ? `Take ${index + 1} quaffle${index > 0 ? 's' : ''}` : ''}
    >
      <img
        src="/quaffle.png"
        alt={`${quaffle.type} quaffle`}
        className={`
          quaffle-img w-9 h-9 object-contain transition-all duration-200
          ${quaffle.type === 'red' ? 'red' : 'gray grayscale brightness-75'}
        `}
      />
    </button>
  )
})

interface QuaffleRowProps {
  quaffles: Quaffle[]
  hoveredIndex: number | null
  onQuaffleClick: (index: number) => void
  onHoverChange: (index: number | null) => void
  isInteractive: boolean
}

export default function QuaffleRow({
  quaffles,
  hoveredIndex,
  onQuaffleClick,
  onHoverChange,
  isInteractive,
}: QuaffleRowProps) {
  return (
    <div className={`quaffle-row-container ${isInteractive ? 'interactive' : ''}`}>
      <div className="flex flex-nowrap gap-2 justify-center">
        {quaffles.map((quaffle, index) => {
          const isSelectable = index < MAX_SELECTABLE && isInteractive
          const isHoverPreview = hoveredIndex !== null && index <= hoveredIndex && isSelectable

          return (
            <QuaffleButton
              key={quaffle.id}
              quaffle={quaffle}
              index={index}
              isHoverPreview={isHoverPreview}
              isSelectable={isSelectable}
              onClick={onQuaffleClick}
              onHover={onHoverChange}
              onHoverEnd={() => onHoverChange(null)}
            />
          )
        })}
      </div>
    </div>
  )
}
