import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type ActionButtonsVariant =
  | 'default'
  | 'outline'
  | 'destructive'
  | 'secondary'
  | 'ghost'
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
  viewVariant = 'outline',
  editVariant = 'outline',
  deleteVariant = 'outline',
  size,
}: ActionButtonsProps) {
  const effectiveSize: ActionButtonsSize =
    size ?? (mode === 'icon' ? 'icon' : mode === 'compact' ? 'sm' : 'default')

  const showText = mode !== 'icon'

  return (
    <div className={cn('flex items-center justify-end gap-1', className)}>
      {viewTo || onView ? (
        <Button
          type='button'
          size={effectiveSize}
          variant={viewVariant}
           className={cn(
            mode === 'icon'
              ? 'flex h-7 w-7 items-center justify-center rounded-md p-0'
              : undefined,
            // Neutral grayscale hover
            'text-foreground hover:bg-muted'
          )}
          aria-label={viewLabel}
          title={viewLabel}
          disabled={disabled}
          onClick={onView}
          asChild={Boolean(viewTo)}
        >
          {viewTo ? (
            <Link to={viewTo} className='flex items-center justify-center'>
              <Eye className={cn('size-3', showText ? 'me-2' : '')} />
              {showText ? viewLabel : null}
            </Link>
          ) : (
            <>
              <Eye className={cn('size-3', showText ? 'me-2' : '')} />
              {showText ? viewLabel : null}
            </>
          )}
        </Button>
      ) : null}

      {onEdit ? (
        <Button
          type='button'
          size={effectiveSize}
          variant={editVariant}
          className={cn(
            mode === 'icon'
              ? 'flex h-7 w-7 items-center justify-center rounded-md p-0'
              : undefined,
            // Neutral grayscale hover
            'text-foreground hover:bg-muted'
          )}
          aria-label={editLabel}
          title={editLabel}
          disabled={disabled || editDisabled}
          onClick={onEdit}
        >
          <Pencil className={cn('size-3', showText ? 'me-2' : '')} />
          {showText ? editLabel : null}
        </Button>
      ) : null}

      {onDelete ? (
        <Button
          type='button'
          size={effectiveSize}
          variant={deleteVariant}
          className={cn(
            mode === 'icon'
              ? 'flex h-7 w-7 items-center justify-center rounded-md p-0'
              : undefined,
            'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
          )}
          aria-label={deleteLabel}
          title={deleteLabel}
          disabled={disabled || deleteDisabled}
          onClick={onDelete}
        >
          <Trash2 className={cn('size-3', showText ? 'me-2' : '')} />
          {showText ? deleteLabel : null}
        </Button>
      ) : null}
    </div>
  )
}
