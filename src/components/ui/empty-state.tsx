import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  className?: string
  children?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={cn('px-4 py-10 text-center', className)}>
      {Icon && (
        <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10'>
          <Icon className='size-6 text-primary' />
        </div>
      )}
      <div className='mt-3 text-sm font-semibold'>{title}</div>
      <div className='mt-1 text-xs text-muted-foreground'>{description}</div>
      {children && <div className='mt-4'>{children}</div>}
    </div>
  )
}
