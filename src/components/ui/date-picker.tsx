import * as React from 'react'
import { format } from 'date-fns'
import { UseFormReturn } from 'react-hook-form'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'MM/DD/YYYY',
  disabled = false,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Convert string value to Date object for calendar
  const selectedDate = value ? new Date(value) : undefined

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd')
      onChange?.(formattedDate)
    } else {
      onChange?.('')
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal',
            'h-10 px-3 py-2',
            'border border-input bg-background',
            'hover:bg-accent hover:text-accent-foreground',
            'focus:ring-2 focus:ring-ring focus:ring-offset-2',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
          id={id}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {value ? format(new Date(value), 'MMM dd, yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          className='rounded-md border'
        />
      </PopoverContent>
    </Popover>
  )
}

export interface FormDatePickerProps {
  control: UseFormReturn<any>['control']
  name: string
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  description?: string
  required?: boolean
}

export function FormDatePicker({
  control,
  name,
  label,
  placeholder = 'Select date',
  disabled = false,
  className,
  description,
  required,
}: FormDatePickerProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('space-y-2', className)}>
          {label && (
            <FormLabel
              className={cn(
                'text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                required && 'after:ml-1 after:text-red-500 after:content-["*"]'
              )}
            >
              {label}
            </FormLabel>
          )}
          <FormControl>
            <DatePicker
              value={field.value}
              onChange={field.onChange}
              placeholder={placeholder}
              disabled={disabled}
            />
          </FormControl>
          {description && (
            <p className='text-sm text-muted-foreground'>{description}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Additional preset date picker for common use cases
export interface PresetDatePickerProps extends Omit<
  DatePickerProps,
  'onChange'
> {
  onDateChange?: (date: Date | undefined) => void
  presets?: Array<{
    label: string
    value: Date
  }>
}

export function PresetDatePicker({
  value,
  onDateChange,
  presets = [],
  placeholder = 'MM/DD/YYYY',
  disabled = false,
  className,
  id,
}: PresetDatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Default presets
  const defaultPresets = [
    { label: 'Today', value: new Date() },
    { label: 'Tomorrow', value: new Date(Date.now() + 86400000) },
    { label: 'Next Week', value: new Date(Date.now() + 7 * 86400000) },
    {
      label: 'Next Month',
      value: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    },
  ]

  const allPresets = [...defaultPresets, ...presets]

  const selectedDate = value ? new Date(value) : undefined

  const handleSelect = (date: Date | undefined) => {
    const formattedDate = date ? format(date, 'yyyy-MM-dd') : ''
    onDateChange?.(date)
    setOpen(false)
  }

  const handlePresetClick = (date: Date) => {
    handleSelect(date)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal',
            'h-10 px-3 py-2',
            'border border-input bg-background',
            'hover:bg-accent hover:text-accent-foreground',
            'focus:ring-2 focus:ring-ring focus:ring-offset-2',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
          id={id}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {value ? format(new Date(value), 'MMM dd, yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <div className='space-y-2 p-2'>
          <div className='grid grid-cols-2 gap-1'>
            {allPresets.map((preset, index) => (
              <Button
                key={index}
                variant='ghost'
                size='sm'
                className='h-8 justify-start text-xs'
                onClick={() => handlePresetClick(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className='border-t pt-2'>
            <Calendar
              mode='single'
              selected={selectedDate}
              onSelect={handleSelect}
              initialFocus
              className='rounded-md border'
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
