import type { ReactNode } from 'react'
import type { FieldPath, FieldValues } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type BaseFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = {
  control: any
  name: TName
  label: ReactNode
  disabled?: boolean
}

export function FormTextarea<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  placeholder,
  disabled,
  required,
  description,
  className,
  textareaClassName,
}: BaseFieldProps<TFieldValues, TName> & {
  placeholder?: string
  required?: boolean
  description?: ReactNode
  className?: string
  textareaClassName?: string
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
            <Textarea
              placeholder={placeholder}
              {...field}
              disabled={disabled}
              className={cn('min-h-24 w-full resize-y', textareaClassName)}
            />
          </FormControl>
          {description ? <div className='text-xs text-muted-foreground'>{description}</div> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
