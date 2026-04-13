import { useEffect, useMemo, useState, useCallback } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useCreateTenantPaymentMutation,
  useLazyDetectPaymentGapsQuery,
  useLazyGetNextPaymentDatesQuery,
  type RentPaymentGap,
} from '@/services/paymentsApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormDialog } from '@/components/form/form-dialog'
import { FormTextarea } from '@/components/form/form-fields'
import { FormNumberInput } from '@/components/form/form-number-input'
import { FormSelectField } from '@/components/form/form-select-field'
import { FormTextInput } from '@/components/form/form-text-input'

const schema = z.object({
  amount_paid: z.number().min(1, 'Amount paid is required'),
  actual_rent_amount: z.number().min(1, 'Actual rent amount is required'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_method: z.enum(['GPAY', 'PHONEPE', 'CASH', 'BANK_TRANSFER']),
  cycle_id: z.number().min(1, 'Cycle is required'),
  remarks: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type RentPaymentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: {
    s_no: number
    name: string
    pg_id: number
    room_id: number
    bed_id: number
    rooms?: { rent_price?: number }
  }
  onSaved: () => void
}

export function RentPaymentDialog({
  open,
  onOpenChange,
  tenant,
  onSaved,
}: RentPaymentDialogProps) {
  const [createRentPayment, { isLoading: creating }] =
    useCreateTenantPaymentMutation()
  const [triggerDetectPaymentGaps] = useLazyDetectPaymentGapsQuery()
  const [triggerGetNextPaymentDates] = useLazyGetNextPaymentDatesQuery()

  const [gaps, setGaps] = useState<RentPaymentGap[]>([])
  const [selectedGapId, setSelectedGapId] = useState<string | number | null>(
    null
  )
  const [loadingGaps, setLoadingGaps] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount_paid: 0,
      actual_rent_amount: tenant.rooms?.rent_price || 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'CASH',
      cycle_id: 0,
      remarks: '',
    },
  })

  const watchedAmountPaid = form.watch('amount_paid')
  const watchedActualAmount = form.watch('actual_rent_amount')

  const paymentStatus = useMemo(() => {
    if (!watchedAmountPaid || !watchedActualAmount) return 'PENDING'
    if (watchedAmountPaid >= watchedActualAmount) return 'PAID'
    if (watchedAmountPaid > 0) return 'PARTIAL'
    return 'PENDING'
  }, [watchedAmountPaid, watchedActualAmount])

  const loadPaymentGaps = useCallback(async () => {
    if (!tenant) return
    try {
      setLoadingGaps(true)
      setFormError(null)

      const gapData = await triggerDetectPaymentGaps(tenant.s_no).unwrap()
      setGaps(gapData.gaps || [])

      if (!gapData.hasGaps) {
        const next = await triggerGetNextPaymentDates({
          tenant_id: tenant.s_no,
          skipGaps: true,
        }).unwrap()
        form.setValue('cycle_id', next.suggestedCycleId || 0)
        setSelectedGapId(null)
      }
    } catch (_e) {
      setFormError('Failed to load rent periods')
    } finally {
      setLoadingGaps(false)
    }
  }, [tenant, triggerDetectPaymentGaps, triggerGetNextPaymentDates, form])

  const selectGap = (gap: RentPaymentGap) => {
    const id = gap.gapId ?? `${gap.gapStart}-${gap.gapEnd}`
    if (selectedGapId === id) {
      setSelectedGapId(null)
      form.setValue('cycle_id', 0)
      return
    }

    const remaining = gap.remainingDue ?? gap.rentDue ?? 0
    setSelectedGapId(id)
    form.setValue('cycle_id', gap.cycle_id || 0)
    if (remaining > 0) form.setValue('actual_rent_amount', remaining)
  }

  const skipGapsAndUseNextPeriod = async () => {
    if (!tenant) return
    try {
      setLoadingGaps(true)
      setFormError(null)
      const next = await triggerGetNextPaymentDates({
        tenant_id: tenant.s_no,
        skipGaps: true,
      }).unwrap()
      setSelectedGapId(null)
      form.setValue('cycle_id', next.suggestedCycleId || 0)
      form.setValue('actual_rent_amount', tenant.rooms?.rent_price || 0)
    } catch (_e) {
      setFormError('Failed to calculate next rent period')
    } finally {
      setLoadingGaps(false)
    }
  }

  const formatGapLabel = (gapStart: string, gapEnd: string) => {
    try {
      const start = new Date(gapStart)
      const end = new Date(gapEnd)
      const startLabel = start.toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
      const endLabel = end.toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
      return startLabel === endLabel
        ? startLabel
        : `${startLabel} - ${endLabel}`
    } catch {
      return `${gapStart} to ${gapEnd}`
    }
  }

  const onSubmit = async (values: FormValues) => {
    try {
      await createRentPayment({
        tenant_id: tenant.s_no,
        pg_id: tenant.pg_id,
        room_id: tenant.room_id,
        bed_id: tenant.bed_id,
        amount_paid: values.amount_paid,
        actual_rent_amount: values.actual_rent_amount,
        payment_date: values.payment_date,
        payment_method: values.payment_method,
        status: paymentStatus,
        cycle_id: values.cycle_id,
        remarks: values.remarks,
      }).unwrap()

      showSuccessAlert('Rent payment added successfully')
      onOpenChange(false)
      onSaved()
    } catch (e: unknown) {
      showErrorAlert(e, 'Payment Error')
    }
  }

  useEffect(() => {
    if (open && tenant) {
      form.reset({
        amount_paid: 0,
        actual_rent_amount: tenant.rooms?.rent_price || 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'CASH',
        cycle_id: 0,
        remarks: '',
      })
      loadPaymentGaps()
    }
  }, [open, tenant, form, loadPaymentGaps])

  const paymentMethodOptions = [
    { label: 'GPay', value: 'GPAY' },
    { label: 'PhonePe', value: 'PHONEPE' },
    { label: 'Cash', value: 'CASH' },
    { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
  ]

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Add Rent Payment'
      description={`Record a rent payment for ${tenant.name}`}
      size='lg'
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
          <Button
            type='submit'
            form='rent-payment-form'
            disabled={creating || !form.formState.isValid}
          >
            {creating ? 'Saving...' : 'Save Payment'}
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <form
          id='rent-payment-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='grid gap-4'
        >
          {formError && (
            <div className='rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive'>
              {formError}
            </div>
          )}

          {/* Rent Period Selection */}
          <div className='rounded-md border bg-card p-4'>
            <div className='flex items-center justify-between gap-2'>
              <div className='text-sm font-semibold'>Rent Period</div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={skipGapsAndUseNextPeriod}
                disabled={loadingGaps}
              >
                {loadingGaps ? 'Loading...' : 'Next Period'}
              </Button>
            </div>

            {gaps.length > 0 ? (
              <div className='mt-3'>
                <div className='mb-2 text-xs text-muted-foreground'>
                  Missing periods (click to select)
                </div>
                <div className='flex flex-wrap gap-2'>
                  {gaps.map((g) => {
                    const id = g.gapId ?? `${g.gapStart}-${g.gapEnd}`
                    const selected = selectedGapId === id
                    return (
                      <Button
                        key={String(id)}
                        type='button'
                        size='sm'
                        variant={selected ? 'default' : 'outline'}
                        onClick={() => selectGap(g)}
                        disabled={loadingGaps}
                        className='relative'
                      >
                        {formatGapLabel(g.gapStart, g.gapEnd)}
                        {g.rentDue && (
                          <Badge variant='secondary' className='ml-2 text-xs'>
                            ₹${g.rentDue}
                          </Badge>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className='mt-2 text-xs text-muted-foreground'>
                {loadingGaps
                  ? 'Loading periods...'
                  : 'No gaps found. Using next period.'}
              </div>
            )}
          </div>

          {/* Payment Amounts */}
          <div className='grid gap-4 sm:grid-cols-2'>
            <FormNumberInput
              control={form.control}
              name='amount_paid'
              label='Amount Paid'
              placeholder='0.00'
              required
            />
            <FormNumberInput
              control={form.control}
              name='actual_rent_amount'
              label='Actual Rent Amount'
              placeholder='0.00'
              required
            />
          </div>

          {/* Payment Status */}
          <div className='rounded-md border bg-muted/30 p-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Payment Status</span>
              <Badge
                variant={
                  paymentStatus === 'PAID'
                    ? 'default'
                    : paymentStatus === 'PARTIAL'
                      ? 'secondary'
                      : 'outline'
                }
                className='text-xs'
              >
                {paymentStatus}
              </Badge>
            </div>
            <div className='mt-1 text-xs text-muted-foreground'>
              Auto-calculated based on amount paid vs rent amount
            </div>
          </div>

          {/* Payment Details */}
          <div className='grid gap-4 sm:grid-cols-2'>
            <FormTextInput
              control={form.control}
              name='payment_date'
              label='Payment Date'
              placeholder='YYYY-MM-DD'
              required
            />
            <FormSelectField
              control={form.control}
              name='payment_method'
              label='Payment Method'
              placeholder='Select method'
              options={paymentMethodOptions}
              required
            />
          </div>

          {/* Remarks */}
          <FormTextarea
            control={form.control}
            name='remarks'
            label='Remarks (optional)'
            placeholder='Add any notes about this payment'
          />
        </form>
      </Form>
    </FormDialog>
  )
}
