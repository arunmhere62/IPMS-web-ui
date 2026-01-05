import { useState, type ReactNode } from 'react'
import type { FieldPath, FieldValues } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type BaseFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = {
  control: any
  name: TName
  label: ReactNode
  disabled?: boolean
}

export type SelectOption = {
  label: ReactNode
  value: string
  searchText?: string
}

export function FormSelectField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  placeholder,
  options,
  disabled,
  parse,
  onValueChange,
  required,
  description,
  className,
  triggerClassName,
  searchable,
  searchPlaceholder,
}: BaseFieldProps<TFieldValues, TName> & {
  placeholder?: string
  options: SelectOption[]
  parse?: (raw: string) => unknown
  onValueChange?: (raw: string) => void
  required?: boolean
  description?: ReactNode
  className?: string
  triggerClassName?: string
  searchable?: boolean
  searchPlaceholder?: string
}) {
  const enableSearch = searchable ?? options.length > 10

  const [open, setOpen] = useState(false)

  const resolveLabelText = (opt: SelectOption) => {
    if (typeof opt.searchText === 'string' && opt.searchText.trim()) return opt.searchText
    if (typeof opt.label === 'string') return opt.label
    return String(opt.value)
  }

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
          {enableSearch ? (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type='button'
                    variant='outline'
                    role='combobox'
                    disabled={disabled}
                    className={cn('w-full justify-between font-normal', triggerClassName)}
                  >
                    <span className='truncate'>
                      {field.value == null || field.value === 0
                        ? placeholder ?? 'Select'
                        : resolveLabelText(options.find((o) => String(o.value) === String(field.value)) ?? {
                            label: String(field.value),
                            value: String(field.value),
                          })}
                    </span>
                    <ChevronsUpDown className='ms-2 size-4 shrink-0 opacity-50' />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className='w-[--radix-popover-trigger-width] p-0' align='start'>
                <Command>
                  <CommandInput placeholder={searchPlaceholder ?? `Search ${String(label)}`} />
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                      {options.map((opt) => {
                        const selected = String(field.value) === String(opt.value)
                        return (
                          <CommandItem
                            key={String(opt.value)}
                            value={`${String(opt.value)} ${resolveLabelText(opt)}`}
                            onSelect={() => {
                              const v = String(opt.value)
                              field.onChange(parse ? parse(v) : v)
                              onValueChange?.(v)
                              setOpen(false)
                            }}
                          >
                            <Check className={cn('me-2 size-4', selected ? 'opacity-100' : 'opacity-0')} />
                            {opt.label}
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          ) : (
            <Select
              value={field.value == null || field.value === 0 ? '' : String(field.value)}
              onValueChange={(v) => {
                field.onChange(parse ? parse(v) : v)
                onValueChange?.(v)
              }}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger className={cn('w-full', triggerClassName)}>
                  <SelectValue placeholder={placeholder ?? 'Select'} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {description ? <div className='text-xs text-muted-foreground'>{description}</div> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
