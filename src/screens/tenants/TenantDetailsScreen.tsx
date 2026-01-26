import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, CircleAlert, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { AppDialog } from '@/components/form/app-dialog'
import { PageHeader } from '@/components/form/page-header'

import {
  useCheckoutTenantWithDateMutation,
  useDeleteTenantMutation,
  useGetTenantByIdQuery,
  useUpdateTenantCheckoutDateMutation,
  type Tenant,
  type TenantResponse,
} from '@/services/tenantsApi'
import {
  useCreateAdvancePaymentMutation,
  useCreateRefundPaymentMutation,
  useCreateTenantPaymentMutation,
  useLazyDetectPaymentGapsQuery,
  useLazyGetNextPaymentDatesQuery,
  useGetAdvancePaymentsByTenantQuery,
  useGetRefundPaymentsQuery,
  useGetTenantPaymentsQuery,
  type AdvancePayment,
  type RentPaymentGap,
  type RefundPayment,
} from '@/services/paymentsApi'
import { useAppSelector } from '@/store/hooks'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

type ErrorLike = {
  data?: {
    message?: string
  }
  message?: string
}

type UnpaidMonth = {
  month_name?: string
  cycle_start?: string
  cycle_end?: string
}

type RentPaymentItem = {
  s_no?: number
  amount_paid?: number
  payment_date?: string
  payment_method?: string
  status?: string
  remarks?: string
}

type PaymentMethod = 'GPAY' | 'PHONEPE' | 'CASH' | 'BANK_TRANSFER'

const isPaymentMethod = (v: string): v is PaymentMethod => {
  return v === 'GPAY' || v === 'PHONEPE' || v === 'CASH' || v === 'BANK_TRANSFER'
}

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

const toDateOnly = (value?: string) => {
  const s = String(value ?? '')
  if (!s) return ''
  return s.includes('T') ? s.split('T')[0] : s
}

const safeNum = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : 0
}

