import type React from 'react'
import { cn } from '@/lib/utils'
import mainLogo from '@/assets/main-logo.png'

export function Logo({ className, alt, ...props }: React.ComponentProps<'img'>) {
  return (
    <img
      src={mainLogo}
      alt={alt ?? 'IPMS'}
      className={cn('size-16 object-contain', className)}
      {...props}
    />
  )
}
