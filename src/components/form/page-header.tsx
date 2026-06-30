import type * as React from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  subtitle,
  right,
  showBack = false,
  className,
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
  showBack?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-row items-center justify-between gap-2 rounded-xl bg-primary px-4 py-3.5 text-primary-foreground',
        className
      )}
    >
      <div className='flex min-w-0 items-center gap-3'>
        {showBack && (
          <button
            onClick={() => window.history.back()}
            className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-black/40 transition-colors hover:bg-black/50'
          >
            <ChevronLeft className='size-5 text-primary-foreground' />
          </button>
        )}
        <div className='min-w-0'>
          <h1 className='truncate text-xl leading-tight font-bold text-primary-foreground'>
            {title}
          </h1>
          {subtitle ? (
            <div className='mt-0.5 text-sm text-primary-foreground/80'>
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
      {right ? (
        <div className='flex shrink-0 items-center gap-2 [&_button]:!border-primary-foreground/30 [&_button]:!bg-white/10 [&_button]:!text-primary-foreground [&_button:hover]:!bg-white/20 [&_.border]:!border-primary-foreground/30 [&_.text-foreground]:!text-primary-foreground [&_.text-muted-foreground]:!text-primary-foreground/70'>
          {right}
        </div>
      ) : null}
    </div>
  )
}
