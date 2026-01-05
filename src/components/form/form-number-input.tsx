import type { ReactNode } from 'react'
import type { FieldPath, FieldValues } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type BaseFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = {
  control: any
  name: TName
  label: ReactNode
  disabled?: boolean
}

export function FormNumberInput<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  placeholder,
  disabled,
  required,
  description,
  className,
  inputClassName,
}: BaseFieldProps<TFieldValues, TName> & {
  placeholder?: string
  required?: boolean
  description?: ReactNode
  className?: string
  inputClassName?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('w-full', className)}>
          <FormLabel>
            {label}
            {required ? <span className='text-destructive'> *</span> : null}
          </FormLabel>
          <FormControl>
            <Input
              type='number'
              placeholder={placeholder}
              value={field.value == null ? '' : String(field.value)}
              onChange={(e) => {
                const v = e.target.value
                const n = v ? Number(v) : null
                field.onChange(Number.isFinite(n as any) ? n : null)
              }}
              disabled={disabled}
              className={cn('w-full', inputClassName)}
            />
          </FormControl>
          {description ? <div className='text-xs text-muted-foreground'>{description}</div> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
