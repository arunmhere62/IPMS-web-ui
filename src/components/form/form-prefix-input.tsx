import type { ReactNode } from 'react'
import type { FieldPath, FieldValues } from 'react-hook-form'
import { cn } from '@/lib/utils'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

type BaseFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  control: any
  name: TName
  label: ReactNode
  disabled?: boolean
}

export function FormPrefixInput<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  placeholder,
  disabled,
  required,
  description,
  className,
  inputClassName,
  prefix,
}: BaseFieldProps<TFieldValues, TName> & {
  placeholder?: string
  required?: boolean
  description?: ReactNode
  className?: string
  inputClassName?: string
  prefix?: string
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
            <div className='relative flex items-center'>
              {prefix && (
                <div className='pointer-events-none absolute left-3 flex items-center'>
                  <span className='text-sm font-medium text-muted-foreground'>
                    {prefix}
                  </span>
                </div>
              )}
              <Input
                placeholder={placeholder}
                {...field}
                disabled={disabled}
                className={cn('w-full', prefix ? 'pl-16' : '', inputClassName)}
              />
            </div>
          </FormControl>
          {description ? (
            <div className='text-xs text-muted-foreground'>{description}</div>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
