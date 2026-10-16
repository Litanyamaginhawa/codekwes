import type { ComponentType } from 'react'
import { TYPE_COLOR, TYPE_LABEL, type BlockType } from '../lib/catalog'
import { withAlpha } from '../lib/color'
import { IconAward, IconBook, IconFlask, IconHelp, IconRefresh, IconStar, IconTool } from './icons'

const TYPE_ICON: Record<BlockType, ComponentType<{ size?: number; className?: string }>> = {
  lesson: IconBook,
  workshop: IconTool,
  lab: IconFlask,
  review: IconRefresh,
  quiz: IconHelp,
  exam: IconAward,
  project: IconStar,
}

interface TypeBadgeProps {
  type: BlockType
  size?: 'sm' | 'md'
}

export default function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  const color = TYPE_COLOR[type]
  const Icon = TYPE_ICON[type]
  const iconSize = size === 'sm' ? 12 : 14

  return (
    <span
      className={
        'inline-flex items-center gap-1.5 rounded-full border font-semibold ' +
        (size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-xs')
      }
      style={{
        color,
        backgroundColor: withAlpha(color, 0.12),
        borderColor: withAlpha(color, 0.35),
      }}
    >
      <Icon size={iconSize} />
      {TYPE_LABEL[type]}
    </span>
  )
}
