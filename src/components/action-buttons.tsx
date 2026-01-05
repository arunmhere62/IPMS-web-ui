import { Link } from 'react-router-dom'
import { Eye, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ActionButtonsVariant = 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost'
export type ActionButtonsSize = 'icon' | 'sm' | 'default'

export type ActionButtonsMode = 'icon' | 'compact' | 'full'

export type ActionButtonsProps = {
  mode?: ActionButtonsMode
  className?: string

  viewTo?: string
  onView?: () => void

  onEdit?: () => void
  onDelete?: () => void

  disabled?: boolean
  editDisabled?: boolean
  deleteDisabled?: boolean

  viewLabel?: string
  editLabel?: string
  deleteLabel?: string

  viewVariant?: ActionButtonsVariant
  editVariant?: ActionButtonsVariant
  deleteVariant?: ActionButtonsVariant

  size?: ActionButtonsSize
}

export function ActionButtons({
  mode = 'icon',
  className,
  viewTo,
  onView,
  onEdit,
  onDelete,
  disabled,
  editDisabled,
  deleteDisabled,
  viewLabel = 'View',
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  viewVariant = 'secondary',
  editVariant = 'secondary',
  deleteVariant = 'outline',
  size,
}: ActionButtonsProps) {
  const effectiveSize: ActionButtonsSize = size ?? (mode === 'icon' ? 'icon' : mode === 'compact' ? 'sm' : 'default')

  const showText = mode !== 'icon'

  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
      {viewTo || onView ? (
        <Button
          type='button'
          size={effectiveSize}
          variant={viewVariant as any}
          className={cn(
            mode === 'icon' ? 'h-8 w-8 rounded-md' : undefined,
            viewVariant === 'secondary' ? 'hover:bg-primary/10 hover:text-primary' : undefined
          )}
          aria-label={viewLabel}
          title={viewLabel}
          disabled={disabled}
          onClick={onView}
          asChild={Boolean(viewTo)}
        >
          {viewTo ? (
            <Link to={viewTo}>
              <Eye className={cn('size-4', showText ? 'me-2' : '')} />
              {showText ? viewLabel : null}
            </Link>
          ) : (
            <>
              <Eye className={cn('size-4', showText ? 'me-2' : '')} />
              {showText ? viewLabel : null}
            </>
          )}
        </Button>
      ) : null}

      {onEdit ? (
        <Button
          type='button'
          size={effectiveSize}
          variant={editVariant as any}
          className={cn(
            mode === 'icon' ? 'h-8 w-8 rounded-md' : undefined,
            editVariant === 'secondary' ? 'hover:bg-primary/10 hover:text-primary' : undefined
          )}
          aria-label={editLabel}
          title={editLabel}
          disabled={disabled || editDisabled}
          onClick={onEdit}
        >
          <Pencil className={cn('size-4', showText ? 'me-2' : '')} />
          {showText ? editLabel : null}
        </Button>
      ) : null}

      {onDelete ? (
        <Button
          type='button'
          size={effectiveSize}
          variant={deleteVariant as any}
          className={cn(
            mode === 'icon' ? 'h-8 w-8 rounded-md' : undefined,
            'border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive'
          )}
          aria-label={deleteLabel}
          title={deleteLabel}
          disabled={disabled || deleteDisabled}
          onClick={onDelete}
        >
          <Trash2 className={cn('size-4', showText ? 'me-2' : '')} />
          {showText ? deleteLabel : null}
        </Button>
      ) : null}
    </div>
  )
}
