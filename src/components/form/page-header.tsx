import type * as React from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function PageHeader({
  title,
  subtitle,
  right,
  showBack = true,
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
        'flex flex-row items-center justify-between gap-2',
        className
      )}
    >
      <div className='flex min-w-0 items-center gap-2'>
        {showBack && (
          <Button
            variant='outline'
            size='icon'
            onClick={() => window.history.back()}
            className='h-8 w-8 shrink-0'
          >
            <ChevronLeft className='size-4' />
          </Button>
        )}
        <div className='min-w-0'>
          <h1 className='truncate text-xl leading-tight font-semibold'>
            {title}
          </h1>
          {subtitle ? (
            <div className='mt-0.5 text-xs text-muted-foreground'>
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
      {right ? (
        <div className='flex shrink-0 items-center gap-2'>{right}</div>
      ) : null}
    </div>
  )
}
