import { useMemo, useState } from 'react'
import {
  useCreateAdvancePaymentMutation,
  useCreateRefundPaymentMutation,
  useGetRefundPaymentsQuery,
  useVoidTenantPaymentMutation,
  type AdvancePayment,
  type RefundPayment,
} from '@/services/paymentsApi'
import {
  useCheckoutTenantWithDateMutation,
  useDeleteTenantMutation,
  useGetTenantByIdQuery,
  useUpdateTenantCheckoutDateMutation,
  type Tenant,
  type TenantResponse,
} from '@/services/tenantsApi'
import { useAppSelector } from '@/store/hooks'
import {
  CircleAlert,
  Edit,
  Plus,
  Trash2,
  User,
  Calendar,
  CreditCard,
  Home,
  Bed,
  MapPin,
  DollarSign,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppDialog } from '@/components/form/app-dialog'
import { AdvancePaymentDialog } from './AdvancePaymentDialog'
import { RentPaymentDialog } from './RentPaymentDialog'

type ErrorLike = {
  data?: {
    message?: string
  }
  message?: string
}

type PaymentCycleSummary = {
  cycle_id: number
  start_date: string
  end_date: string
  days: number
  cycle_type: string
  payments?: Array<{
    s_no: number
    payment_date: string
    amount_paid: string
    actual_rent_amount: string
    cycle_id: number
    payment_method: string
    status: string
    remarks: string
  }>
  totalPaid: number
  due: number
  remainingDue: number
  status: string
  expected_from_allocations: number
  due_from_payments: number
}

type UnpaidMonth = {
  month_name?: string
  cycle_start?: string
  cycle_end?: string
}

type PaymentMethod = 'GPAY' | 'PHONEPE' | 'CASH' | 'BANK_TRANSFER'

const isPaymentMethod = (v: string): v is PaymentMethod => {
  return (
    v === 'GPAY' || v === 'PHONEPE' || v === 'CASH' || v === 'BANK_TRANSFER'
  )
}

const asArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : []

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

  const selectedPGLocationId = useAppSelector(
    (s) => s.pgLocations.selectedPGLocationId
  )

  const {
    data: tenantResponse,
    isLoading,
    error,
    refetch,
  } = useGetTenantByIdQuery(Number.isFinite(tenantId) ? tenantId : 0, {
    skip: !Number.isFinite(tenantId) || tenantId <= 0,
  })

  const tenant: Tenant | null =
    (tenantResponse as TenantResponse | undefined)?.data ?? null

  const [deleteTenant, { isLoading: deleting }] = useDeleteTenantMutation()
  const [checkoutTenantWithDate, { isLoading: checkingOut }] =
    useCheckoutTenantWithDateMutation()
  const [updateTenantCheckoutDate, { isLoading: updatingCheckout }] =
    useUpdateTenantCheckoutDateMutation()

  const [createAdvancePayment, { isLoading: creatingAdvance }] =
    useCreateAdvancePaymentMutation()
  const [createRefundPayment, { isLoading: creatingRefund }] =
    useCreateRefundPaymentMutation()
  const [voidRentPayment, { isLoading: voidingRent }] =
    useVoidTenantPaymentMutation()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutDate, setCheckoutDate] = useState(
    () => new Date().toISOString().split('T')[0]
  )

  const [checkoutEditOpen, setCheckoutEditOpen] = useState(false)
  const [checkoutEditDate, setCheckoutEditDate] = useState('')
  const [clearCheckout, setClearCheckout] = useState(false)

  const [rentDialogOpen, setRentDialogOpen] = useState(false)

  const [deleteRentDialogOpen, setDeleteRentDialogOpen] = useState(false)
  const [rentToDelete, setRentToDelete] = useState<{
    id: number
    amount: string
    date: string
  } | null>(null)

  const [deleteAdvanceDialogOpen, setDeleteAdvanceDialogOpen] = useState(false)
  const [advanceToDelete, setAdvanceToDelete] = useState<{
    id: number
    amount: string
    date: string
  } | null>(null)

  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false)

  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundPaymentDate, setRefundPaymentDate] = useState(
    () => new Date().toISOString().split('T')[0]
  )
  const [refundPaymentMethod, setRefundPaymentMethod] =
    useState<PaymentMethod>('CASH')
  const [refundRemarks, setRefundRemarks] = useState('')

  const fetchErrorMessage =
    (error as ErrorLike | undefined)?.data?.message ||
    (error as ErrorLike | undefined)?.message

  const roomLabel = useMemo(() => {
    const roomNo = tenant?.rooms?.room_no
    const bedNo = tenant?.beds?.bed_no
    if (roomNo && bedNo) return `Room ${roomNo} • Bed ${bedNo}`
    if (roomNo) return `Room ${roomNo}`
    return tenant?.room_id ? `Room #${tenant.room_id}` : ''
  }, [tenant])

  const unpaidMonths = useMemo(() => {
    return asArray<UnpaidMonth>(
      (tenant as unknown as { unpaid_months?: unknown } | null)?.unpaid_months
    )
  }, [tenant])

  const rentDueAmount = safeNum(tenant?.rent_due_amount)
  const partialDueAmount = safeNum(tenant?.partial_due_amount)
  const pendingDueAmount = safeNum(tenant?.pending_due_amount)
  const hasOutstandingAmount = rentDueAmount > 0
  const isRentPartial = Boolean(tenant?.is_rent_partial)
  const isRentPaid = Boolean(tenant?.is_rent_paid)
  const hasPendingRent = pendingDueAmount > 0 || unpaidMonths.length > 0
  const hasBothPartialAndPending = partialDueAmount > 0 && pendingDueAmount > 0

  const advancePayments = useMemo(
    () => asArray<AdvancePayment>((tenant as any)?.advance_payments),
    [tenant]
  )

  const isAdvancePaid = advancePayments.length > 0

  const paymentStatusBadges = useMemo(() => {
    const badges: Array<{ key: string; label: string; className: string }> = []
    if (isRentPaid)
      badges.push({
        key: 'rent_paid',
        label: 'Rent PAID',
        className: 'bg-emerald-500 text-white',
      })
    if (isAdvancePaid)
      badges.push({
        key: 'adv_paid',
        label: 'Advance Paid',
        className: 'bg-emerald-500 text-white',
      })
    if (isRentPartial)
      badges.push({
        key: 'partial',
        label: 'PARTIAL',
        className: 'bg-orange-500 text-white',
      })
    if (hasPendingRent)
      badges.push({
        key: 'pending',
        label: 'PENDING RENT',
        className: 'bg-amber-500 text-white',
      })
    if (hasOutstandingAmount)
      badges.push({
        key: 'due',
        label: `₹${rentDueAmount} DUE`,
        className: 'bg-red-500 text-white',
      })
    if (!isAdvancePaid)
      badges.push({
        key: 'no_adv',
        label: 'NO ADVANCE',
        className: 'bg-amber-500 text-white',
      })
    return badges
  }, [
    hasOutstandingAmount,
    hasPendingRent,
    isAdvancePaid,
    isRentPaid,
    isRentPartial,
    rentDueAmount,
  ])

  const { data: refundPaymentsResponse } = useGetRefundPaymentsQuery(
    tenant?.s_no ? { tenant_id: tenant.s_no, limit: 50 } : undefined,
    { skip: !tenant?.s_no }
  )
  const refundPayments = useMemo(
    () =>
      asArray<RefundPayment>(
        (refundPaymentsResponse as { data?: unknown } | undefined)?.data
      ),
    [refundPaymentsResponse]
  )

  const dueLabel = useMemo(() => {
    const due =
      typeof tenant?.pending_due_amount === 'number'
        ? tenant.pending_due_amount
        : typeof tenant?.rent_due_amount === 'number'
          ? tenant.rent_due_amount
          : undefined

    return typeof due === 'number' && due > 0
      ? `Pending ₹${Math.round(due)}`
      : ''
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

  const confirmDeleteRentPayment = async () => {
    if (!rentToDelete) return
    try {
      await voidRentPayment({
        id: rentToDelete.id,
        voided_reason: 'Cancelled by user',
      }).unwrap()
      showSuccessAlert('Rent payment cancelled successfully')
      setDeleteRentDialogOpen(false)
      setRentToDelete(null)
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Cancel Error')
    }
  }

  const handleDeleteRentPayment = (payment: {
    s_no: number
    amount_paid: string
    payment_date: string
  }) => {
    setRentToDelete({
      id: payment.s_no,
      amount: payment.amount_paid,
      date: toDateOnly(payment.payment_date),
    })
    setDeleteRentDialogOpen(true)
  }

  const confirmDeleteAdvancePayment = async () => {
    if (!advanceToDelete) return
    try {
      // TODO: Add advance payment delete API call when available
      showSuccessAlert('Advance payment deleted successfully')
      setDeleteAdvanceDialogOpen(false)
      setAdvanceToDelete(null)
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const handleDeleteAdvancePayment = (payment: {
    s_no: number
    amount_paid: number | string
    payment_date: string
  }) => {
    setAdvanceToDelete({
      id: payment.s_no,
      amount: String(payment.amount_paid),
      date: toDateOnly(payment.payment_date),
    })
    setDeleteAdvanceDialogOpen(true)
  }

  const confirmUpdateCheckout = async () => {
    if (!tenant) return
    try {
      await updateTenantCheckoutDate({
        id: tenant.s_no,
        check_out_date: clearCheckout
          ? undefined
          : checkoutEditDate || undefined,
        clear_checkout: clearCheckout ? true : undefined,
      }).unwrap()
      showSuccessAlert(clearCheckout ? 'Checkout cleared' : 'Checkout updated')
      setCheckoutEditOpen(false)
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Update Error')
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
      await checkoutTenantWithDate({
        id: tenant.s_no,
        check_out_date: checkoutDate,
      }).unwrap()
      showSuccessAlert('Tenant checked out successfully')
      setCheckoutOpen(false)
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Checkout Error')
    }
  }

  return (
    <div className='container mx-auto max-w-6xl px-4 py-6'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between border-b pb-4'>
        <div>
          <h1 className='text-2xl font-bold'>
            {tenant?.name ? tenant.name : 'Tenant Details'}
          </h1>
          <p className='text-sm text-muted-foreground'>
            {roomLabel || 'Loading room info...'}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {tenant?.s_no ? (
            <Badge variant='outline'>#{tenant.s_no}</Badge>
          ) : null}
          {tenant && (
            <div className='ml-2 flex items-center gap-1'>
              <Button
                asChild
                size='icon'
                className='h-8 w-8 bg-black text-white hover:bg-black/90'
                title='Edit Tenant'
                aria-label='Edit Tenant'
              >
                <Link to={`/tenants/${tenant.s_no}/edit`}>
                  <Edit className='size-4' />
                </Link>
              </Button>
              <Button
                variant='destructive'
                size='icon'
                onClick={() => setDeleteOpen(true)}
                className='h-8 w-8'
                title='Delete Tenant'
                aria-label='Delete Tenant'
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
          )}
        </div>
      </div>

      {fetchErrorMessage ? (
        <div className='mt-4'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load tenant</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {isLoading ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>
          Loading...
        </div>
      ) : !tenant ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>Tenant not found</div>
          <div className='mt-1 text-xs text-muted-foreground'>
            Please check the tenant id and try again.
          </div>
        </div>
      ) : !selectedPGLocationId ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>Select a PG Location</div>
          <div className='mt-1 text-xs text-muted-foreground'>
            Choose a PG from the top bar to manage tenants.
          </div>
        </div>
      ) : (
        <div className='grid gap-6'>
          {/* Tenant Information Card */}
          <Card>
            <CardContent className='p-6'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='flex size-12 items-center justify-center rounded-lg bg-black text-white'>
                    <User className='size-6' />
                  </div>
                  <div>
                    <h2 className='text-xl font-semibold'>{tenant.name}</h2>
                    <p className='text-sm text-muted-foreground'>
                      {tenant.phone_no
                        ? `Phone: ${tenant.phone_no}`
                        : 'No phone number'}
                      {tenant.email ? `  ${tenant.email}` : ''}
                      {dueLabel ? `  ${dueLabel}` : ''}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <Badge
                    variant={
                      tenant.status === 'ACTIVE' ? 'secondary' : 'outline'
                    }
                    className='text-sm'
                  >
                    {tenant.status}
                  </Badge>
                </div>
              </div>

              <div className='mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4'>
                <div>
                  <div className='text-sm text-muted-foreground'>Status</div>
                  <div className='text-lg font-semibold'>{tenant.status}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Check-in</div>
                  <div className='text-lg font-semibold'>
                    {String(tenant.check_in_date).split('T')[0]}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Room</div>
                  <div className='text-lg font-semibold'>
                    {tenant.rooms?.room_no || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>
                    PG Location
                  </div>
                  <div className='text-lg font-semibold'>
                    {tenant.pg_locations?.location_name || 'N/A'}
                  </div>
                </div>
              </div>

              <div className='mt-6'>
                <div className='mb-3 text-sm font-semibold'>Actions</div>
                <div className='flex flex-wrap gap-2'>
                  <Button
                    type='button'
                    size='sm'
                    onClick={() => setCheckoutOpen(true)}
                    disabled={tenant.status === 'CHECKED_OUT' || checkingOut}
                    className='bg-black text-white hover:bg-black/90'
                  >
                    {tenant.status === 'CHECKED_OUT'
                      ? 'Checked Out'
                      : checkingOut
                        ? 'Checking out...'
                        : 'Checkout'}
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      setCheckoutEditDate(
                        toDateOnly(tenant.check_out_date) || ''
                      )
                      setClearCheckout(false)
                      setCheckoutEditOpen(true)
                    }}
                    disabled={updatingCheckout}
                  >
                    Update Checkout
                  </Button>
                </div>
              </div>

              <div className='mt-6'>
                <div className='mb-3 text-sm font-semibold'>Payment Status</div>
                <div className='flex flex-wrap items-center gap-2'>
                  {paymentStatusBadges.map((b) => (
                    <span
                      key={b.key}
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${b.className}`}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>

              {hasOutstandingAmount ? (
                <div
                  className={`mt-6 rounded-lg border ${isRentPartial ? 'border-orange-200 bg-orange-50' : 'border-amber-200 bg-amber-50'} p-4`}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0 flex-1'>
                      <div
                        className={`text-sm font-bold ${isRentPartial ? 'text-orange-600' : 'text-amber-700'}`}
                      >
                        {hasBothPartialAndPending
                          ? 'Partial + Pending'
                          : isRentPartial
                            ? 'Partial Payment'
                            : 'Pending Payment'}
                      </div>
                      <div className='mt-1 text-sm text-muted-foreground'>
                        Due ₹${rentDueAmount}
                        {unpaidMonths.length > 0
                          ? `  ${unpaidMonths.length} month(s)`
                          : ''}
                        {!isAdvancePaid ? '  No advance' : ''}
                      </div>
                      {hasBothPartialAndPending ? (
                        <div className='mt-2 text-sm text-muted-foreground'>
                          Partial: ₹${partialDueAmount} Pending: ₹$
                          {pendingDueAmount}
                        </div>
                      ) : null}
                      {unpaidMonths.length > 0 ? (
                        <div className='mt-3'>
                          <div
                            className={`text-sm font-bold ${isRentPartial ? 'text-orange-600' : 'text-amber-700'}`}
                          >
                            Unpaid months
                          </div>
                          {unpaidMonths.slice(0, 2).map((m, idx) => (
                            <div
                              key={String(idx)}
                              className='mt-1 text-xs text-muted-foreground'
                            >
                              {m.month_name ? m.month_name : 'Month'}
                              {m.cycle_start && m.cycle_end
                                ? ` (${m.cycle_start} to ${m.cycle_end})`
                                : ''}
                            </div>
                          ))}
                          {unpaidMonths.length > 2 ? (
                            <div className='mt-1 text-xs text-muted-foreground'>
                              +{unpaidMonths.length - 2} more
                            </div>
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
                          <div className='text-xs text-muted-foreground'>
                            PG
                          </div>
                          <div className='font-semibold'>
                            {tenant.pg_locations?.location_name ??
                              `#${tenant.pg_id}`}
                          </div>
                        </div>
                        <div>
                          <div className='text-xs text-muted-foreground'>
                            Room
                          </div>
                          <div className='font-semibold'>
                            {tenant.rooms?.room_no ??
                              (tenant.room_id ? `#${tenant.room_id}` : '—')}
                          </div>
                        </div>
                      </div>
                      <div className='grid grid-cols-2 gap-2'>
                        <div>
                          <div className='text-xs text-muted-foreground'>
                            Bed
                          </div>
                          <div className='font-semibold'>
                            {tenant.beds?.bed_no ??
                              (tenant.bed_id ? `#${tenant.bed_id}` : '—')}
                          </div>
                        </div>
                        <div>
                          <div className='text-xs text-muted-foreground'>
                            Rent
                          </div>
                          <div className='font-semibold'>
                            {typeof tenant.rooms?.rent_price === 'number'
                              ? `₹${tenant.rooms.rent_price}/mo`
                              : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='p-4'>
                    <div className='text-sm font-semibold'>
                      Personal Information
                    </div>
                    <div className='mt-2 grid gap-2 text-sm'>
                      <div className='grid grid-cols-2 gap-2'>
                        <div>
                          <div className='text-xs text-muted-foreground'>
                            Phone
                          </div>
                          <div className='font-semibold'>
                            {tenant.phone_no ?? '—'}
                          </div>
                        </div>
                        <div>
                          <div className='text-xs text-muted-foreground'>
                            WhatsApp
                          </div>
                          <div className='font-semibold'>
                            {tenant.whatsapp_number ?? '—'}
                          </div>
                        </div>
                      </div>
                      <div className='grid grid-cols-2 gap-2'>
                        <div>
                          <div className='text-xs text-muted-foreground'>
                            Email
                          </div>
                          <div className='font-semibold'>
                            {tenant.email ?? '—'}
                          </div>
                        </div>
                        <div>
                          <div className='text-xs text-muted-foreground'>
                            Occupation
                          </div>
                          <div className='font-semibold'>
                            {tenant.occupation ?? '—'}
                          </div>
                        </div>
                      </div>
                      {tenant.tenant_address ? (
                        <div>
                          <div className='text-xs text-muted-foreground'>
                            Address
                          </div>
                          <div className='font-semibold'>
                            {tenant.tenant_address}
                          </div>
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
                        <div className='text-xs text-muted-foreground'>
                          Tenant Images
                        </div>
                        {Array.isArray(tenant.images) &&
                        tenant.images.length ? (
                          <div className='mt-2 flex flex-wrap gap-3'>
                            {(tenant.images as string[]).map((url) => (
                              <div
                                key={url}
                                className='h-24 w-24 overflow-hidden rounded-md border bg-muted'
                              >
                                <img
                                  src={url}
                                  alt=''
                                  className='h-full w-full object-cover'
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className='mt-1 text-xs text-muted-foreground'>
                            No images
                          </div>
                        )}
                      </div>

                      <div>
                        <div className='text-xs text-muted-foreground'>
                          Proof Documents
                        </div>
                        {Array.isArray(tenant.proof_documents) &&
                        tenant.proof_documents.length ? (
                          <div className='mt-2 flex flex-wrap gap-3'>
                            {(tenant.proof_documents as string[]).map((url) => (
                              <div
                                key={url}
                                className='h-24 w-24 overflow-hidden rounded-md border bg-muted'
                              >
                                <img
                                  src={url}
                                  alt=''
                                  className='h-full w-full object-cover'
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className='mt-1 text-xs text-muted-foreground'>
                            No documents
                          </div>
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
                    <div className='text-sm font-semibold'>
                      Rent Payment Cycles
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Detailed payment history by cycle
                    </div>
                  </div>
                  <Button size='sm' onClick={() => setRentDialogOpen(true)}>
                    <Plus className='me-2 size-4' />
                    Add Rent
                  </Button>
                </div>

                {/* Payment Cycle Summaries */}
                {(tenant as any)?.payment_cycle_summaries &&
                (tenant as any).payment_cycle_summaries.length > 0 ? (
                  <div className='grid gap-4'>
                    {(tenant as any).payment_cycle_summaries.map(
                      (cycle: PaymentCycleSummary) => (
                        <Card key={cycle.cycle_id}>
                          <CardContent className='p-4'>
                            <div className='mb-4 flex items-start justify-between'>
                              <div>
                                <div className='text-sm font-semibold'>
                                  {toDateOnly(cycle.start_date)} -{' '}
                                  {toDateOnly(cycle.end_date)}
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                  {cycle.days} days {cycle.cycle_type}
                                </div>
                              </div>
                              <Badge
                                variant={
                                  cycle.status === 'PAID'
                                    ? 'default'
                                    : cycle.status === 'PARTIAL'
                                      ? 'secondary'
                                      : 'outline'
                                }
                                className='text-xs'
                              >
                                {cycle.status}
                              </Badge>
                            </div>

                            <div className='mb-4 grid grid-cols-2 gap-4 md:grid-cols-4'>
                              <div>
                                <div className='text-xs text-muted-foreground'>
                                  Expected Rent
                                </div>
                                <div className='text-sm font-semibold'>
                                  ₹${cycle.due}
                                </div>
                              </div>
                              <div>
                                <div className='text-xs text-muted-foreground'>
                                  Total Paid
                                </div>
                                <div className='text-sm font-semibold'>
                                  ₹${cycle.totalPaid}
                                </div>
                              </div>
                              <div>
                                <div className='text-xs text-muted-foreground'>
                                  Remaining Due
                                </div>
                                <div
                                  className={`text-sm font-semibold ${(cycle.remainingDue || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}
                                >
                                  ₹${cycle.remainingDue || 0}
                                </div>
                              </div>
                              <div>
                                <div className='text-xs text-muted-foreground'>
                                  From Allocations
                                </div>
                                <div className='text-sm font-semibold'>
                                  ₹${cycle.expected_from_allocations}
                                </div>
                              </div>
                            </div>

                            {/* Individual Payments for this Cycle */}
                            {cycle.payments && cycle.payments.length > 0 && (
                              <div>
                                <div className='mb-2 text-sm font-medium'>
                                  Payments in this cycle
                                </div>
                                <div className='grid gap-2'>
                                  {cycle.payments.map((payment) => (
                                    <div
                                      key={payment.s_no}
                                      className='rounded-md border bg-muted/30 p-4'
                                    >
                                      <div className='flex items-start justify-between gap-4'>
                                        <div className='flex-1'>
                                          <div className='flex items-center gap-3'>
                                            <div className='text-lg font-semibold'>
                                              ₹${payment.amount_paid}
                                            </div>
                                            <Badge
                                              variant={
                                                payment.status === 'PAID'
                                                  ? 'default'
                                                  : 'secondary'
                                              }
                                              className='text-xs'
                                            >
                                              {payment.status}
                                            </Badge>
                                          </div>

                                          <div className='mt-2 space-y-1'>
                                            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                                              <span className='flex items-center gap-1'>
                                                <Calendar className='h-3 w-3' />
                                                {toDateOnly(
                                                  payment.payment_date
                                                )}
                                              </span>
                                              <span className='flex items-center gap-1'>
                                                <CreditCard className='h-3 w-3' />
                                                {payment.payment_method}
                                              </span>
                                            </div>

                                            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                                              <span className='flex items-center gap-1'>
                                                <Home className='h-3 w-3' />
                                                Room{' '}
                                                {(payment as any).rooms
                                                  ?.room_no || 'N/A'}
                                              </span>
                                              <span className='flex items-center gap-1'>
                                                <Bed className='h-3 w-3' />
                                                Bed{' '}
                                                {(payment as any).beds
                                                  ?.bed_no || 'N/A'}
                                              </span>
                                            </div>

                                            <div className='text-sm text-muted-foreground'>
                                              <span className='flex items-center gap-1'>
                                                <MapPin className='h-3 w-3' />
                                                {(payment as any).pg_locations
                                                  ?.location_name || 'N/A'}
                                              </span>
                                            </div>

                                            {(payment as any)
                                              .actual_rent_amount && (
                                              <div className='text-sm text-muted-foreground'>
                                                <span className='flex items-center gap-1'>
                                                  <DollarSign className='h-3 w-3' />
                                                  Actual Rent: ₹$
                                                  {safeNum(
                                                    (payment as any)
                                                      .actual_rent_amount
                                                  )}
                                                </span>
                                              </div>
                                            )}

                                            {(payment as any)
                                              .tenant_rent_cycles && (
                                              <div className='text-sm text-muted-foreground'>
                                                <span className='flex items-center gap-1'>
                                                  <Calendar className='h-3 w-3' />
                                                  Cycle:{' '}
                                                  {toDateOnly(
                                                    (payment as any)
                                                      .tenant_rent_cycles
                                                      .cycle_start
                                                  )}{' '}
                                                  -{' '}
                                                  {toDateOnly(
                                                    (payment as any)
                                                      .tenant_rent_cycles
                                                      .cycle_end
                                                  )}
                                                </span>
                                              </div>
                                            )}
                                          </div>

                                          {payment.remarks && (
                                            <div className='mt-2 rounded border bg-background p-2'>
                                              <div className='mb-1 text-xs text-muted-foreground'>
                                                Remarks
                                              </div>
                                              <div className='text-sm'>
                                                {payment.remarks}
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        <div className='flex flex-col items-end gap-2'>
                                          <Badge
                                            variant='outline'
                                            className='text-xs'
                                          >
                                            #{payment.s_no}
                                          </Badge>
                                          <Button
                                            size='icon'
                                            variant='ghost'
                                            className='h-6 w-6 text-red-600 hover:bg-red-50 hover:text-red-700'
                                            onClick={() =>
                                              handleDeleteRentPayment(payment)
                                            }
                                            title='Cancel Payment'
                                          >
                                            <Trash2 className='h-3 w-3' />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(cycle.remainingDue || 0) > 0 && (
                              <div className='mt-3 rounded-md border border-amber-200 bg-amber-50 p-3'>
                                <div className='text-sm font-medium text-amber-800'>
                                  Outstanding: ₹${cycle.remainingDue}
                                </div>
                                <div className='mt-1 text-xs text-amber-600'>
                                  Click "Add Rent" to record payment for this
                                  cycle
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className='p-4'>
                      <div className='text-sm text-muted-foreground'>
                        No payment cycles found
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Rent Summary Stats */}
                {tenant && (
                  <Card>
                    <CardContent className='p-4'>
                      <div className='mb-3 text-sm font-semibold'>
                        Rent Summary
                      </div>
                      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                        <div>
                          <div className='text-xs text-muted-foreground'>
                            Total Paid
                          </div>
                          <div className='text-sm font-semibold text-green-600'>
                            $
                            {tenant.rent_payments?.reduce(
                              (sum, p) => sum + Number(p.amount_paid),
                              0
                            ) || 0}
                          </div>
                        </div>
                        <div>
                          <div className='text-xs text-muted-foreground'>
                            Current Status
                          </div>
                          <div className='text-sm font-semibold'>
                            {(tenant as any).payment_status || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className='text-xs text-muted-foreground'>
                            Total Payments
                          </div>
                          <div className='text-sm font-semibold'>
                            {tenant.rent_payments?.length || 0}
                          </div>
                        </div>
                        <div>
                          <div className='text-xs text-muted-foreground'>
                            Pending Months
                          </div>
                          <div className='text-sm font-semibold text-red-600'>
                            {tenant.pending_months || 0}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value='advance'>
              <div className='mt-4 grid gap-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='text-sm font-semibold'>
                      Advance Payments
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Security deposit / advance
                    </div>
                  </div>
                  <Button
                    size='sm'
                    onClick={() => setAdvanceDialogOpen(true)}
                    disabled={creatingAdvance}
                  >
                    <Plus className='me-2 size-4' />
                    Add Advance
                  </Button>
                </div>

                <Card>
                  <CardContent className='p-4'>
                    {advancePayments.length === 0 ? (
                      <div className='text-sm text-muted-foreground'>
                        No advance payments
                      </div>
                    ) : (
                      <div className='grid gap-2'>
                        {advancePayments.map((p) => (
                          <div
                            key={String(p.s_no)}
                            className='rounded-md border bg-muted/30 p-4'
                          >
                            <div className='flex items-start justify-between gap-4'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-3'>
                                  <div className='text-lg font-semibold'>
                                    ₹${safeNum(p.amount_paid)}
                                  </div>
                                  <Badge
                                    variant={
                                      p.status === 'PAID'
                                        ? 'default'
                                        : 'secondary'
                                    }
                                    className='text-xs'
                                  >
                                    {String(p.status)}
                                  </Badge>
                                </div>

                                <div className='mt-2 space-y-1'>
                                  <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                                    <span className='flex items-center gap-1'>
                                      <Calendar className='h-3 w-3' />
                                      {toDateOnly(String(p.payment_date ?? ''))}
                                    </span>
                                    <span className='flex items-center gap-1'>
                                      <CreditCard className='h-3 w-3' />
                                      {String(p.payment_method)}
                                    </span>
                                  </div>

                                  <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                                    <span className='flex items-center gap-1'>
                                      <Home className='h-3 w-3' />
                                      Room {(p as any).rooms?.room_no || 'N/A'}
                                    </span>
                                    <span className='flex items-center gap-1'>
                                      <Bed className='h-3 w-3' />
                                      Bed {(p as any).beds?.bed_no || 'N/A'}
                                    </span>
                                  </div>

                                  <div className='text-sm text-muted-foreground'>
                                    <span className='flex items-center gap-1'>
                                      <MapPin className='h-3 w-3' />
                                      {(p as any).pg_locations?.location_name ||
                                        'N/A'}
                                    </span>
                                  </div>

                                  {(p as any).actual_rent_amount && (
                                    <div className='text-sm text-muted-foreground'>
                                      <span className='flex items-center gap-1'>
                                        <DollarSign className='h-3 w-3' />
                                        Actual Rent: $
                                        {safeNum((p as any).actual_rent_amount)}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {p.remarks && (
                                  <div className='mt-2 rounded border bg-background p-2'>
                                    <div className='mb-1 text-xs text-muted-foreground'>
                                      Remarks
                                    </div>
                                    <div className='text-sm'>
                                      {String(p.remarks)}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className='flex flex-col items-end gap-2'>
                                <Badge variant='outline' className='text-xs'>
                                  #{p.s_no}
                                </Badge>
                                <Button
                                  size='icon'
                                  variant='ghost'
                                  className='h-6 w-6 text-red-600 hover:bg-red-50 hover:text-red-700'
                                  onClick={() => handleDeleteAdvancePayment(p)}
                                  title='Cancel Advance Payment'
                                >
                                  <Trash2 className='h-3 w-3' />
                                </Button>
                              </div>
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
                    <div className='text-xs text-muted-foreground'>
                      Refunds paid to tenant
                    </div>
                  </div>
                  <Button
                    size='sm'
                    onClick={() => setRefundDialogOpen(true)}
                    disabled={creatingRefund}
                  >
                    <Plus className='me-2 size-4' />
                    Add Refund
                  </Button>
                </div>

                <Card>
                  <CardContent className='p-4'>
                    {refundPayments.length === 0 ? (
                      <div className='text-sm text-muted-foreground'>
                        No refunds
                      </div>
                    ) : (
                      <div className='grid gap-2'>
                        {refundPayments.map((p) => (
                          <div
                            key={String(p.s_no)}
                            className='rounded-md border p-3'
                          >
                            <div className='flex items-start justify-between gap-2'>
                              <div>
                                <div className='text-sm font-semibold'>
                                  ₹{safeNum(p.amount_paid)}
                                </div>
                                <div className='mt-0.5 text-xs text-muted-foreground'>
                                  {toDateOnly(String(p.payment_date ?? ''))}
                                  {p.payment_method
                                    ? ` • ${String(p.payment_method)}`
                                    : ''}
                                  {p.status ? ` • ${String(p.status)}` : ''}
                                </div>
                                {p.remarks ? (
                                  <div className='mt-1 text-xs text-muted-foreground'>
                                    {String(p.remarks)}
                                  </div>
                                ) : null}
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
              Are you sure you want to delete{' '}
              <span className='font-semibold'>{tenant?.name}</span>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>
              Cancel
            </AlertDialogCancel>
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
            <Button
              type='button'
              variant='outline'
              onClick={() => setCheckoutOpen(false)}
              disabled={checkingOut}
            >
              Cancel
            </Button>
            <Button
              type='button'
              onClick={() => void confirmCheckout()}
              disabled={checkingOut}
            >
              {checkingOut ? 'Saving...' : 'Confirm'}
            </Button>
          </div>
        }
      >
        <div className='grid gap-2'>
          <div className='text-sm font-medium'>Checkout Date</div>
          <Input
            type='date'
            value={checkoutDate}
            onChange={(e) => setCheckoutDate(e.target.value)}
          />
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
            <Button
              type='button'
              variant='outline'
              onClick={() => setCheckoutEditOpen(false)}
              disabled={updatingCheckout}
            >
              Cancel
            </Button>
            <Button
              type='button'
              onClick={() => void confirmUpdateCheckout()}
              disabled={updatingCheckout}
            >
              {updatingCheckout ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className='grid gap-3'>
          <div className='grid gap-2'>
            <div className='text-sm font-medium'>Checkout Date</div>
            <Input
              type='date'
              value={checkoutEditDate}
              onChange={(e) => setCheckoutEditDate(e.target.value)}
              disabled={clearCheckout}
            />
          </div>
          <button
            type='button'
            className='rounded-md border px-3 py-2 text-left text-sm'
            onClick={() => setClearCheckout((v) => !v)}
          >
            <div className='font-semibold'>Clear checkout date</div>
            <div className='text-xs text-muted-foreground'>
              {clearCheckout ? 'Enabled' : 'Disabled'}
            </div>
          </button>
        </div>
      </AppDialog>

      {tenant && (
        <RentPaymentDialog
          open={rentDialogOpen}
          onOpenChange={setRentDialogOpen}
          tenant={{
            s_no: tenant.s_no,
            name: tenant.name,
            pg_id: tenant.pg_id,
            room_id: tenant.room_id || 0,
            bed_id: tenant.bed_id || 0,
            rooms: tenant.rooms,
          }}
          onSaved={() => {
            void refetch()
          }}
        />
      )}

      {tenant && (
        <AdvancePaymentDialog
          open={advanceDialogOpen}
          onOpenChange={setAdvanceDialogOpen}
          tenant={{
            s_no: tenant.s_no,
            name: tenant.name,
            pg_id: tenant.pg_id,
            room_id: tenant.room_id || 0,
            bed_id: tenant.bed_id || 0,
            rooms: tenant.rooms,
          }}
          onSaved={() => {
            void refetch()
          }}
        />
      )}

      <AppDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        title='Add Refund Payment'
        description='Record a refund payment to tenant.'
        size='md'
        footer={
          <div className='flex w-full justify-end gap-2 px-3 pb-3'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setRefundDialogOpen(false)}
              disabled={creatingRefund}
            >
              Cancel
            </Button>
            <Button
              type='button'
              onClick={() => void submitRefund()}
              disabled={creatingRefund}
            >
              {creatingRefund ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className='grid gap-3'>
          <div className='grid gap-2'>
            <div className='text-sm font-medium'>Amount</div>
            <Input
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder='e.g. 3000'
            />
          </div>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Payment Date</div>
              <Input
                type='date'
                value={refundPaymentDate}
                onChange={(e) => setRefundPaymentDate(e.target.value)}
              />
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
            <Input
              value={refundRemarks}
              onChange={(e) => setRefundRemarks(e.target.value)}
              placeholder='Remarks'
            />
          </div>
        </div>
      </AppDialog>

      {/* Cancel Rent Payment Confirmation Dialog */}
      <AlertDialog
        open={deleteRentDialogOpen}
        onOpenChange={setDeleteRentDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Rent Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this rent payment of $
              {rentToDelete?.amount} from {rentToDelete?.date}? This will void
              the payment with an audit trail and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={voidingRent}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDeleteRentPayment()}
              disabled={voidingRent}
              className='bg-red-600 hover:bg-red-700'
            >
              {voidingRent ? 'Cancelling...' : 'Cancel Payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Advance Payment Confirmation Dialog */}
      <AlertDialog
        open={deleteAdvanceDialogOpen}
        onOpenChange={setDeleteAdvanceDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Advance Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this advance payment of $
              {advanceToDelete?.amount} from {advanceToDelete?.date}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDeleteAdvancePayment()}
              className='bg-red-600 hover:bg-red-700'
            >
              Delete Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
