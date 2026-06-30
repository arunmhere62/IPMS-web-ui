import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

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
}: ActionButtonsProps) {
  const showText = mode !== 'icon'

  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
      {viewTo || onView ? (
        <button
          type='button'
          className={cn(
            'flex items-center justify-center rounded-lg p-2 transition-colors',
            'bg-sky-50 text-primary hover:bg-sky-100',
            disabled && 'opacity-45',
            mode !== 'icon' && 'gap-2 px-3 text-xs font-bold',
            className
          )}
          aria-label={viewLabel}
          title={viewLabel}
          disabled={disabled}
          onClick={onView}
        >
          {viewTo ? (
            <Link to={viewTo} className='flex items-center justify-center'>
              <Eye className={cn('size-4', showText ? 'me-2' : '')} />
              {showText ? viewLabel : null}
            </Link>
          ) : (
            <>
              <Eye className={cn('size-4', showText ? 'me-2' : '')} />
              {showText ? viewLabel : null}
            </>
          )}
        </button>
      ) : null}

      {onEdit ? (
        <button
          type='button'
          className={cn(
            'flex items-center justify-center rounded-lg p-2 transition-colors',
            'bg-indigo-50 text-primary hover:bg-indigo-100',
            (disabled || editDisabled) && 'opacity-45',
            mode !== 'icon' && 'gap-2 px-3 text-xs font-bold',
          )}
          aria-label={editLabel}
          title={editLabel}
          disabled={disabled || editDisabled}
          onClick={onEdit}
        >
          <Pencil className={cn('size-4', showText ? 'me-2' : '')} />
          {showText ? editLabel : null}
        </button>
      ) : null}

      {onDelete ? (
        <button
          type='button'
          className={cn(
            'flex items-center justify-center rounded-lg p-2 transition-colors',
            'bg-red-50 text-red-600 hover:bg-red-100',
            (disabled || deleteDisabled) && 'opacity-45',
            mode !== 'icon' && 'gap-2 px-3 text-xs font-bold',
          )}
          aria-label={deleteLabel}
          title={deleteLabel}
          disabled={disabled || deleteDisabled}
          onClick={onDelete}
        >
          <Trash2 className={cn('size-4', showText ? 'me-2' : '')} />
          {showText ? deleteLabel : null}
        </button>
      ) : null}
    </div>
  )
}
