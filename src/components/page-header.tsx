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
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className='min-w-0'>
        <h1 className='truncate text-xl font-semibold leading-tight'>{title}</h1>
        {subtitle ? (
          <div className='mt-0.5 text-xs text-muted-foreground'>{subtitle}</div>
        ) : null}
      </div>
      {right ? <div className='flex shrink-0 items-center gap-2'>{right}</div> : null}
    </div>
  )
}
