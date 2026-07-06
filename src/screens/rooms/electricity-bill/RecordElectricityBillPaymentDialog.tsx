import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useRecordElectricityBillPaymentMutation,
  type ElectricityBillItem,
} from '@/services/electricityBillApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormDialog } from '@/components/form/form-dialog'
import { FormSelectField } from '@/components/form/form-select-field'
import { FormTextInput } from '@/components/form/form-text-input'

const schema = z.object({
  paymentMethod: z.string().min(1, 'Payment method is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
})

type FormValues = z.infer<typeof schema>

interface RecordElectricityBillPaymentDialogProps {
  open: boolean
  item: ElectricityBillItem | null
  onClose: () => void
  onSuccess: () => void
}

const PAYMENT_METHODS = [
  'CASH',
  'GPAY',
  'PHONEPE',
  'BANK_TRANSFER',
  'UPI',
  'CARD',
  'CHEQUE',
  'OTHER',
]

const formatDate = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatCurrency = (value: number) => {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function RecordElectricityBillPaymentDialog({
  open,
  item,
  onClose,
  onSuccess,
}: RecordElectricityBillPaymentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [recordPayment] = useRecordElectricityBillPaymentMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentMethod: 'CASH',
      paymentDate: formatDate(new Date()),
    },
  })

  const reset = () => {
    form.reset({
      paymentMethod: 'CASH',
      paymentDate: formatDate(new Date()),
    })
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!item) return null

  const remaining = Number(item.share_amount) - Number(item.paid_amount || 0)

  const onSubmit = async (values: FormValues) => {
    if (loading) return
    if (remaining <= 0) {
      showErrorAlert('No remaining balance to pay', 'Validation Error')
      return
    }

    setLoading(true)
    try {
      await recordPayment({
        bill_item_id: item.s_no,
        tenant_id: item.tenant_id,
        amount: remaining,
        payment_method: values.paymentMethod,
        payment_date: values.paymentDate || undefined,
      }).unwrap()
      showSuccessAlert('Payment recorded successfully')
      handleClose()
      onSuccess()
    } catch (error: any) {
      showErrorAlert(error, 'Payment Error')
    } finally {
      setLoading(false)
    }
  }


  return (
    <FormDialog
      open={open}
      onOpenChange={(v) => !v && handleClose()}
      title='Record Payment'
      description={item.tenants?.name ?? 'Tenant'}
      size='md'
      footer={
        <>
          <Button variant='outline' onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type='submit' form='payment-form' disabled={loading || remaining <= 0}>
            {loading ? 'Saving...' : 'Save Payment'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id='payment-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4 p-1'
        >
        <div className='rounded-lg border-l-4 border-sky-500 bg-sky-50 p-4'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-sky-700'>Total Share</span>
            <span className='font-bold text-sky-700'>
              {formatCurrency(Number(item.share_amount))}
            </span>
          </div>
          <div className='mt-2 flex items-center justify-between text-sm'>
            <span className='text-sky-700'>Already Paid</span>
            <span className='font-bold text-sky-700'>
              {formatCurrency(Number(item.paid_amount || 0))}
            </span>
          </div>
          <div className='mt-2 flex items-center justify-between border-t border-sky-200 pt-2'>
            <span className='font-semibold text-sky-800'>Paying Now</span>
            <span className='text-lg font-bold text-sky-800'>{formatCurrency(remaining)}</span>
          </div>
        </div>

        <FormSelectField
          control={form.control}
          name='paymentMethod'
          label='Payment Method'
          required
          disabled={loading}
          options={PAYMENT_METHODS.map((method) => ({
            label: method.replace('_', ' '),
            value: method,
          }))}
        />

        <FormTextInput
          control={form.control}
          name='paymentDate'
          label='Payment Date'
          type='date'
          disabled={loading}
        />
        </form>
      </Form>
    </FormDialog>
  )
}
