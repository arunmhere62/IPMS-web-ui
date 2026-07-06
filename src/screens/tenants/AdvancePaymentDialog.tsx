import { useState, useCallback } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateAdvancePaymentMutation } from '@/services/paymentsApi'
import { Calendar } from 'lucide-react'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FormDatePicker } from '@/components/ui/date-picker'
import { Form } from '@/components/ui/form'
import { FormDialog } from '@/components/form/form-dialog'
import { FormTextarea } from '@/components/form/form-fields'
import { FormNumberInput } from '@/components/form/form-number-input'
import { OptionSelector, type OptionSelectorOption } from '@/components/form/option-selector'

// Constants
const MIN_PAYMENT_AMOUNT = 1
const MAX_PAYMENT_AMOUNT = 10_00_000
const MAX_DECIMAL_PLACES = 2

const schema = z.object({
  amount_paid: z
    .number()
    .min(MIN_PAYMENT_AMOUNT, `Amount must be at least ₹${MIN_PAYMENT_AMOUNT}`)
    .max(MAX_PAYMENT_AMOUNT, `Amount cannot exceed ₹${MAX_PAYMENT_AMOUNT.toLocaleString('en-IN')}`)
    .refine((val) => val >= 0, 'Amount cannot be negative')
    .refine((val) => {
      const decimalStr = val.toString().split('.')[1]
      return !decimalStr || decimalStr.length <= MAX_DECIMAL_PLACES
    }, `Amount can have maximum ${MAX_DECIMAL_PLACES} decimal places`),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_method: z.enum(['GPAY', 'PHONEPE', 'CASH', 'BANK_TRANSFER']),
  remarks: z.string().trim().optional(),
})

type FormValues = z.infer<typeof schema>

const formatDate = (value?: string) => {
  const s = String(value ?? '')
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s.includes('T') ? s.split('T')[0] : s
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

type AdvancePaymentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: {
    s_no: number
    name: string
    pg_id: number
    room_id: number
    bed_id: number
    rooms?: { rent_price?: number }
    check_in_date?: string
  }
  onSaved: () => void
}

export function AdvancePaymentDialog({
  open,
  onOpenChange,
  tenant,
  onSaved,
}: AdvancePaymentDialogProps) {
  const [createAdvancePayment] = useCreateAdvancePaymentMutation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount_paid: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'CASH',
      remarks: '',
    },
    mode: 'onBlur',
  })

  const handleSubmit = async (values: FormValues) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      await createAdvancePayment({
        tenant_id: tenant.s_no,
        pg_id: tenant.pg_id,
        room_id: tenant.room_id,
        bed_id: tenant.bed_id,
        amount_paid: values.amount_paid,
        actual_rent_amount: tenant.rooms?.rent_price || 0,
        payment_date: values.payment_date,
        payment_method: values.payment_method,
        status: 'PAID',
        remarks: values.remarks || undefined,
      }).unwrap()

      showSuccessAlert('Advance payment recorded successfully')
      onOpenChange(false)
      form.reset()
      onSaved()
    } catch (error) {
      showErrorAlert(error, 'Failed to record advance payment')
      // Don't reset form on error so user can fix it
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      form.handleSubmit(handleSubmit)()
    }
  }, [form, handleSubmit])

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Add Advance Payment'
      description='Record an advance/security payment for this tenant.'
      size='md'
      footer={
        <div className='flex w-full justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type='submit' form='advance-payment-form' disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <form
          id='advance-payment-form'
          onSubmit={form.handleSubmit(handleSubmit)}
          className='grid gap-4'
          onKeyDown={handleKeyDown}
        >
          {tenant.check_in_date && (
            <Card className='border-slate-200 bg-slate-50 p-0 shadow-none'>
              <CardContent className='p-3'>
                <div className='flex items-center gap-2 text-sm'>
                  <Calendar className='h-4 w-4 text-slate-500' />
                  <span className='text-muted-foreground'>Joining Date:</span>
                  <span className='font-medium text-slate-700'>
                    {formatDate(tenant.check_in_date)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <FormNumberInput
            control={form.control}
            name='amount_paid'
            label='Amount'
            placeholder='e.g. 5000'
            required
            disabled={isSubmitting}
          />
          <p className='text-xs text-muted-foreground'>
            Amount range: ₹{MIN_PAYMENT_AMOUNT} - ₹{MAX_PAYMENT_AMOUNT.toLocaleString('en-IN')}
          </p>

          <FormDatePicker
            control={form.control}
            name='payment_date'
            label='Payment Date'
            placeholder='Select payment date'
            required
            disabled={isSubmitting}
          />

          <OptionSelector
            label='Payment Method'
            options={[
              { label: 'GPay', value: 'GPAY', icon: '📱' },
              { label: 'PhonePe', value: 'PHONEPE', icon: '📱' },
              { label: 'Cash', value: 'CASH', icon: '💵' },
              { label: 'Bank Transfer', value: 'BANK_TRANSFER', icon: '🏦' },
            ] satisfies OptionSelectorOption[]}
            selectedValue={form.watch('payment_method')}
            onSelect={(v) => form.setValue('payment_method', (v ?? 'CASH') as 'GPAY' | 'PHONEPE' | 'CASH' | 'BANK_TRANSFER')}
            required
            disabled={isSubmitting}
            className='[&>div:last-child]:flex-nowrap [&>div:last-child>button]:flex-1 [&>div:last-child>button]:text-[10px] sm:[&>div:last-child>button]:text-xs'
          />

          <FormTextarea
            control={form.control}
            name='remarks'
            label='Remarks (optional)'
            placeholder='Add any additional notes...'
            disabled={isSubmitting}
          />
        </form>
      </Form>
    </FormDialog>
  )
}
