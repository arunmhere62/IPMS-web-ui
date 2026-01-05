import type * as React from 'react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className='min-w-0'>
        <h1 className='text-2xl font-bold leading-tight'>{title}</h1>
        {subtitle ? (
          <div className='mt-1 text-sm text-muted-foreground'>{subtitle}</div>
        ) : null}
      </div>
      {right ? <div className='flex shrink-0 items-center gap-2'>{right}</div> : null}
    </div>
  )
}
