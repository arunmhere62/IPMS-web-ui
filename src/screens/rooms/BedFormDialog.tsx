import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  type Bed,
  useCreateBedMutation,
  useUpdateBedMutation,
} from '@/services/roomsApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

// Constants
const MIN_BED_PRICE = 100
const MAX_BED_PRICE = 100000
const MAX_BED_NUMBER_SUFFIX = 3
const MAX_DECIMAL_PLACES = 2

const bedFormSchema = z.object({
  bed_no: z
    .string()
    .min(1, 'Bed number is required')
    .trim()
    .regex(/^BED\d+$/, 'Bed number must be in format BED1, BED2, etc.')
    .refine((val) => val.length <= 4 + MAX_BED_NUMBER_SUFFIX, `Bed number suffix cannot exceed ${MAX_BED_NUMBER_SUFFIX} digits`),
  bed_price: z
    .string()
    .min(1, 'Bed price is required')
    .trim()
    .refine((val) => val !== '', 'Bed price is required')
    .refine((val) => !isNaN(parseFloat(val)), 'Please enter a valid price')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Price must be greater than 0')
    .refine((val) => parseFloat(val) >= MIN_BED_PRICE, `Minimum bed price is ₹${MIN_BED_PRICE}`)
    .refine((val) => parseFloat(val) <= MAX_BED_PRICE, `Maximum bed price is ₹${MAX_BED_PRICE.toLocaleString('en-IN')}`)
    .refine((val) => {
      const parts = val.split('.')
      return parts.length <= 2 && (parts[1]?.length ?? 0) <= MAX_DECIMAL_PLACES
    }, `Price can have maximum ${MAX_DECIMAL_PLACES} decimal places`),
})

type BedFormValues = z.infer<typeof bedFormSchema>

interface BedFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: number
  roomNo: string
  pgId: number
  editTarget?: Bed | null
  defaultPrice?: string
  existingBedNumbers?: string[]
  onSaved: () => void
}

export function BedFormDialog({
  open,
  onOpenChange,
  roomId,
  roomNo,
  pgId,
  editTarget,
  defaultPrice,
  existingBedNumbers = [],
  onSaved,
}: BedFormDialogProps) {
  const [createBed] = useCreateBedMutation()
  const [updateBed] = useUpdateBedMutation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditMode = !!editTarget
  const isBedNoLocked = isEditMode && (editTarget?.is_occupied || (editTarget?.tenants?.length ?? 0) > 0)

  const form = useForm<BedFormValues>({
    resolver: zodResolver(bedFormSchema),
    defaultValues: {
      bed_no: 'BED',
      bed_price: '',
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (open) {
      if (editTarget) {
        form.reset({
          bed_no: editTarget.bed_no,
          bed_price: String(editTarget.bed_price || ''),
        })
      } else {
        form.reset({
          bed_no: 'BED',
          bed_price: defaultPrice || '',
        })
      }
    }
  }, [open, editTarget, defaultPrice])

  const onSubmit = async (values: BedFormValues) => {
    if (isSubmitting) return
    if (!roomId || !pgId) {
      showErrorAlert(new Error('Missing required information'), 'Error')
      return
    }

    // Check for duplicate bed number (only for create mode)
    if (!isEditMode && existingBedNumbers.includes(values.bed_no)) {
      form.setError('bed_no', { type: 'manual', message: 'Bed number already exists in this room' })
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditMode && editTarget) {
        const updateData: { room_id: number; pg_id: number; bed_price: number; bed_no?: string } = {
          room_id: roomId,
          pg_id: pgId,
          bed_price: parseFloat(values.bed_price),
        }
        if (!isBedNoLocked) {
          updateData.bed_no = values.bed_no.trim()
        }
        await updateBed({ id: editTarget.s_no, data: updateData }).unwrap()
        showSuccessAlert('Bed updated successfully')
      } else {
        await createBed({
          room_id: roomId,
          pg_id: pgId,
          bed_price: parseFloat(values.bed_price),
          bed_no: values.bed_no.trim(),
        }).unwrap()
        showSuccessAlert('Bed created successfully')
      }

      onSaved()
      onOpenChange(false)

      if (!isEditMode) {
        form.reset()
      }
    } catch (error) {
      showErrorAlert(error as Error, isEditMode ? 'Update Error' : 'Create Error')
      // Don't reset form on error so user can fix it
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      form.handleSubmit(onSubmit)()
    }
  }, [form, onSubmit])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Bed' : 'Add New Bed'}</DialogTitle>
          <DialogDescription>Room {roomNo}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" onKeyDown={handleKeyDown}>
            <FormField
              control={form.control}
              name="bed_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bed Number <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <div className="flex">
                      <div className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 font-semibold text-primary">
                        BED
                      </div>
                      <Input
                        {...field}
                        placeholder="1, 2, 101"
                        type="text"
                        disabled={isBedNoLocked || isSubmitting}
                        className="rounded-l-none"
                        autoFocus={!isEditMode}
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/[^0-9]/g, '')
                          field.onChange('BED' + numericValue)
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                  {isBedNoLocked && (
                    <p className="text-xs text-muted-foreground">
                      Bed number can't be edited after it's assigned to a tenant.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Format: BED followed by numbers (e.g., BED1, BED101)
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bed_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bed Price (₹) <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <div className="flex">
                      <div className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 font-semibold text-primary">
                        ₹
                      </div>
                      <Input
                        {...field}
                        placeholder="0.00"
                        type="text"
                        disabled={isSubmitting}
                        className="rounded-l-none"
                        onChange={(e) => {
                          // Remove any non-numeric characters except decimal point
                          let value = e.target.value.replace(/[^0-9.]/g, '')
                          // Remove multiple decimal points, keep only the first one
                          const parts = value.split('.')
                          if (parts.length > 2) {
                            value = parts[0] + '.' + parts.slice(1).join('')
                          }
                          // Remove leading zeros but keep at least one digit
                          const cleaned = value.replace(/^0+/, '') || '0'
                          field.onChange(cleaned)
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Individual bed price (₹{MIN_BED_PRICE} - ₹{MAX_BED_PRICE.toLocaleString('en-IN')})
                  </p>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
