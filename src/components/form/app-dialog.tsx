import * as React from 'react'

import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type AppDialogSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeClass: Record<AppDialogSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
}

export type AppDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  size?: AppDialogSize
  contentClassName?: string
  headerClassName?: string
  bodyClassName?: string
  footer?: React.ReactNode
  children: React.ReactNode
}

export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  size = 'xl',
  contentClassName,
  headerClassName,
  bodyClassName,
  footer,
  children,
}: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          sizeClass[size],
          'flex max-h-[90vh] flex-col overflow-hidden',
          contentClassName
        )}
      >
        {title || description ? (
          <DialogHeader className={cn('px-3', headerClassName)}>
            {title ? <DialogTitle>{title}</DialogTitle> : null}
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
        ) : null}

        <div className={cn('grid p-3 flex-1 gap-4 overflow-auto', bodyClassName)}>{children}</div>

        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}
