import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useCreateRefundPaymentMutation,
  type CreateRefundPaymentDto,
} from '@/services/paymentsApi'
import { Calendar } from 'lucide-react'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FormDatePicker } from '@/components/ui/date-picker'
import { Form } from '@/components/ui/form'
import { FormDialog } from '@/components/form/form-dialog'
import { FormTextarea } from '@/components/form/form-fields'
import { FormNumberInput } from '@/components/form/form-number-input'
import {
  OptionSelector,
  type OptionSelectorOption,
} from '@/components/form/option-selector'

const schema = z.object({
  amount_paid: z.number().min(1, 'Amount is required'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_method: z.enum(['GPAY', 'PHONEPE', 'CASH', 'BANK_TRANSFER']),
  remarks: z.string().optional(),
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

type RefundPaymentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: {
    s_no: number
    name: string
    pg_id: number
    room_id: number
    bed_id: number
    rooms?: { s_no?: number; rent_price?: number }
    beds?: { s_no?: number; bed_price?: string | number }
    check_in_date?: string
  }
  onSaved: () => void
}

export function RefundPaymentDialog({
  open,
  onOpenChange,
  tenant,
  onSaved,
}: RefundPaymentDialogProps) {
  const [createRefundPayment, { isLoading: creating }] =
    useCreateRefundPaymentMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount_paid: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'CASH',
      remarks: '',
    },
  })

  const handleSubmit = async (values: FormValues) => {
    const roomId = Number(tenant.room_id || tenant.rooms?.s_no || 0)
    const bedId = Number(tenant.bed_id || tenant.beds?.s_no || 0)
    if (!roomId || !bedId) {
      showErrorAlert('Tenant room/bed not found', 'Validation Error')
      return
    }

    try {
      const payload: CreateRefundPaymentDto = {
        tenant_id: tenant.s_no,
        pg_id: tenant.pg_id,
        room_id: roomId,
        bed_id: bedId,
        amount_paid: values.amount_paid,
        payment_date: values.payment_date,
        payment_method: values.payment_method,
        status: 'PAID',
        remarks: values.remarks || undefined,
      }
      await createRefundPayment(payload).unwrap()

      showSuccessAlert('Refund payment added successfully')
      onOpenChange(false)
      form.reset()
      onSaved()
    } catch (error) {
      showErrorAlert(error, 'Failed to record refund payment')
    }
  }

  useEffect(() => {
    if (open) {
      form.reset({
        amount_paid: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'CASH',
        remarks: '',
      })
    }
  }, [open, form])

  const paymentMethodOptions: OptionSelectorOption[] = [
    { label: 'GPay', value: 'GPAY', icon: '📱' },
    { label: 'PhonePe', value: 'PHONEPE', icon: '📱' },
    { label: 'Cash', value: 'CASH', icon: '💵' },
    { label: 'Bank Transfer', value: 'BANK_TRANSFER', icon: '🏦' },
  ]

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Add Refund Payment'
      description='Record a refund payment for this tenant.'
      size='md'
      footer={
        <div className='flex w-full justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button type='submit' form='refund-payment-form' disabled={creating}>
            {creating ? 'Saving...' : 'Save'}
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <form
          id='refund-payment-form'
          onSubmit={form.handleSubmit(handleSubmit)}
          className='grid gap-4'
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
          />

          <FormDatePicker
            control={form.control}
            name='payment_date'
            label='Payment Date'
            placeholder='Select payment date'
            required
          />

          <OptionSelector
            label='Payment Method'
            options={paymentMethodOptions}
            selectedValue={form.watch('payment_method')}
            onSelect={(v) =>
              form.setValue(
                'payment_method',
                (v ?? 'CASH') as 'GPAY' | 'PHONEPE' | 'CASH' | 'BANK_TRANSFER'
              )
            }
            required
            className='[&>div:last-child]:flex-nowrap [&>div:last-child>button]:flex-1 [&>div:last-child>button]:text-[10px] sm:[&>div:last-child>button]:text-xs'
          />

          <FormTextarea
            control={form.control}
            name='remarks'
            label='Remarks (optional)'
            placeholder='Add any additional notes...'
          />
        </form>
      </Form>
    </FormDialog>
  )
}
