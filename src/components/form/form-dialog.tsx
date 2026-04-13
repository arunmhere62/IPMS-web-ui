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

export type FormDialogSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const sizeClass: Record<FormDialogSize, string> = {
  sm: 'w-[90vw] max-w-sm',
  md: 'w-[95vw] max-w-md',
  lg: 'w-[95vw] max-w-lg',
  xl: 'w-[95vw] max-w-xl',
  '2xl': 'w-[95vw] max-w-2xl',
}

export type FormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  size?: FormDialogSize
  contentClassName?: string
  headerClassName?: string
  bodyClassName?: string
  footerClassName?: string
  footer?: React.ReactNode
  children: React.ReactNode
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  size = 'lg',
  contentClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
  footer,
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          sizeClass[size],
          'mx-auto flex max-h-[90vh] flex-col overflow-hidden',
          contentClassName
        )}
      >
        {title || description ? (
          <DialogHeader className={cn('px-3 sm:px-6', headerClassName)}>
            {title ? (
              <DialogTitle className='text-left'>{title}</DialogTitle>
            ) : null}
            {description ? (
              <DialogDescription className='text-left'>
                {description}
              </DialogDescription>
            ) : null}
          </DialogHeader>
        ) : null}

        <div
          className={cn(
            'flex-1 overflow-auto px-2 sm:px-3 md:px-6',
            bodyClassName
          )}
        >
          <div className='grid gap-3 py-2 sm:gap-4'>{children}</div>
        </div>

        {footer ? (
          <DialogFooter
            className={cn('px-3 py-3 sm:px-6 sm:py-4', footerClassName)}
          >
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
