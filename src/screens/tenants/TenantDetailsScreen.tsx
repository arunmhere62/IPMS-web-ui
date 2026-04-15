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
  type PaymentCycleSummary,
  type Tenant,
  type TenantPayment,
} from '@/services/tenantsApi'
import {
  CircleAlert,
  Edit,
  Plus,
  Trash2,
  User,
  Calendar,
  MapPin,
  Phone,
  Home,
  Bed as BedIcon,
  FileText,
  Image as ImageIcon,
  CreditCard,
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
import { PageHeader } from '@/components/form/page-header'
import { AdvancePaymentDialog } from './AdvancePaymentDialog'
import { RentPaymentDialog } from './RentPaymentDialog'

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

  const {
    data: tenantResponse,
    isLoading,
    error,
    refetch,
  } = useGetTenantByIdQuery(tenantId, {
    skip: !tenantId || tenantId <= 0,
  })

  const tenant: Tenant | null =
    (tenantResponse?.data as Tenant | undefined) ?? null

  const [deleteTenant, { isLoading: deleting }] = useDeleteTenantMutation()
  const [checkoutTenantWithDate, { isLoading: checkingOut }] =
    useCheckoutTenantWithDateMutation()
  const [updateTenantCheckoutDate, { isLoading: updatingCheckout }] =
    useUpdateTenantCheckoutDateMutation()

  const [_createAdvancePayment] = useCreateAdvancePaymentMutation()
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

  const unpaidMonths = useMemo(() => {
    return asArray<UnpaidMonth>(
      (tenant as (Tenant & { unpaid_months?: unknown }) | null)?.unpaid_months
    )
  }, [tenant])

  const rentDueAmount = safeNum(tenant?.rent_due_amount)
  const partialDueAmount = safeNum(tenant?.partial_due_amount)
  const pendingDueAmount = safeNum(tenant?.pending_due_amount)
  const hasOutstandingAmount = rentDueAmount > 0
  const isRentPartial = Boolean(tenant?.is_rent_partial)
  const isRentPaid = Boolean(tenant?.is_rent_paid)
  const hasBothPartialAndPending = partialDueAmount > 0 && pendingDueAmount > 0

  const advancePayments = useMemo(
    () => asArray<AdvancePayment>(tenant?.advance_payments),
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
    if (!isRentPaid)
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
    () => asArray<RefundPayment>(refundPaymentsResponse?.data),
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

  const handleDeleteRentPayment = (payment: TenantPayment) => {
    setRentToDelete({
      id: payment.s_no,
      amount: String(payment.amount_paid),
      date: toDateOnly(payment.payment_date),
    })
    setDeleteRentDialogOpen(true)
  }

  const confirmDeleteAdvancePayment = async () => {
    if (!advanceToDelete) return
    try {
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
    <div className='min-h-screen'>
      <div className='px-3 py-2'>
        <PageHeader
          title={tenant?.name || 'Tenant Details'}
          right={
            <>
              {tenant?.s_no ? (
                <Badge variant='outline' className='px-1.5 py-0 text-[10px]'>
                  #{tenant.s_no}
                </Badge>
              ) : null}
              {tenant && (
                <>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7'
                    asChild
                  >
                    <Link to={`/tenants/${tenant.s_no}/edit`}>
                      <Edit className='size-3.5' />
                    </Link>
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setDeleteOpen(true)}
                    className='h-7 w-7 text-destructive'
                  >
                    <Trash2 className='size-3.5' />
                  </Button>
                </>
              )}
            </>
          }
        />
      </div>

      {fetchErrorMessage ? (
        <div className='px-3 py-2'>
          <Alert variant='destructive' className='py-2'>
            <CircleAlert className='size-3' />
            <AlertTitle className='text-xs'>Error</AlertTitle>
            <AlertDescription className='text-[10px]'>
              {fetchErrorMessage}
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      {isLoading ? (
        <div className='px-3 py-4 text-center text-[10px] text-muted-foreground'>
          Loading...
        </div>
      ) : !tenant ? (
        <div className='px-3 py-8 text-center'>
          <div className='text-xs font-medium'>Tenant not found</div>
          <div className='text-[10px] text-muted-foreground'>
            Please check the tenant ID.
          </div>
        </div>
      ) : (
        <div className='space-y-3 px-3 py-3'>
          <Card className='border border-gray-300 bg-gradient-to-br from-blue-50 to-white'>
            <CardContent className='p-4'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  <div className='flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white'>
                    <User className='size-5' />
                  </div>
                  <div>
                    <h2 className='text-base font-bold text-slate-900'>
                      {tenant.name}
                    </h2>
                    <p className='text-xs text-slate-600'>
                      {tenant.phone_no || 'No phone'}
                      {dueLabel ? ` • ${dueLabel}` : ''}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={tenant.status === 'ACTIVE' ? 'default' : 'outline'}
                  className={`h-6 px-2 text-[10px] ${tenant.status === 'ACTIVE' ? 'bg-emerald-600' : ''}`}
                >
                  {tenant.status}
                </Badge>
              </div>

              <div className='mt-4 grid grid-cols-2 gap-3'>
                <div className='rounded-xl border border-slate-200 bg-white/50 p-3'>
                  <div className='text-[10px] font-medium text-slate-500'>
                    Check-in
                  </div>
                  <div className='text-sm font-bold text-slate-900'>
                    {toDateOnly(tenant.check_in_date)}
                  </div>
                </div>
                <div className='rounded-xl border border-slate-200 bg-white/50 p-3'>
                  <div className='text-[10px] font-medium text-slate-500'>
                    Check-out
                  </div>
                  <div className='text-sm font-bold text-slate-900'>
                    {toDateOnly(tenant.check_out_date) || '—'}
                  </div>
                </div>
              </div>

              <div className='mt-4 flex flex-wrap gap-2'>
                <Button
                  size='sm'
                  onClick={() => setCheckoutOpen(true)}
                  disabled={tenant.status === 'CHECKED_OUT' || checkingOut}
                  className='h-8 bg-gradient-to-r from-blue-600 to-blue-700 text-xs hover:from-blue-700 hover:to-blue-800'
                >
                  {tenant.status === 'CHECKED_OUT'
                    ? 'Checked Out'
                    : checkingOut
                      ? 'Checking out...'
                      : 'Checkout'}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setCheckoutEditDate(toDateOnly(tenant.check_out_date) || '')
                    setClearCheckout(false)
                    setCheckoutEditOpen(true)
                  }}
                  disabled={updatingCheckout}
                  className='h-8 text-xs'
                >
                  Edit Checkout
                </Button>
              </div>

              {paymentStatusBadges.length > 0 && (
                <div className='mt-4 flex flex-wrap gap-1'>
                  {paymentStatusBadges.map((b) => (
                    <span
                      key={b.key}
                      className={`rounded-full px-3 py-1 text-[10px] font-bold ${b.className}`}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              )}

              {hasOutstandingAmount && (
                <div
                  className={`mt-4 rounded-xl border p-4 ${isRentPartial ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-white' : 'border-amber-300 bg-gradient-to-br from-amber-50 to-white'}`}
                >
                  <div
                    className={`text-sm font-bold ${isRentPartial ? 'text-orange-700' : 'text-amber-700'}`}
                  >
                    {hasBothPartialAndPending
                      ? 'Partial + Pending'
                      : isRentPartial
                        ? 'Partial Payment'
                        : 'Pending Payment'}
                  </div>
                  <div className='mt-1 text-xs text-slate-600'>
                    Due ₹{rentDueAmount}
                    {unpaidMonths.length > 0
                      ? ` • ${unpaidMonths.length} month(s)`
                      : ''}
                  </div>
                  {unpaidMonths.length > 0 && (
                    <div className='mt-2'>
                      {unpaidMonths.slice(0, 2).map((m, idx) => (
                        <div key={idx} className='text-[10px] text-slate-500'>
                          {m.month_name || 'Month'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='border-slate-200'>
            <CardContent className='p-4'>
              <h3 className='mb-3 flex items-center gap-2 text-sm font-bold text-slate-900'>
                <Phone className='size-4 text-blue-600' />
                Personal Info
              </h3>
              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                  <div className='text-[10px] font-medium text-slate-500'>
                    Phone
                  </div>
                  <div className='text-xs font-bold text-slate-900'>
                    {tenant.phone_no || '—'}
                  </div>
                </div>
                <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                  <div className='text-[10px] font-medium text-slate-500'>
                    WhatsApp
                  </div>
                  <div className='text-xs font-bold text-slate-900'>
                    {tenant.whatsapp_number || '—'}
                  </div>
                </div>
                <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                  <div className='text-[10px] font-medium text-slate-500'>
                    Email
                  </div>
                  <div className='truncate text-xs font-bold text-slate-900'>
                    {tenant.email || '—'}
                  </div>
                </div>
                <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                  <div className='text-[10px] font-medium text-slate-500'>
                    Occupation
                  </div>
                  <div className='text-xs font-bold text-slate-900'>
                    {tenant.occupation || '—'}
                  </div>
                </div>
                <div className='col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3'>
                  <div className='text-[10px] font-medium text-slate-500'>
                    Address
                  </div>
                  <div className='text-xs font-bold text-slate-900'>
                    {tenant.tenant_address || '—'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-slate-200'>
            <CardContent className='p-4'>
              <h3 className='mb-3 flex items-center gap-2 text-sm font-bold text-slate-900'>
                <MapPin className='size-4 text-green-600' />
                Location Info
              </h3>
              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                  <div className='text-[10px] font-medium text-slate-500'>
                    City
                  </div>
                  <div className='text-xs font-bold text-slate-900'>
                    {tenant.city?.name || '—'}
                  </div>
                </div>
                <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                  <div className='text-[10px] font-medium text-slate-500'>
                    State
                  </div>
                  <div className='text-xs font-bold text-slate-900'>
                    {tenant.state?.name || '—'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-slate-200'>
            <CardContent className='p-4'>
              <h3 className='mb-3 flex items-center gap-2 text-sm font-bold text-slate-900'>
                <Home className='size-4 text-purple-600' />
                PG Location
              </h3>
              <div className='space-y-3'>
                <div className='rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-3'>
                  <div className='text-xs font-bold text-slate-900'>
                    {tenant.pg_locations?.location_name || `#${tenant.pg_id}`}
                  </div>
                  <div className='text-[10px] text-slate-500'>
                    {tenant.pg_locations?.address || '—'}
                  </div>
                  <div className='text-[10px] text-slate-500'>
                    {tenant.pg_locations?.city?.name},{' '}
                    {tenant.pg_locations?.state?.name}
                  </div>
                </div>
                <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                  <div className='text-[10px] font-medium text-slate-500'>
                    Rent Cycle Type
                  </div>
                  <div className='text-xs font-bold text-slate-900'>
                    {tenant.pg_locations?.rent_cycle_type || '—'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-slate-200'>
            <CardContent className='p-4'>
              <h3 className='mb-3 flex items-center gap-2 text-sm font-bold text-slate-900'>
                <BedIcon className='size-4 text-orange-600' />
                Accommodation
              </h3>
              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                  <div className='text-[10px] font-medium text-slate-500'>
                    Room
                  </div>
                  <div className='text-xs font-bold text-slate-900'>
                    Room{' '}
                    {tenant.rooms?.room_no ||
                      (tenant.room_id ? `#${tenant.room_id}` : '—')}
                  </div>
                </div>
                <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                  <div className='text-[10px] font-medium text-slate-500'>
                    Bed
                  </div>
                  <div className='text-xs font-bold text-slate-900'>
                    Bed{' '}
                    {tenant.beds?.bed_no ||
                      (tenant.bed_id ? `#${tenant.bed_id}` : '—')}
                  </div>
                </div>
                <div className='col-span-2 rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-3'>
                  <div className='text-[10px] font-medium text-slate-500'>
                    Bed Price
                  </div>
                  <div className='text-lg font-bold text-orange-700'>
                    ₹{tenant.beds?.bed_price || '—'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-slate-200'>
            <CardContent className='p-4'>
              <h3 className='mb-3 flex items-center gap-2 text-sm font-bold text-slate-900'>
                <FileText className='size-4 text-slate-600' />
                Tenant ID
              </h3>
              <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                <div className='font-mono text-sm font-bold text-slate-900'>
                  {tenant.tenant_id || '—'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-slate-200'>
            <CardContent className='p-4'>
              <h3 className='mb-3 flex items-center gap-2 text-sm font-bold text-slate-900'>
                <Calendar className='size-4 text-blue-600' />
                Important Dates
              </h3>
              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                  <div className='text-[10px] font-medium text-slate-500'>
                    Created
                  </div>
                  <div className='text-xs font-bold text-slate-900'>
                    {toDateOnly(tenant.created_at)}
                  </div>
                </div>
                <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                  <div className='text-[10px] font-medium text-slate-500'>
                    Updated
                  </div>
                  <div className='text-xs font-bold text-slate-900'>
                    {toDateOnly(tenant.updated_at)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {Array.isArray(tenant.images) && (
            <Card className='border-slate-200'>
              <CardContent className='p-4'>
                <h3 className='mb-3 flex items-center gap-2 text-sm font-bold text-slate-900'>
                  <ImageIcon className='size-4 text-indigo-600' />
                  Images ({tenant.images.length})
                </h3>
                {tenant.images.length > 0 ? (
                  <div className='grid grid-cols-3 gap-2'>
                    {(tenant.images as string[]).map((url) => (
                      <div
                        key={url}
                        className='aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50'
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
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-center'>
                    <div className='text-xs text-slate-500'>
                      No images uploaded
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {Array.isArray(tenant.proof_documents) && (
            <Card className='border-slate-200'>
              <CardContent className='p-4'>
                <h3 className='mb-3 flex items-center gap-2 text-sm font-bold text-slate-900'>
                  <FileText className='size-4 text-red-600' />
                  Documents ({tenant.proof_documents.length})
                </h3>
                {tenant.proof_documents.length > 0 ? (
                  <div className='grid grid-cols-3 gap-2'>
                    {tenant.proof_documents.map((doc) => (
                      <div
                        key={doc.document_url}
                        className='aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50'
                      >
                        <img
                          src={doc.document_url}
                          alt={doc.document_type}
                          className='h-full w-full object-cover'
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-center'>
                    <div className='text-xs text-slate-500'>
                      No documents uploaded
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {Array.isArray(tenant.tenant_rent_cycles) && (
            <Card className='border-slate-200'>
              <CardContent className='p-4'>
                <h3 className='mb-3 flex items-center gap-2 text-sm font-bold text-slate-900'>
                  <Calendar className='size-4 text-teal-600' />
                  Rent Cycles ({tenant.tenant_rent_cycles.length})
                </h3>
                {tenant.tenant_rent_cycles.length > 0 ? (
                  <div className='space-y-2'>
                    {tenant.tenant_rent_cycles.map((cycle) => (
                      <div
                        key={cycle.s_no}
                        className='rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-3'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='text-xs font-bold text-slate-900'>
                            {cycle.cycle_type}
                          </div>
                          <div className='text-[10px] text-slate-500'>
                            Day {cycle.anchor_day}
                          </div>
                        </div>
                        <div className='mt-1 text-[10px] text-slate-500'>
                          {toDateOnly(cycle.cycle_start)} -{' '}
                          {toDateOnly(cycle.cycle_end)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-center'>
                    <div className='text-xs text-slate-500'>
                      No rent cycles configured
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {Array.isArray(tenant.tenant_allocations) && (
            <Card className='border-slate-200'>
              <CardContent className='p-4'>
                <h3 className='mb-3 flex items-center gap-2 text-sm font-bold text-slate-900'>
                  <Home className='size-4 text-cyan-600' />
                  Allocation History ({tenant.tenant_allocations.length})
                </h3>
                {tenant.tenant_allocations.length > 0 ? (
                  <div className='space-y-2'>
                    {tenant.tenant_allocations.map((alloc) => (
                      <div
                        key={alloc.s_no}
                        className='rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-3'
                      >
                        <div className='text-xs font-bold text-slate-900'>
                          {alloc.pg_locations?.location_name} • Room{' '}
                          {alloc.rooms?.room_no} • Bed {alloc.beds?.bed_no}
                        </div>
                        <div className='mt-1 text-[10px] text-slate-500'>
                          {toDateOnly(alloc.effective_from)} -{' '}
                          {toDateOnly(alloc.effective_to || undefined) ||
                            'Present'}
                        </div>
                        <div className='text-[10px] text-slate-500'>
                          Price: ₹{alloc.bed_price_snapshot}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-center'>
                    <div className='text-xs text-slate-500'>
                      No allocation history
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {Array.isArray(tenant.current_bills) && (
            <Card className='border-slate-200'>
              <CardContent className='p-4'>
                <h3 className='mb-3 flex items-center gap-2 text-sm font-bold text-slate-900'>
                  <CreditCard className='size-4 text-pink-600' />
                  Current Bills ({tenant.current_bills.length})
                </h3>
                {tenant.current_bills.length > 0 ? (
                  <div className='space-y-2'>
                    {tenant.current_bills.map((bill) => (
                      <div
                        key={bill.s_no}
                        className='rounded-xl border border-pink-200 bg-gradient-to-br from-pink-50 to-white p-3'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='text-xs font-bold text-slate-900'>
                            ₹{bill.amount}
                          </div>
                          <Badge variant='outline' className='h-5 text-[10px]'>
                            {bill.status}
                          </Badge>
                        </div>
                        <div className='mt-1 text-[10px] text-slate-500'>
                          {toDateOnly(bill.due_date)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-center'>
                    <div className='text-xs text-slate-500'>
                      No current bills
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue='rent'>
            <TabsList className='grid h-9 w-full grid-cols-3 bg-slate-100/50'>
              <TabsTrigger value='rent' className='text-xs font-medium'>
                Rent
              </TabsTrigger>
              <TabsTrigger value='advance' className='text-xs font-medium'>
                Advance
              </TabsTrigger>
              <TabsTrigger value='refund' className='text-xs font-medium'>
                Refund
              </TabsTrigger>
            </TabsList>

            <TabsContent value='rent'>
              <div className='mt-3 space-y-3'>
                <Card className='border-slate-200'>
                  <CardContent className='p-4'>
                    <div className='mb-3 flex items-center justify-between'>
                      <h3 className='text-sm font-bold text-slate-900'>
                        Rent Payments
                      </h3>
                      <Button
                        size='sm'
                        onClick={() => setRentDialogOpen(true)}
                        className='h-7 bg-gradient-to-r from-emerald-600 to-emerald-700 text-xs hover:from-emerald-700 hover:to-emerald-800'
                      >
                        <Plus className='mr-1 size-3' />
                        Add
                      </Button>
                    </div>

                    <div className='mb-4 grid grid-cols-2 gap-3'>
                      <div className='rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-3'>
                        <div className='text-[10px] font-medium text-red-600'>
                          Due
                        </div>
                        <div className='text-lg font-bold text-red-700'>
                          ₹{rentDueAmount}
                        </div>
                      </div>
                      <div className='rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-3'>
                        <div className='text-[10px] font-medium text-amber-600'>
                          Partial
                        </div>
                        <div className='text-lg font-bold text-amber-700'>
                          ₹{partialDueAmount}
                        </div>
                      </div>
                      <div className='rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-3'>
                        <div className='text-[10px] font-medium text-orange-600'>
                          Pending
                        </div>
                        <div className='text-lg font-bold text-orange-700'>
                          ₹{pendingDueAmount}
                        </div>
                      </div>
                      <div className='rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3'>
                        <div className='text-[10px] font-medium text-slate-600'>
                          Status
                        </div>
                        <div className='text-sm font-bold text-slate-900'>
                          {tenant.payment_status || '—'}
                        </div>
                      </div>
                    </div>

                    {tenant?.payment_cycle_summaries &&
                    tenant.payment_cycle_summaries.length > 0 ? (
                      <div className='space-y-3'>
                        {tenant.payment_cycle_summaries.map(
                          (cycle: PaymentCycleSummary) => (
                            <Card
                              key={cycle.cycle_id || cycle.start_date}
                              className='border-slate-200'
                            >
                              <CardContent className='p-3'>
                                <div className='mb-2 flex items-center justify-between'>
                                  <div>
                                    <div className='text-xs font-bold text-slate-900'>
                                      {toDateOnly(cycle.start_date)} -{' '}
                                      {toDateOnly(cycle.end_date)}
                                    </div>
                                    <div className='text-[10px] text-slate-500'>
                                      Cycle #{cycle.cycle_id}
                                    </div>
                                  </div>
                                  <Badge
                                    variant='outline'
                                    className='h-5 text-[10px]'
                                  >
                                    {cycle.status || 'Active'}
                                  </Badge>
                                </div>
                                <div className='grid grid-cols-2 gap-2 text-[10px]'>
                                  <div>
                                    <span className='text-slate-500'>
                                      Paid:{' '}
                                    </span>
                                    <span className='font-bold text-slate-900'>
                                      ₹{cycle.totalPaid || 0}
                                    </span>
                                  </div>
                                  <div>
                                    <span className='text-slate-500'>
                                      Due:{' '}
                                    </span>
                                    <span className='font-bold text-slate-900'>
                                      ₹{cycle.due || 0}
                                    </span>
                                  </div>
                                </div>
                                {cycle.payments &&
                                  cycle.payments.length > 0 && (
                                    <div className='mt-2 space-y-2'>
                                      {cycle.payments.map(
                                        (payment: TenantPayment) => (
                                          <div
                                            key={payment.s_no}
                                            className='flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2'
                                          >
                                            <div className='min-w-0 flex-1'>
                                              <div className='text-xs font-bold text-slate-900'>
                                                ₹{String(payment.amount_paid)}
                                              </div>
                                              <div className='text-[10px] text-slate-500'>
                                                {toDateOnly(
                                                  payment.payment_date
                                                )}{' '}
                                                • {payment.payment_method}
                                              </div>
                                            </div>
                                            <Button
                                              variant='ghost'
                                              size='icon'
                                              onClick={() =>
                                                handleDeleteRentPayment(payment)
                                              }
                                              className='h-7 w-7 text-destructive'
                                            >
                                              <Trash2 className='size-3' />
                                            </Button>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                              </CardContent>
                            </Card>
                          )
                        )}
                      </div>
                    ) : (
                      <div className='py-6 text-center text-xs text-slate-500'>
                        No rent payments found
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='advance'>
              <div className='mt-3 space-y-3'>
                <Card className='border-slate-200'>
                  <CardContent className='p-4'>
                    <div className='mb-3 flex items-center justify-between'>
                      <h3 className='text-sm font-bold text-slate-900'>
                        Advance Payments
                      </h3>
                      <Button
                        size='sm'
                        onClick={() => setAdvanceDialogOpen(true)}
                        className='h-7 bg-gradient-to-r from-blue-600 to-blue-700 text-xs hover:from-blue-700 hover:to-blue-800'
                      >
                        <Plus className='mr-1 size-3' />
                        Add
                      </Button>
                    </div>

                    {advancePayments.length > 0 ? (
                      <div className='space-y-2'>
                        {advancePayments.map((payment) => (
                          <Card key={payment.s_no} className='border-slate-200'>
                            <CardContent className='p-3'>
                              <div className='flex items-center justify-between'>
                                <div>
                                  <div className='text-xs font-bold text-slate-900'>
                                    ₹{payment.amount_paid}
                                  </div>
                                  <div className='text-[10px] text-slate-500'>
                                    {toDateOnly(payment.payment_date)} •{' '}
                                    {payment.payment_method}
                                  </div>
                                </div>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() =>
                                    handleDeleteAdvancePayment(payment)
                                  }
                                  className='h-7 w-7 text-destructive'
                                >
                                  <Trash2 className='size-3' />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className='py-6 text-center text-xs text-slate-500'>
                        No advance payments found
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='refund'>
              <div className='mt-3 space-y-3'>
                <Card className='border-slate-200'>
                  <CardContent className='p-4'>
                    <div className='mb-3 flex items-center justify-between'>
                      <h3 className='text-sm font-bold text-slate-900'>
                        Refund Payments
                      </h3>
                      <Button
                        size='sm'
                        onClick={() => setRefundDialogOpen(true)}
                        className='h-7 bg-gradient-to-r from-purple-600 to-purple-700 text-xs hover:from-purple-700 hover:to-purple-800'
                      >
                        <Plus className='mr-1 size-3' />
                        Add
                      </Button>
                    </div>

                    {refundPayments.length > 0 ? (
                      <div className='space-y-2'>
                        {refundPayments.map((payment) => (
                          <Card key={payment.s_no} className='border-slate-200'>
                            <CardContent className='p-3'>
                              <div className='text-xs font-bold text-slate-900'>
                                ₹{payment.amount_paid}
                              </div>
                              <div className='text-[10px] text-slate-500'>
                                {toDateOnly(payment.payment_date)} •{' '}
                                {payment.payment_method}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className='py-6 text-center text-xs text-slate-500'>
                        No refund payments found
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
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
            check_in_date: tenant.check_in_date,
          }}
          onSaved={() => {
            setAdvanceDialogOpen(false)
            void refetch()
          }}
        />
      )}

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
            beds: tenant.beds,
            check_in_date: tenant.check_in_date,
            last_payment_date: tenant.last_payment_date,
          }}
          onSaved={() => {
            setRentDialogOpen(false)
            void refetch()
          }}
        />
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className='max-w-sm'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-sm'>
              Delete Tenant
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs'>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>{tenant?.name}</span>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteOpen(false)}
              className='text-xs'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className='text-xs'
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <AlertDialogContent className='max-w-sm'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-sm'>
              Checkout Tenant
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs'>
              Select checkout date for {tenant?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-2'>
            <Input
              type='date'
              value={checkoutDate}
              onChange={(e) => setCheckoutDate(e.target.value)}
              className='text-xs'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setCheckoutOpen(false)}
              className='text-xs'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCheckout}
              disabled={checkingOut}
              className='text-xs'
            >
              {checkingOut ? 'Checking out...' : 'Checkout'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AppDialog
        open={checkoutEditOpen}
        onOpenChange={setCheckoutEditOpen}
        title='Edit Checkout Date'
      >
        <div className='space-y-3 py-2'>
          <div>
            <label className='text-[10px] text-muted-foreground'>
              Checkout Date
            </label>
            <Input
              type='date'
              value={checkoutEditDate}
              onChange={(e) => setCheckoutEditDate(e.target.value)}
              className='mt-1 text-xs'
            />
          </div>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              id='clearCheckout'
              checked={clearCheckout}
              onChange={(e) => setClearCheckout(e.target.checked)}
              className='size-3'
            />
            <label htmlFor='clearCheckout' className='text-[10px]'>
              Clear checkout date
            </label>
          </div>
        </div>
        <div className='flex justify-end gap-2 pt-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setCheckoutEditOpen(false)}
            className='h-6 text-[10px]'
          >
            Cancel
          </Button>
          <Button
            onClick={confirmUpdateCheckout}
            disabled={updatingCheckout}
            className='h-6 bg-black text-[10px] text-white hover:bg-black/90'
          >
            {updatingCheckout ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </AppDialog>

      <AlertDialog
        open={deleteRentDialogOpen}
        onOpenChange={setDeleteRentDialogOpen}
      >
        <AlertDialogContent className='max-w-sm'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-sm'>
              Cancel Payment
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs'>
              Are you sure you want to cancel rent payment of ₹
              {rentToDelete?.amount}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteRentDialogOpen(false)}
              className='text-xs'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRentPayment}
              disabled={voidingRent}
              className='text-xs'
            >
              {voidingRent ? 'Cancelling...' : 'Cancel Payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteAdvanceDialogOpen}
        onOpenChange={setDeleteAdvanceDialogOpen}
      >
        <AlertDialogContent className='max-w-sm'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-sm'>
              Delete Advance Payment
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs'>
              Are you sure you want to delete advance payment of ₹
              {advanceToDelete?.amount}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteAdvanceDialogOpen(false)}
              className='text-xs'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAdvancePayment}
              className='text-xs'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AppDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        title='Add Refund Payment'
      >
        <div className='space-y-3 py-2'>
          <div>
            <label className='text-[10px] text-muted-foreground'>Amount</label>
            <Input
              type='number'
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder='Enter amount'
              className='mt-1 text-xs'
            />
          </div>
          <div>
            <label className='text-[10px] text-muted-foreground'>Date</label>
            <Input
              type='date'
              value={refundPaymentDate}
              onChange={(e) => setRefundPaymentDate(e.target.value)}
              className='mt-1 text-xs'
            />
          </div>
          <div>
            <label className='text-[10px] text-muted-foreground'>
              Payment Method
            </label>
            <Select
              value={refundPaymentMethod}
              onValueChange={(v) =>
                isPaymentMethod(v) && setRefundPaymentMethod(v)
              }
            >
              <SelectTrigger className='mt-1 h-7 text-xs'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='CASH'>Cash</SelectItem>
                <SelectItem value='GPAY'>GPay</SelectItem>
                <SelectItem value='PHONEPE'>PhonePe</SelectItem>
                <SelectItem value='BANK_TRANSFER'>Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className='text-[10px] text-muted-foreground'>Remarks</label>
            <Input
              value={refundRemarks}
              onChange={(e) => setRefundRemarks(e.target.value)}
              placeholder='Optional remarks'
              className='mt-1 text-xs'
            />
          </div>
        </div>
        <div className='flex justify-end gap-2 pt-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setRefundDialogOpen(false)}
            className='h-6 text-[10px]'
          >
            Cancel
          </Button>
          <Button
            onClick={submitRefund}
            disabled={creatingRefund}
            className='h-6 bg-black text-[10px] text-white hover:bg-black/90'
          >
            {creatingRefund ? 'Adding...' : 'Add Refund'}
          </Button>
        </div>
      </AppDialog>
    </div>
  )
}
