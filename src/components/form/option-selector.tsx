import { cn } from '@/lib/utils'

export type OptionSelectorOption = {
  label: string
  value: string
  icon?: string
  description?: string
}

export type OptionSelectorProps = {
  label: string
  options: OptionSelectorOption[]
  selectedValue: string | null
  onSelect: (value: string | null) => void
  required?: boolean
  disabled?: boolean
  className?: string
  description?: string
  error?: string
}

export function OptionSelector({
  label,
  options,
  selectedValue,
  onSelect,
  required = false,
  disabled = false,
  className,
  description,
  error,
}: OptionSelectorProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className='text-sm font-medium'>
        {label}
        {required ? <span className='text-destructive'> *</span> : null}
      </div>

      {description ? <div className='text-xs text-muted-foreground'>{description}</div> : null}

      <div className='flex flex-wrap gap-2'>
        {options.map((option) => {
          const isSelected = selectedValue === option.value

          return (
            <button
              key={option.value}
              type='button'
              disabled={disabled}
              onClick={() => onSelect(isSelected ? null : option.value)}
              className={cn(
                'inline-flex items-center justify-center rounded-md border px-3 py-2 text-xs font-medium transition-colors',
                'bg-muted/30 hover:bg-accent hover:text-accent-foreground',
                'disabled:pointer-events-none disabled:opacity-50',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input text-foreground'
              )}
            >
              {option.icon ? <span className='mr-1'>{option.icon}</span> : null}
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>

      {error ? <div className='text-xs text-destructive'>{error}</div> : null}
    </div>
  )
}
