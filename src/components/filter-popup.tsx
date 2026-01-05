import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export type FilterPopupOption<TValue extends string> = {
  label: string
  value: TValue
}

export function FilterPopup<TValue extends string>({
  triggerLabel,
  title,
  value,
  options,
  onValueChange,
}: {
  triggerLabel: string
  title: string
  value: TValue
  options: FilterPopupOption<TValue>[]
  onValueChange: (value: TValue) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm'>
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-64'>
        <div className='text-sm font-medium'>{title}</div>
        <div className='mt-3'>
          <RadioGroup value={value} onValueChange={(v) => onValueChange(v as TValue)}>
            {options.map((opt) => (
              <div key={opt.value} className='flex items-center gap-2'>
                <RadioGroupItem value={opt.value} id={opt.value} />
                <Label htmlFor={opt.value}>{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </PopoverContent>
    </Popover>
  )
}
