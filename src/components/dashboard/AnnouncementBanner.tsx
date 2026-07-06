import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Megaphone, ChevronDown, ChevronUp, X } from 'lucide-react'

interface AnnouncementBannerProps {
  title: string
  message?: string | null
  className?: string
}

export function AnnouncementBanner({
  title,
  message,
  className,
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(false)

  if (dismissed) return null

  return (
    <div
      className={cn(
        'bg-[#1E3A5F] text-white border-b border-white/10 shadow-sm',
        className
      )}
    >
      <div className='flex items-center gap-3 px-4 py-2.5'>
        <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20'>
          <Megaphone className='size-3.5 text-amber-400' />
        </div>
        <div className='flex-1 min-w-0 text-sm font-semibold truncate'>
          {title}
        </div>
        <div className='flex items-center gap-1'>
          {message ? (
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7 text-white/70 hover:bg-white/10 hover:text-white'
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <ChevronUp className='size-4' />
              ) : (
                <ChevronDown className='size-4' />
              )}
            </Button>
          ) : null}
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 text-white/70 hover:bg-white/10 hover:text-white'
            onClick={() => setDismissed(true)}
          >
            <X className='size-4' />
          </Button>
        </div>
      </div>
      {message && expanded ? (
        <div className='px-4 pb-2.5 pl-12 text-xs text-blue-100 leading-relaxed'>
          {message}
        </div>
      ) : null}
    </div>
  )
}
