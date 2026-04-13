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
    <div
      className={cn(
        'flex flex-row items-center justify-between gap-2',
        className
      )}
    >
      <div className='min-w-0'>
        <h1 className='truncate text-xl leading-tight font-semibold'>
          {title}
        </h1>
        {subtitle ? (
          <div className='mt-0.5 text-xs text-muted-foreground'>{subtitle}</div>
        ) : null}
      </div>
      {right ? (
        <div className='flex shrink-0 items-center gap-2'>{right}</div>
      ) : null}
    </div>
  )
}
