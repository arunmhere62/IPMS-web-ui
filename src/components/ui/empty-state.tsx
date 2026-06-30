import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: LucideIcon
  emoji?: string
  title: string
  description: string
  className?: string
  children?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={cn('px-6 py-20 text-center', className)}>
      {emoji ? (
        <div className='mb-3 text-4xl'>{emoji}</div>
      ) : Icon ? (
        <div className='mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-primary/10'>
          <Icon className='size-8 text-primary' />
        </div>
      ) : null}
      <div className='text-base font-bold text-foreground'>{title}</div>
      <div className='mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground'>
        {description}
      </div>
      {children && <div className='mt-4'>{children}</div>}
    </div>
  )
}
