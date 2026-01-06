import type { ReactNode } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export type CheckboxToggleVariant = 'switch' | 'checkbox'

export type CheckboxToggleProps = {
  label: ReactNode
  description?: ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  variant?: CheckboxToggleVariant
  disabled?: boolean
  className?: string
}

export function CheckboxToggle({
  label,
  description,
  checked,
  onCheckedChange,
  variant = 'switch',
  disabled,
  className,
}: CheckboxToggleProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3 rounded-md border p-3', className)}>
      <div className='min-w-0'>
        <div className='text-sm font-medium'>{label}</div>
        {description ? (
          <div className='text-sm text-muted-foreground'>{description}</div>
        ) : null}
      </div>

      {variant === 'checkbox' ? (
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(Boolean(v))}
          disabled={disabled}
        />
      ) : (
        <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      )}
    </div>
  )
}
