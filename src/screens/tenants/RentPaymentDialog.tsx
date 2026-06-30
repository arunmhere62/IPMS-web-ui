import { useEffect, useMemo, useState, useCallback } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useCreateTenantPaymentMutation,
  useLazyDetectPaymentGapsQuery,
  useLazyGetNextPaymentDatesQuery,
  type RentPaymentGap,
  type RentCycleType,
} from '@/services/paymentsApi'
import { useGetPGLocationDetailsQuery, type PGLocationDetails } from '@/services/pgLocationsApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Form } from '@/components/ui/form'
import { FormDialog } from '@/components/form/form-dialog'
import { FormTextarea } from '@/components/form/form-fields'
import { FormNumberInput } from '@/components/form/form-number-input'
import { OptionSelector, type OptionSelectorOption } from '@/components/form/option-selector'
import { DatePicker } from '@/components/form/date-picker'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const schema = z.object({
  amount_paid: z.number().min(1, 'Amount paid is required'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_method: z.enum(['GPAY', 'PHONEPE', 'CASH', 'BANK_TRANSFER']),
  cycle_id: z.number().min(1, 'Please select a rent period or skip gaps to get the next suggested period'),
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
    beds?: { bed_price?: string | number }
    check_in_date?: string
    last_payment_date?: string
  }
  onSaved: () => void
}

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

const parseDate = (dateString: string): Date => {
  if (!dateString) return new Date()
  if (dateString.includes('T')) {
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) return date
  }
  if (dateString.includes('-') && !dateString.includes('T')) {
    const [year, month, day] = dateString.split('-').map(Number)
    if (year && month && day) return new Date(year, month - 1, day)
  }
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? new Date() : date
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

  const { data: pgLocationData } = useGetPGLocationDetailsQuery(tenant.pg_id, {
    skip: !tenant.pg_id,
  })

  const rentCycleType = useMemo<RentCycleType | null>(() => {
    const t = (pgLocationData as PGLocationDetails | undefined)?.rent_cycle_type
    return t === 'MIDMONTH' ? 'MIDMONTH' : t === 'CALENDAR' ? 'CALENDAR' : null
  }, [pgLocationData])

  const [gaps, setGaps] = useState<RentPaymentGap[]>([])
  const [selectedGapId, setSelectedGapId] = useState<string | number | null>(
    null
  )
  const [loadingGaps, setLoadingGaps] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [actualRentAmount, setActualRentAmount] = useState<number>(
    Number(tenant.beds?.bed_price || tenant.rooms?.rent_price || 0)
  )
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string>('PENDING')

  const bedRentAmount = Number(tenant.beds?.bed_price || tenant.rooms?.rent_price || 0)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount_paid: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'CASH',
      cycle_id: 0,
      remarks: '',
    },
  })

  const watchedAmountPaid = form.watch('amount_paid')

  const paymentStatus = useMemo(() => {
    if (!watchedAmountPaid || !actualRentAmount) return 'PENDING'
    if (watchedAmountPaid >= actualRentAmount) return 'PAID'
    if (watchedAmountPaid > 0) return 'PARTIAL'
    return 'PENDING'
  }, [watchedAmountPaid, actualRentAmount])

  const showAmountToPay = Boolean(
    form.watch('cycle_id') && startDate && endDate
  )

  const loadPaymentGaps = useCallback(async () => {
    if (!tenant) return
    try {
      setLoadingGaps(true)
      setFormError(null)
      setGaps([])
      setSelectedGapId(null)
      setStartDate('')
      setEndDate('')

      const gapData = await triggerDetectPaymentGaps(tenant.s_no).unwrap()
      setGaps(gapData.gaps || [])

      if (!gapData.hasGaps) {
        const next = await triggerGetNextPaymentDates({
          tenant_id: tenant.s_no,
          rentCycleType: rentCycleType ?? undefined,
          skipGaps: true,
        }).unwrap()
        form.setValue('cycle_id', next.suggestedCycleId || 0)
        setSelectedGapId(null)
        setStartDate(next.suggestedStartDate || '')
        setEndDate(next.suggestedEndDate || '')
      }
    } catch {
      setFormError('Failed to load rent periods')
    } finally {
      setLoadingGaps(false)
    }
  }, [tenant, triggerDetectPaymentGaps, triggerGetNextPaymentDates, form, rentCycleType])

  const selectGap = (gap: RentPaymentGap) => {
    const id = gap.gapId ?? `${gap.gapStart}-${gap.gapEnd}`
    if (selectedGapId === id) {
      setSelectedGapId(null)
      form.setValue('cycle_id', 0)
      setStartDate('')
      setEndDate('')
      setActualRentAmount(bedRentAmount)
      return
    }

    const remaining =
      gap.remainingDue ??
      (gap.rentDue != null && gap.totalPaid != null
        ? Number(gap.rentDue) - Number(gap.totalPaid)
        : undefined) ??
      gap.rentDue ??
      0

    setSelectedGapId(id)
    form.setValue('cycle_id', gap.cycle_id || 0)
    setStartDate(gap.gapStart)
    setEndDate(gap.gapEnd)
    setActualRentAmount(Number.isFinite(remaining) ? Math.max(0, remaining) : bedRentAmount)
  }

  const skipGapsAndUseNextPeriod = async () => {
    if (!tenant) return
    try {
      setLoadingGaps(true)
      setFormError(null)
      const next = await triggerGetNextPaymentDates({
        tenant_id: tenant.s_no,
        rentCycleType: rentCycleType ?? undefined,
        skipGaps: true,
      }).unwrap()
      setSelectedGapId(null)
      form.setValue('cycle_id', next.suggestedCycleId || 0)
      setStartDate(next.suggestedStartDate || '')
      setEndDate(next.suggestedEndDate || '')
      setActualRentAmount(bedRentAmount)
    } catch {
      setFormError('Failed to calculate next rent period')
    } finally {
      setLoadingGaps(false)
    }
  }

  const formatGapLabel = (gapStart: string, gapEnd: string) => {
    try {
      const start = new Date(gapStart)
      const end = new Date(gapEnd)
      if (rentCycleType === 'MIDMONTH') {
        const startDay = start.getDate()
        const endDay = end.getDate()
        const startMonth = start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        const endMonth = end.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        return `${startDay} ${startMonth.split(' ')[0]} - ${endDay} ${endMonth}`
      }
      const startLabel = start.toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
      const endLabel = end.toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
      return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`
    } catch {
      return `${gapStart} to ${gapEnd}`
    }
  }

  const savePayment = async (status: string) => {
    try {
      const values = form.getValues()
      await createRentPayment({
        tenant_id: tenant.s_no,
        pg_id: tenant.pg_id,
        room_id: tenant.room_id,
        bed_id: tenant.bed_id,
        amount_paid: values.amount_paid,
        actual_rent_amount: actualRentAmount,
        payment_date: values.payment_date,
        payment_method: values.payment_method,
        status: status as 'PAID' | 'PARTIAL' | 'PENDING',
        cycle_id: values.cycle_id,
        remarks: values.remarks,
      }).unwrap()

      showSuccessAlert('Rent payment added successfully')
      setConfirmOpen(false)
      onOpenChange(false)
      onSaved()
    } catch (e: unknown) {
      showErrorAlert(e, 'Payment Error')
      setConfirmOpen(false)
    }
  }

  const onSubmit = (values: FormValues) => {
    const amountPaid = values.amount_paid
    const actualAmount = actualRentAmount

    let autoStatus: string

    if (amountPaid >= actualAmount) {
      autoStatus = 'PAID'
    } else if (amountPaid > 0) {
      autoStatus = 'PARTIAL'
    } else {
      autoStatus = 'PENDING'
    }

    setPendingStatus(autoStatus)
    setConfirmOpen(true)
  }

  useEffect(() => {
    if (open && tenant) {
      form.reset({
        amount_paid: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'CASH',
        cycle_id: 0,
        remarks: '',
      })
      setSelectedDate(new Date())
      setActualRentAmount(bedRentAmount)
      setStartDate('')
      setEndDate('')
      setGaps([])
      setSelectedGapId(null)
      setFormError(null)
      setConfirmOpen(false)
      loadPaymentGaps()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tenant])

  // CALENDAR cycle join-month proration
  useEffect(() => {
    if (!open) return
    if (selectedGapId) return
    if (!rentCycleType || rentCycleType !== 'CALENDAR') return
    if (!tenant.check_in_date) return
    if (!startDate || !endDate) return
    if (!(bedRentAmount > 0)) return

    const start = parseDate(startDate)
    const end = parseDate(endDate)
    const join = parseDate(tenant.check_in_date)

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(join.getTime())) return

    const isJoinMonth =
      start.getFullYear() === join.getFullYear() && start.getMonth() === join.getMonth()
    const isProratedJoinMonth = isJoinMonth && join.getDate() > 1

    let expected = bedRentAmount
    if (isProratedJoinMonth) {
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
      const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
      const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
      const daysStayed = Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1
      expected = (bedRentAmount / daysInMonth) * Math.max(0, daysStayed)
    }

    const expectedRounded = Math.round((expected + Number.EPSILON) * 100) / 100
    const current = parseFloat(String(actualRentAmount || '0'))
    if (Math.abs(current - expectedRounded) > 0.009) {
      setActualRentAmount(expectedRounded)
    }
  }, [open, rentCycleType, tenant.check_in_date, startDate, endDate, bedRentAmount, selectedGapId, actualRentAmount])

  const paymentMethodOptions: OptionSelectorOption[] = [
    { label: 'GPay', value: 'GPAY', icon: '📱' },
    { label: 'PhonePe', value: 'PHONEPE', icon: '📱' },
    { label: 'Cash', value: 'CASH', icon: '💵' },
    { label: 'Bank Transfer', value: 'BANK_TRANSFER', icon: '🏦' },
  ]

  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title='Add Payment'
        description={tenant.name}
        size='lg'
        bodyClassName='max-h-[90vh] overflow-y-auto'
        footer={
          <div className='flex w-full flex-col-reverse sm:flex-row sm:justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={creating}
              className='w-full sm:w-auto'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              form='rent-payment-form'
              disabled={creating || loadingGaps}
              className='w-full sm:w-auto'
            >
              {creating ? 'Saving...' : 'Add Payment'}
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

            {/* Missing Rent Periods */}
            {gaps.length > 0 && (
              <div className='rounded-xl border border-amber-200 bg-amber-50 p-3'>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='text-xs font-bold text-amber-700'>
                    ⚠️ Missing Rent Periods
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={skipGapsAndUseNextPeriod}
                    disabled={loadingGaps}
                    className='h-7 text-xs'
                  >
                    Skip All Gaps
                  </Button>
                </div>
                <div className='mt-2 flex flex-wrap gap-2'>
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
                        className='text-xs'
                      >
                        {formatGapLabel(g.gapStart, g.gapEnd)}
                        {g.rentDue != null && (
                          <Badge variant='secondary' className='ml-2 text-[10px]'>
                            ₹{g.rentDue}
                          </Badge>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Payment Reference Info */}
            <Card className='border-slate-200 bg-slate-50 p-0 shadow-none'>
              <CardContent className='p-3'>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <div className='text-[10px] text-muted-foreground'>Joining Date</div>
                    <div className='text-xs font-semibold text-slate-700'>
                      {formatDate(tenant.check_in_date)}
                    </div>
                  </div>
                  <div>
                    <div className='text-[10px] text-muted-foreground'>Last Payment</div>
                    <div className='text-xs font-semibold text-slate-700'>
                      {formatDate(tenant.last_payment_date)}
                    </div>
                  </div>
                  <div>
                    <div className='text-[10px] text-muted-foreground'>Bed Rent</div>
                    <div className='text-xs font-semibold text-slate-700'>
                      ₹{bedRentAmount}
                    </div>
                  </div>
                  <div>
                    <div className='text-[10px] text-muted-foreground'>Rent Cycle</div>
                    <div className='text-xs font-semibold text-slate-700'>
                      {rentCycleType ?? '—'}
                    </div>
                  </div>
                </div>
                {showAmountToPay && (
                  <div className='mt-3 rounded-lg border border-slate-200 bg-white p-2'>
                    <div className='flex items-center justify-between'>
                      <span className='text-[10px] text-muted-foreground'>Amount to Pay</span>
                      <span className='text-sm font-bold text-slate-900'>₹{actualRentAmount}</span>
                    </div>
                    <div className='mt-1 flex items-center justify-between'>
                      <span className='text-[10px] text-muted-foreground'>Amount Paid</span>
                      <span className='text-sm font-bold text-slate-900'>₹{watchedAmountPaid || 0}</span>
                    </div>
                    <div className='mt-1 flex items-center justify-between'>
                      <span className='text-[10px] text-muted-foreground'>Balance</span>
                      <span className='text-sm font-bold text-slate-900'>
                        ₹{Math.max(0, actualRentAmount - (watchedAmountPaid || 0))}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rent Period Selection (when no gaps) */}
            {gaps.length === 0 && (
              <div className='rounded-md border bg-card p-3'>
                <div className='flex items-center justify-between'>
                  <div className='text-xs font-semibold'>Rent Period</div>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={skipGapsAndUseNextPeriod}
                    disabled={loadingGaps}
                    className='h-7 text-xs'
                  >
                    {loadingGaps ? 'Loading...' : 'Next Period'}
                  </Button>
                </div>
                <div className='mt-2 text-xs text-muted-foreground'>
                  {loadingGaps
                    ? 'Loading periods...'
                    : startDate && endDate
                      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                      : 'No gaps found. Using next period.'}
                </div>
              </div>
            )}

            {/* Amount Paid */}
            <FormNumberInput
              control={form.control}
              name='amount_paid'
              label='Amount Paid'
              placeholder='0.00'
              required
            />

            {/* Start / End Date (disabled, auto-filled) */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div className='flex flex-col'>
                <label className='mb-1.5 text-xs font-medium text-muted-foreground'>
                  Start Date
                </label>
                <Input
                  type='date'
                  value={startDate}
                  disabled
                  className='text-xs'
                />
              </div>
              <div className='flex flex-col'>
                <label className='mb-1.5 text-xs font-medium text-muted-foreground'>
                  End Date
                </label>
                <Input
                  type='date'
                  value={endDate}
                  disabled
                  className='text-xs'
                />
              </div>
            </div>

            {/* Payment Status Info */}
            <div className='rounded-md border border-slate-200 bg-slate-50 p-3'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-semibold text-slate-700'>Payment Status</span>
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
              <div className='mt-1 text-[11px] text-muted-foreground'>
                Payment status will be automatically calculated based on the amount paid vs rent amount.
              </div>
            </div>

            {/* Payment Date */}
            <div className='flex flex-col'>
              <label className='mb-1.5 text-sm font-medium'>Payment Date</label>
              <DatePicker
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date)
                  form.setValue('payment_date', date ? date.toISOString().split('T')[0] : '')
                }}
                placeholder='Pick a date'
              />
            </div>

            {/* Payment Method */}
            <OptionSelector
              label='Payment Method'
              options={paymentMethodOptions}
              selectedValue={form.watch('payment_method')}
              onSelect={(v) => form.setValue('payment_method', (v ?? 'CASH') as 'GPAY' | 'PHONEPE' | 'CASH' | 'BANK_TRANSFER')}
              required
              className='[&>div:last-child]:flex-nowrap [&>div:last-child>button]:flex-1 [&>div:last-child>button]:text-[10px] sm:[&>div:last-child>button]:text-xs'
            />

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

      {/* Confirm Payment Status Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className='max-w-sm'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-sm'>
              Confirm Payment Status
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs'>
              Based on the amounts:
              <br />
              Amount Paid: ₹{(form.getValues('amount_paid') ?? 0).toLocaleString('en-IN')}
              <br />
              Rent Amount: ₹{actualRentAmount.toLocaleString('en-IN')}
              <br />
              <br />
              Suggested Status: {pendingStatus === 'PAID' ? '✅ Paid' : pendingStatus === 'PARTIAL' ? '🔵 Partial' : '⏳ Pending'}
              <br />
              Is this correct?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='text-xs'>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => savePayment(pendingStatus)}
              disabled={creating}
              className='text-xs'
            >
              {creating ? 'Saving...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