export function TenantDetailsScreen() {
  const navigate = useNavigate()
  const params = useParams()
  const tenantId = Number(params.id)

  const selectedPGLocationId = useAppSelector((s) => s.pgLocations.selectedPGLocationId)

  const {
    data: tenantResponse,
    isLoading,
    error,
    refetch,
  } = useGetTenantByIdQuery(Number.isFinite(tenantId) ? tenantId : 0, {
    skip: !Number.isFinite(tenantId) || tenantId <= 0,
  })

  const tenant: Tenant | null = (tenantResponse as TenantResponse | undefined)?.data ?? null

  const [deleteTenant, { isLoading: deleting }] = useDeleteTenantMutation()
  const [checkoutTenantWithDate, { isLoading: checkingOut }] = useCheckoutTenantWithDateMutation()
  const [updateTenantCheckoutDate, { isLoading: updatingCheckout }] = useUpdateTenantCheckoutDateMutation()

  const [createRentPayment, { isLoading: creatingRent }] = useCreateTenantPaymentMutation()
  const [triggerDetectPaymentGaps] = useLazyDetectPaymentGapsQuery()
  const [triggerGetNextPaymentDates] = useLazyGetNextPaymentDatesQuery()
  const [createAdvancePayment, { isLoading: creatingAdvance }] = useCreateAdvancePaymentMutation()
  const [createRefundPayment, { isLoading: creatingRefund }] = useCreateRefundPaymentMutation()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutDate, setCheckoutDate] = useState(() => new Date().toISOString().split('T')[0])

  const [checkoutEditOpen, setCheckoutEditOpen] = useState(false)
  const [checkoutEditDate, setCheckoutEditDate] = useState('')
  const [clearCheckout, setClearCheckout] = useState(false)

  const [rentDialogOpen, setRentDialogOpen] = useState(false)
  const [rentAmountPaid, setRentAmountPaid] = useState('')
  const [rentActualAmount, setRentActualAmount] = useState('')
  const [rentPaymentDate, setRentPaymentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [rentPaymentMethod, setRentPaymentMethod] = useState<PaymentMethod>('CASH')
  const [rentCycleId, setRentCycleId] = useState<number | null>(null)
  const [rentStartDate, setRentStartDate] = useState('')
  const [rentEndDate, setRentEndDate] = useState('')
  const [rentGaps, setRentGaps] = useState<RentPaymentGap[]>([])
  const [rentSelectedGapId, setRentSelectedGapId] = useState<string | number | null>(null)
  const [rentLoadingGaps, setRentLoadingGaps] = useState(false)
  const [rentRemarks, setRentRemarks] = useState('')

  const [rentFormError, setRentFormError] = useState<string | null>(null)

  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false)
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [advancePaymentDate, setAdvancePaymentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState('CASH')
  const [advanceRemarks, setAdvanceRemarks] = useState('')

  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundPaymentDate, setRefundPaymentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [refundPaymentMethod, setRefundPaymentMethod] = useState<PaymentMethod>('CASH')
  const [refundRemarks, setRefundRemarks] = useState('')

  const fetchErrorMessage = (error as ErrorLike | undefined)?.data?.message || (error as ErrorLike | undefined)?.message

  const roomLabel = useMemo(() => {
    const roomNo = tenant?.rooms?.room_no
    const bedNo = tenant?.beds?.bed_no
    if (roomNo && bedNo) return `Room ${roomNo} • Bed ${bedNo}`
    if (roomNo) return `Room ${roomNo}`
    return tenant?.room_id ? `Room #${tenant.room_id}` : ''
  }, [tenant])

  const formatGapLabel = (gapStart: string, gapEnd: string) => {
    try {
      const start = new Date(gapStart)
      const end = new Date(gapEnd)
      const startLabel = start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
      const endLabel = end.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
      return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`
    } catch {
      return `${gapStart} to ${gapEnd}`
    }
  }

  const hydrateRentDialogDefaults = () => {
    setRentAmountPaid('')
    setRentPaymentDate(new Date().toISOString().split('T')[0])
    setRentPaymentMethod('CASH')
    setRentFormError(null)

    const rentPrice = tenant?.rooms?.rent_price
    setRentActualAmount(typeof rentPrice === 'number' ? String(rentPrice) : '')
  }

  const loadRentGapsAndSuggestedPeriod = async () => {
    if (!tenant) return
    try {
      setRentLoadingGaps(true)
      setRentFormError(null)

      const gapData = await triggerDetectPaymentGaps(tenant.s_no).unwrap()
      const gaps = asArray<RentPaymentGap>((gapData as unknown as { gaps?: unknown })?.gaps)
      setRentGaps(gaps)

      setRentSelectedGapId(null)
      setRentCycleId(null)
      setRentStartDate('')
      setRentEndDate('')

      if (!gapData?.hasGaps) {
        const next = await triggerGetNextPaymentDates({ tenant_id: tenant.s_no, skipGaps: true }).unwrap()
        setRentCycleId(typeof next?.suggestedCycleId === 'number' ? next.suggestedCycleId : null)
        setRentStartDate(String(next?.suggestedStartDate ?? ''))
        setRentEndDate(String(next?.suggestedEndDate ?? ''))
      }
    } catch (_e: unknown) {
      setRentFormError('Failed to load rent periods')
    } finally {
      setRentLoadingGaps(false)
    }
  }

  const selectRentGap = (gap: RentPaymentGap) => {
    const id = gap.gapId ?? `${gap.gapStart}-${gap.gapEnd}`
    if (rentSelectedGapId === id) {
      setRentSelectedGapId(null)
      setRentCycleId(null)
      setRentStartDate('')
      setRentEndDate('')
      return
    }

    const remaining = safeNum(gap.remainingDue ?? (gap.rentDue != null && gap.totalPaid != null ? Number(gap.rentDue) - Number(gap.totalPaid) : gap.rentDue))
    setRentSelectedGapId(id)
    setRentCycleId(typeof gap.cycle_id === 'number' ? gap.cycle_id : null)
    setRentStartDate(String(gap.gapStart ?? ''))
    setRentEndDate(String(gap.gapEnd ?? ''))
    if (remaining > 0) setRentActualAmount(String(Math.max(0, remaining)))
  }

  const skipGapsAndUseNextPeriod = async () => {
    if (!tenant) return
    try {
      setRentLoadingGaps(true)
      setRentFormError(null)
      const next = await triggerGetNextPaymentDates({ tenant_id: tenant.s_no, skipGaps: true }).unwrap()
      setRentSelectedGapId(null)
      setRentCycleId(typeof next?.suggestedCycleId === 'number' ? next.suggestedCycleId : null)
      setRentStartDate(String(next?.suggestedStartDate ?? ''))
      setRentEndDate(String(next?.suggestedEndDate ?? ''))
    } catch (_e: unknown) {
      setRentFormError('Failed to calculate next rent period')
    } finally {
      setRentLoadingGaps(false)
    }
  }

  const unpaidMonths = useMemo(() => {
    return asArray<UnpaidMonth>((tenant as unknown as { unpaid_months?: unknown } | null)?.unpaid_months)
  }, [tenant])

  useEffect(() => {
    if (!rentDialogOpen) return
    if (!tenant) return
    hydrateRentDialogDefaults()
    void loadRentGapsAndSuggestedPeriod()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentDialogOpen, tenant?.s_no])

  const rentDueAmount = safeNum(tenant?.rent_due_amount)
  const partialDueAmount = safeNum(tenant?.partial_due_amount)
  const pendingDueAmount = safeNum(tenant?.pending_due_amount)
  const hasOutstandingAmount = rentDueAmount > 0
  const isRentPartial = Boolean(tenant?.is_rent_partial)
  const isRentPaid = Boolean(tenant?.is_rent_paid)
  const isAdvancePaid = Boolean(tenant?.is_advance_paid)
  const hasPendingRent = pendingDueAmount > 0 || unpaidMonths.length > 0
  const hasBothPartialAndPending = partialDueAmount > 0 && pendingDueAmount > 0

  const paymentStatusBadges = useMemo(() => {
    const badges: Array<{ key: string; label: string; className: string }> = []
    if (isRentPaid) badges.push({ key: 'rent_paid', label: '✅ Rent PAID', className: 'bg-emerald-500 text-white' })
    if (isAdvancePaid) badges.push({ key: 'adv_paid', label: '✅ Advance Paid', className: 'bg-emerald-500 text-white' })
    if (isRentPartial) badges.push({ key: 'partial', label: '⏳ PARTIAL', className: 'bg-orange-500 text-white' })
    if (hasPendingRent) badges.push({ key: 'pending', label: '📅 PENDING RENT', className: 'bg-amber-500 text-white' })
    if (hasOutstandingAmount) badges.push({ key: 'due', label: `₹${rentDueAmount} DUE`, className: 'bg-red-500 text-white' })
    if (!isAdvancePaid) badges.push({ key: 'no_adv', label: '💰 NO ADVANCE', className: 'bg-amber-500 text-white' })
    return badges
  }, [hasOutstandingAmount, hasPendingRent, isAdvancePaid, isRentPaid, isRentPartial, rentDueAmount])

  const { data: rentPaymentsResponse } = useGetTenantPaymentsQuery(
    tenant?.s_no ? { tenant_id: tenant.s_no, limit: 50 } : undefined,
    { skip: !tenant?.s_no }
  )
  const rentPayments = useMemo(
    () => asArray<RentPaymentItem>((rentPaymentsResponse as { data?: unknown } | undefined)?.data),
    [rentPaymentsResponse]
  )

  const { data: advancePaymentsResponse } = useGetAdvancePaymentsByTenantQuery(tenant?.s_no ? tenant.s_no : 0, {
    skip: !tenant?.s_no,
  })
  const advancePayments = useMemo(
    () => asArray<AdvancePayment>((advancePaymentsResponse as { data?: unknown } | undefined)?.data),
    [advancePaymentsResponse]
  )

  const { data: refundPaymentsResponse } = useGetRefundPaymentsQuery(
    tenant?.s_no ? { tenant_id: tenant.s_no, limit: 50 } : undefined,
    { skip: !tenant?.s_no }
  )
  const refundPayments = useMemo(
    () => asArray<RefundPayment>((refundPaymentsResponse as { data?: unknown } | undefined)?.data),
    [refundPaymentsResponse]
  )

  const dueLabel = useMemo(() => {
    const due =
      typeof tenant?.pending_due_amount === 'number'
        ? tenant.pending_due_amount
        : typeof tenant?.rent_due_amount === 'number'
          ? tenant.rent_due_amount
          : undefined

    return typeof due === 'number' && due > 0 ? `Pending ₹${Math.round(due)}` : ''
  }, [tenant])

  const confirmDelete = async () => {
    if (!tenant) return
    try {
      await deleteTenant(tenant.s_no).unwrap()
      showSuccessAlert('Tenant deleted successfully')
      setDeleteOpen(false)
      navigate('/tenants')
    } catch (e: unknown) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const confirmUpdateCheckout = async () => {
    if (!tenant) return
    try {
      await updateTenantCheckoutDate({
        id: tenant.s_no,
        check_out_date: clearCheckout ? undefined : checkoutEditDate || undefined,
        clear_checkout: clearCheckout ? true : undefined,
      }).unwrap()
      showSuccessAlert(clearCheckout ? 'Checkout cleared' : 'Checkout updated')
      setCheckoutEditOpen(false)
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Update Error')
    }
  }

  const submitRent = async () => {
    if (!tenant) return
    const amountPaid = Number(rentAmountPaid)
    const actualAmount = Number(rentActualAmount)

    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      showErrorAlert('Enter valid amount paid', 'Validation Error')
      return
    }
    if (!Number.isFinite(actualAmount) || actualAmount <= 0) {
      showErrorAlert('Enter valid rent amount', 'Validation Error')
      return
    }
    if (!rentCycleId || !Number.isFinite(rentCycleId) || rentCycleId <= 0) {
      showErrorAlert('Please select a rent period', 'Validation Error')
      return
    }
    if (!rentPaymentDate) {
      showErrorAlert('Select a payment date', 'Validation Error')
      return
    }

    const roomId = Number(tenant.room_id || tenant.rooms?.s_no || 0)
    const bedId = Number(tenant.bed_id || tenant.beds?.s_no || 0)
    if (!roomId || !bedId) {
      showErrorAlert('Tenant room/bed not found', 'Validation Error')
      return
    }

    const status = amountPaid >= actualAmount ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'PENDING'

    try {
      await createRentPayment({
        tenant_id: tenant.s_no,
        pg_id: tenant.pg_id,
        room_id: roomId,
        bed_id: bedId,
        amount_paid: amountPaid,
        actual_rent_amount: actualAmount,
        payment_date: rentPaymentDate || undefined,
        payment_method: rentPaymentMethod,
        status,
        cycle_id: rentCycleId,
        remarks: rentRemarks || undefined,
      }).unwrap()
      showSuccessAlert('Rent payment added')
      setRentDialogOpen(false)
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Payment Error')
    }
  }

  const submitAdvance = async () => {
    if (!tenant) return
    const amountPaid = Number(advanceAmount)
    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      showErrorAlert('Enter valid amount', 'Validation Error')
      return
    }

    const roomId = Number(tenant.room_id || tenant.rooms?.s_no || 0)
    const bedId = Number(tenant.bed_id || tenant.beds?.s_no || 0)
    if (!roomId || !bedId) {
      showErrorAlert('Tenant room/bed not found', 'Validation Error')
      return
    }

    try {
      await createAdvancePayment({
        tenant_id: tenant.s_no,
        pg_id: tenant.pg_id,
        room_id: roomId,
        bed_id: bedId,
        amount_paid: amountPaid,
        payment_date: advancePaymentDate || undefined,
        payment_method: advancePaymentMethod,
        status: 'PAID',
        remarks: advanceRemarks || undefined,
      }).unwrap()
      showSuccessAlert('Advance payment added')
      setAdvanceDialogOpen(false)
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Payment Error')
    }
  }

  const submitRefund = async () => {
    if (!tenant) return
    const amountPaid = Number(refundAmount)
    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      showErrorAlert('Enter valid amount', 'Validation Error')
      return
    }

    const roomId = Number(tenant.room_id || tenant.rooms?.s_no || 0)
    const bedId = Number(tenant.bed_id || tenant.beds?.s_no || 0)
    if (!roomId || !bedId) {
      showErrorAlert('Tenant room/bed not found', 'Validation Error')
      return
    }

    try {
      await createRefundPayment({
        tenant_id: tenant.s_no,
        pg_id: tenant.pg_id,
        room_id: roomId,
        bed_id: bedId,
        amount_paid: amountPaid,
        payment_date: refundPaymentDate,
        payment_method: refundPaymentMethod,
        status: 'PAID',
        remarks: refundRemarks || undefined,
      }).unwrap()
      showSuccessAlert('Refund payment added')
      setRefundDialogOpen(false)
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Payment Error')
    }
  }

  const confirmCheckout = async () => {
    if (!tenant) return
    if (!checkoutDate) {
      showErrorAlert('Please select a checkout date', 'Validation Error')
      return
    }

    try {
      await checkoutTenantWithDate({ id: tenant.s_no, check_out_date: checkoutDate }).unwrap()
      showSuccessAlert('Tenant checked out successfully')
      setCheckoutOpen(false)
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Checkout Error')
    }
  }

  return (
    <div className='container mx-auto max-w-5xl px-3 py-6'>
      <PageHeader
        title={tenant?.name ? tenant.name : 'Tenant Details'}
        subtitle={roomLabel}
        right={
          <>
            <Button asChild variant='outline' size='sm'>
              <Link to='/tenants'>
                <ChevronLeft className='me-1 size-4' />
                Back
              </Link>
            </Button>
            {Number.isFinite(tenantId) ? <Badge variant='outline'>#{tenantId}</Badge> : null}
            <Button variant='outline' size='sm' onClick={() => void refetch()}>
              <RefreshCw className='me-2 size-4' />
              Refresh
            </Button>
          </>
        }
      />

      {fetchErrorMessage ? (
        <div className='mt-4'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load tenant</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>Select a PG Location</div>
          <div className='mt-1 text-xs text-muted-foreground'>Choose a PG from the top bar to manage tenants.</div>
        </div>
      ) : isLoading ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>Loading...</div>
      ) : !tenant ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>Tenant not found</div>
          <div className='mt-1 text-xs text-muted-foreground'>Please check the tenant id and try again.</div>
        </div>
      ) : (
        <div className='mt-4 grid gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div className='min-w-0'>
                  <div className='text-sm font-semibold'>{tenant.name}</div>
                  <div className='mt-1 text-xs text-muted-foreground'>
                    {tenant.phone_no ? tenant.phone_no : 'Phone —'}
                    {tenant.email ? ` • ${tenant.email}` : ''}
                  </div>
                  {dueLabel ? <div className='mt-1 text-xs text-muted-foreground'>{dueLabel}</div> : null}
                </div>

                <div className='flex flex-wrap items-center justify-end gap-2'>
                  <Button asChild size='sm'>
                    <Link to={`/tenants/${tenant.s_no}/edit`}>
                      <Pencil className='me-2 size-4' />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={() => setCheckoutOpen(true)}
                    disabled={tenant.status === 'CHECKED_OUT' || checkingOut}
                  >
                    {tenant.status === 'CHECKED_OUT' ? 'Checked Out' : checkingOut ? 'Checking out...' : 'Checkout'}
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      setCheckoutEditDate(toDateOnly(tenant.check_out_date) || '')
                      setClearCheckout(false)
                      setCheckoutEditOpen(true)
                    }}
                    disabled={updatingCheckout}
                  >
                    Update Checkout
                  </Button>
                  <Button type='button' size='sm' variant='destructive' onClick={() => setDeleteOpen(true)} disabled={deleting}>
                    <Trash2 className='me-2 size-4' />
                    Delete
                  </Button>
                </div>
              </div>

              <div className='mt-4 grid gap-2 text-sm'>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <div className='text-xs text-muted-foreground'>Status</div>
                    <div className='font-semibold'>{tenant.status}</div>
                  </div>
                  <div>
                    <div className='text-xs text-muted-foreground'>Check-in</div>
                    <div className='font-semibold'>{String(tenant.check_in_date).split('T')[0]}</div>
                  </div>
                </div>

                {tenant.check_out_date ? (
                  <div>
                    <div className='text-xs text-muted-foreground'>Check-out</div>
                    <div className='font-semibold'>{String(tenant.check_out_date).split('T')[0]}</div>
                  </div>
                ) : null}
              </div>

              <div className='mt-4'>
                <div className='text-[11px] font-semibold text-muted-foreground'>Payment Status</div>
                <div className='mt-2 flex flex-wrap items-center gap-2'>
                  {paymentStatusBadges.map((b) => (
                    <span key={b.key} className={`rounded-full px-3 py-1 text-[11px] font-bold ${b.className}`}>
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>

              {hasOutstandingAmount ? (
                <div className={`mt-4 rounded-lg border ${isRentPartial ? 'border-orange-200 bg-orange-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className='flex items-start justify-between gap-3 px-3 py-2'>
                    <div className='min-w-0 flex-1'>
                      <div className={`text-xs font-bold ${isRentPartial ? 'text-orange-600' : 'text-amber-700'}`}>
                        {hasBothPartialAndPending ? 'Partial + Pending' : isRentPartial ? 'Partial Payment' : 'Pending Payment'}
                      </div>
                      <div className='mt-0.5 text-[11px] text-muted-foreground'>
                        Due ₹{rentDueAmount}
                        {unpaidMonths.length > 0 ? ` · ${unpaidMonths.length} month(s)` : ''}
                        {!isAdvancePaid ? ' · No advance' : ''}
                      </div>
                      {hasBothPartialAndPending ? (
                        <div className='mt-2 text-[11px] text-muted-foreground'>
                          Partial: ₹{partialDueAmount} • Pending: ₹{pendingDueAmount}
                        </div>
                      ) : null}
                      {unpaidMonths.length > 0 ? (
                        <div className='mt-3'>
                          <div className={`text-[11px] font-bold ${isRentPartial ? 'text-orange-600' : 'text-amber-700'}`}>Unpaid months</div>
                          {unpaidMonths.slice(0, 2).map((m, idx) => (
                            <div key={String(idx)} className='mt-1 text-[10px] text-muted-foreground'>
                              {m.month_name ? m.month_name : 'Month'}
                              {m.cycle_start && m.cycle_end ? ` (${m.cycle_start} to ${m.cycle_end})` : ''}
                            </div>
                          ))}
                          {unpaidMonths.length > 2 ? (
                            <div className='mt-1 text-[10px] text-muted-foreground'>+{unpaidMonths.length - 2} more</div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Tabs defaultValue='overview'>
            <TabsList className='w-full justify-start'>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='rent'>Rent</TabsTrigger>
              <TabsTrigger value='advance'>Advance</TabsTrigger>
              <TabsTrigger value='refund'>Refund</TabsTrigger>
            </TabsList>

            <TabsContent value='overview'>
              <div className='mt-4 grid gap-4'>
                <Card>
                  <CardContent className='p-4'>
                    <div className='text-sm font-semibold'>Accommodation</div>
                    <div className='mt-2 grid gap-2 text-sm'>
                      <div className='grid grid-cols-2 gap-2'>
                        <div>
                          <div className='text-xs text-muted-foreground'>PG</div>
                          <div className='font-semibold'>{tenant.pg_locations?.location_name ?? `#${tenant.pg_id}`}</div>
                        </div>
                        <div>
                          <div className='text-xs text-muted-foreground'>Room</div>
                          <div className='font-semibold'>{tenant.rooms?.room_no ?? (tenant.room_id ? `#${tenant.room_id}` : '—')}</div>
                        </div>
                      </div>
                      <div className='grid grid-cols-2 gap-2'>
                        <div>
                          <div className='text-xs text-muted-foreground'>Bed</div>
                          <div className='font-semibold'>{tenant.beds?.bed_no ?? (tenant.bed_id ? `#${tenant.bed_id}` : '—')}</div>
                        </div>
                        <div>
                          <div className='text-xs text-muted-foreground'>Rent</div>
                          <div className='font-semibold'>
                            {typeof tenant.rooms?.rent_price === 'number' ? `₹${tenant.rooms.rent_price}/mo` : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='p-4'>
                    <div className='text-sm font-semibold'>Personal Information</div>
                    <div className='mt-2 grid gap-2 text-sm'>
                      <div className='grid grid-cols-2 gap-2'>
                        <div>
                          <div className='text-xs text-muted-foreground'>Phone</div>
                          <div className='font-semibold'>{tenant.phone_no ?? '—'}</div>
                        </div>
                        <div>
                          <div className='text-xs text-muted-foreground'>WhatsApp</div>
                          <div className='font-semibold'>{tenant.whatsapp_number ?? '—'}</div>
                        </div>
                      </div>
                      <div className='grid grid-cols-2 gap-2'>
                        <div>
                          <div className='text-xs text-muted-foreground'>Email</div>
                          <div className='font-semibold'>{tenant.email ?? '—'}</div>
                        </div>
                        <div>
                          <div className='text-xs text-muted-foreground'>Occupation</div>
                          <div className='font-semibold'>{tenant.occupation ?? '—'}</div>
                        </div>
                      </div>
                      {tenant.tenant_address ? (
                        <div>
                          <div className='text-xs text-muted-foreground'>Address</div>
                          <div className='font-semibold'>{tenant.tenant_address}</div>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='p-4'>
                    <div className='text-sm font-semibold'>Uploads</div>
                    <div className='mt-2 grid gap-3'>
                      <div>
                        <div className='text-xs text-muted-foreground'>Tenant Images</div>
                        {Array.isArray(tenant.images) && tenant.images.length ? (
                          <div className='mt-2 flex flex-wrap gap-3'>
                            {(tenant.images as string[]).map((url) => (
                              <div key={url} className='h-24 w-24 overflow-hidden rounded-md border bg-muted'>
                                <img src={url} alt='' className='h-full w-full object-cover' />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className='mt-1 text-xs text-muted-foreground'>No images</div>
                        )}
                      </div>

                      <div>
                        <div className='text-xs text-muted-foreground'>Proof Documents</div>
                        {Array.isArray(tenant.proof_documents) && tenant.proof_documents.length ? (
                          <div className='mt-2 flex flex-wrap gap-3'>
                            {(tenant.proof_documents as string[]).map((url) => (
                              <div key={url} className='h-24 w-24 overflow-hidden rounded-md border bg-muted'>
                                <img src={url} alt='' className='h-full w-full object-cover' />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className='mt-1 text-xs text-muted-foreground'>No documents</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='rent'>
              <div className='mt-4 grid gap-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='text-sm font-semibold'>Rent Payments</div>
                    <div className='text-xs text-muted-foreground'>History & collections</div>
                  </div>
                  <Button size='sm' onClick={() => setRentDialogOpen(true)} disabled={creatingRent}>
                    <Plus className='me-2 size-4' />
                    Add Rent
                  </Button>
                </div>

                <Card>
                  <CardContent className='p-4'>
                    {rentPayments.length === 0 ? (
                      <div className='text-sm text-muted-foreground'>No rent payments</div>
                    ) : (
                      <div className='grid gap-2'>
                        {rentPayments.map((p: RentPaymentItem) => (
                          <div key={String(p?.s_no ?? `${p?.payment_date}-${p?.amount_paid}`)} className='rounded-md border p-3'>
                            <div className='flex items-start justify-between gap-2'>
                              <div>
                                <div className='text-sm font-semibold'>₹{safeNum(p?.amount_paid)}</div>
                                <div className='mt-0.5 text-xs text-muted-foreground'>
                                  {toDateOnly(String(p?.payment_date ?? ''))}
                                  {p?.payment_method ? ` • ${String(p.payment_method)}` : ''}
                                  {p?.status ? ` • ${String(p.status)}` : ''}
                                </div>
                                {p?.remarks ? <div className='mt-1 text-xs text-muted-foreground'>{String(p.remarks)}</div> : null}
                              </div>
                              <Badge variant='outline'>#{String(p?.s_no ?? '')}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='advance'>
              <div className='mt-4 grid gap-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='text-sm font-semibold'>Advance Payments</div>
                    <div className='text-xs text-muted-foreground'>Security deposit / advance</div>
                  </div>
                  <Button size='sm' onClick={() => setAdvanceDialogOpen(true)} disabled={creatingAdvance}>
                    <Plus className='me-2 size-4' />
                    Add Advance
                  </Button>
                </div>

                <Card>
                  <CardContent className='p-4'>
                    {advancePayments.length === 0 ? (
                      <div className='text-sm text-muted-foreground'>No advance payments</div>
                    ) : (
                      <div className='grid gap-2'>
                        {advancePayments.map((p) => (
                          <div key={String(p.s_no)} className='rounded-md border p-3'>
                            <div className='flex items-start justify-between gap-2'>
                              <div>
                                <div className='text-sm font-semibold'>₹{safeNum(p.amount_paid)}</div>
                                <div className='mt-0.5 text-xs text-muted-foreground'>
                                  {toDateOnly(String(p.payment_date ?? ''))}
                                  {p.payment_method ? ` • ${String(p.payment_method)}` : ''}
                                  {p.status ? ` • ${String(p.status)}` : ''}
                                </div>
                                {p.remarks ? <div className='mt-1 text-xs text-muted-foreground'>{String(p.remarks)}</div> : null}
                              </div>
                              <Badge variant='outline'>#{p.s_no}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='refund'>
              <div className='mt-4 grid gap-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='text-sm font-semibold'>Refund Payments</div>
                    <div className='text-xs text-muted-foreground'>Refunds paid to tenant</div>
                  </div>
                  <Button size='sm' onClick={() => setRefundDialogOpen(true)} disabled={creatingRefund}>
                    <Plus className='me-2 size-4' />
                    Add Refund
                  </Button>
                </div>

                <Card>
                  <CardContent className='p-4'>
                    {refundPayments.length === 0 ? (
                      <div className='text-sm text-muted-foreground'>No refunds</div>
                    ) : (
                      <div className='grid gap-2'>
                        {refundPayments.map((p) => (
                          <div key={String(p.s_no)} className='rounded-md border p-3'>
                            <div className='flex items-start justify-between gap-2'>
                              <div>
                                <div className='text-sm font-semibold'>₹{safeNum(p.amount_paid)}</div>
                                <div className='mt-0.5 text-xs text-muted-foreground'>
                                  {toDateOnly(String(p.payment_date ?? ''))}
                                  {p.payment_method ? ` • ${String(p.payment_method)}` : ''}
                                  {p.status ? ` • ${String(p.status)}` : ''}
                                </div>
                                {p.remarks ? <div className='mt-1 text-xs text-muted-foreground'>{String(p.remarks)}</div> : null}
                              </div>
                              <Badge variant='outline'>#{p.s_no}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className='font-semibold'>{tenant?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AppDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        title='Checkout Tenant'
        description='Set checkout date for this tenant.'
        size='sm'
        footer={
          <div className='flex w-full justify-end gap-2 px-3 pb-3'>
            <Button type='button' variant='outline' onClick={() => setCheckoutOpen(false)} disabled={checkingOut}>
              Cancel
            </Button>
            <Button type='button' onClick={() => void confirmCheckout()} disabled={checkingOut}>
              {checkingOut ? 'Saving...' : 'Confirm'}
            </Button>
          </div>
        }
      >
        <div className='grid gap-2'>
          <div className='text-sm font-medium'>Checkout Date</div>
          <Input type='date' value={checkoutDate} onChange={(e) => setCheckoutDate(e.target.value)} />
        </div>
      </AppDialog>

      <AppDialog
        open={checkoutEditOpen}
        onOpenChange={setCheckoutEditOpen}
        title='Update Checkout'
        description='Update or clear checkout date.'
        size='sm'
        footer={
          <div className='flex w-full justify-end gap-2 px-3 pb-3'>
            <Button type='button' variant='outline' onClick={() => setCheckoutEditOpen(false)} disabled={updatingCheckout}>
              Cancel
            </Button>
            <Button type='button' onClick={() => void confirmUpdateCheckout()} disabled={updatingCheckout}>
              {updatingCheckout ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className='grid gap-3'>
          <div className='grid gap-2'>
            <div className='text-sm font-medium'>Checkout Date</div>
            <Input type='date' value={checkoutEditDate} onChange={(e) => setCheckoutEditDate(e.target.value)} disabled={clearCheckout} />
          </div>
          <button
            type='button'
            className='rounded-md border px-3 py-2 text-left text-sm'
            onClick={() => setClearCheckout((v) => !v)}
          >
            <div className='font-semibold'>Clear checkout date</div>
            <div className='text-xs text-muted-foreground'>{clearCheckout ? 'Enabled' : 'Disabled'}</div>
          </button>
        </div>
      </AppDialog>

      <AppDialog
        open={rentDialogOpen}
        onOpenChange={setRentDialogOpen}
        title='Add Rent Payment'
        description='Record a rent payment for this tenant.'
        size='md'
        footer={
          <div className='flex w-full justify-end gap-2 px-3 pb-3'>
            <Button type='button' variant='outline' onClick={() => setRentDialogOpen(false)} disabled={creatingRent}>
              Cancel
            </Button>
            <Button type='button' onClick={() => void submitRent()} disabled={creatingRent}>
              {creatingRent ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className='grid gap-3'>
          {rentFormError ? <div className='text-xs font-semibold text-destructive'>{rentFormError}</div> : null}

          <div className='rounded-md border bg-card p-3'>
            <div className='flex items-center justify-between gap-2'>
              <div className='text-sm font-semibold'>Rent Period</div>
              <Button type='button' variant='outline' size='sm' onClick={() => void skipGapsAndUseNextPeriod()} disabled={rentLoadingGaps}>
                {rentLoadingGaps ? 'Loading...' : 'Next Period'}
              </Button>
            </div>

            {rentGaps.length > 0 ? (
              <div className='mt-3 grid gap-2'>
                <div className='text-xs text-muted-foreground'>Missing periods</div>
                <div className='flex flex-wrap gap-2'>
                  {rentGaps.map((g) => {
                    const id = g.gapId ?? `${g.gapStart}-${g.gapEnd}`
                    const selected = rentSelectedGapId === id
                    return (
                      <Button
                        key={String(id)}
                        type='button'
                        size='sm'
                        variant={selected ? 'default' : 'outline'}
                        onClick={() => selectRentGap(g)}
                        disabled={rentLoadingGaps}
                      >
                        {formatGapLabel(g.gapStart, g.gapEnd)}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className='mt-2 text-xs text-muted-foreground'>{rentLoadingGaps ? 'Loading periods...' : 'No gaps found.'}</div>
            )}
          </div>

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Start Date</div>
              <Input value={rentStartDate} disabled />
            </div>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>End Date</div>
              <Input value={rentEndDate} disabled />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Amount Paid</div>
              <Input value={rentAmountPaid} onChange={(e) => setRentAmountPaid(e.target.value)} placeholder='e.g. 8000' />
            </div>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Actual Rent Amount</div>
              <Input value={rentActualAmount} onChange={(e) => setRentActualAmount(e.target.value)} placeholder='e.g. 9000' />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Payment Date</div>
              <Input type='date' value={rentPaymentDate} onChange={(e) => setRentPaymentDate(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Payment Method</div>
              <Select
                value={rentPaymentMethod}
                onValueChange={(v) => {
                  if (isPaymentMethod(v)) setRentPaymentMethod(v)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select method' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='GPAY'>GPay</SelectItem>
                  <SelectItem value='PHONEPE'>PhonePe</SelectItem>
                  <SelectItem value='CASH'>Cash</SelectItem>
                  <SelectItem value='BANK_TRANSFER'>Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground'>
            Payment status is auto calculated from amount paid vs rent amount.
          </div>

          <div className='grid gap-2'>
            <div className='text-sm font-medium'>Remarks (optional)</div>
            <Input value={rentRemarks} onChange={(e) => setRentRemarks(e.target.value)} placeholder='Remarks' />
          </div>
        </div>
      </AppDialog>

      <AppDialog
        open={advanceDialogOpen}
        onOpenChange={setAdvanceDialogOpen}
        title='Add Advance Payment'
        description='Record an advance/security payment.'
        size='md'
        footer={
          <div className='flex w-full justify-end gap-2 px-3 pb-3'>
            <Button type='button' variant='outline' onClick={() => setAdvanceDialogOpen(false)} disabled={creatingAdvance}>
              Cancel
            </Button>
            <Button type='button' onClick={() => void submitAdvance()} disabled={creatingAdvance}>
              {creatingAdvance ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className='grid gap-3'>
          <div className='grid gap-2'>
            <div className='text-sm font-medium'>Amount</div>
            <Input value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder='e.g. 5000' />
          </div>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Payment Date</div>
              <Input type='date' value={advancePaymentDate} onChange={(e) => setAdvancePaymentDate(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Payment Method</div>
              <Input value={advancePaymentMethod} onChange={(e) => setAdvancePaymentMethod(e.target.value)} placeholder='CASH / GPAY ...' />
            </div>
          </div>
          <div className='grid gap-2'>
            <div className='text-sm font-medium'>Remarks (optional)</div>
            <Input value={advanceRemarks} onChange={(e) => setAdvanceRemarks(e.target.value)} placeholder='Remarks' />
          </div>
        </div>
      </AppDialog>

      <AppDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        title='Add Refund Payment'
        description='Record a refund payment to tenant.'
        size='md'
        footer={
          <div className='flex w-full justify-end gap-2 px-3 pb-3'>
            <Button type='button' variant='outline' onClick={() => setRefundDialogOpen(false)} disabled={creatingRefund}>
              Cancel
            </Button>
            <Button type='button' onClick={() => void submitRefund()} disabled={creatingRefund}>
              {creatingRefund ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className='grid gap-3'>
          <div className='grid gap-2'>
            <div className='text-sm font-medium'>Amount</div>
            <Input value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder='e.g. 3000' />
          </div>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Payment Date</div>
              <Input type='date' value={refundPaymentDate} onChange={(e) => setRefundPaymentDate(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Payment Method</div>
              <Select
                value={refundPaymentMethod}
                onValueChange={(v) => {
                  if (isPaymentMethod(v)) setRefundPaymentMethod(v)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select method' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='GPAY'>GPay</SelectItem>
                  <SelectItem value='PHONEPE'>PhonePe</SelectItem>
                  <SelectItem value='CASH'>Cash</SelectItem>
                  <SelectItem value='BANK_TRANSFER'>Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='grid gap-2'>
            <div className='text-sm font-medium'>Remarks (optional)</div>
            <Input value={refundRemarks} onChange={(e) => setRefundRemarks(e.target.value)} placeholder='Remarks' />
          </div>
        </div>
      </AppDialog>
    </div>
  )
}
