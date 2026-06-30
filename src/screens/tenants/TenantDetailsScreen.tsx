import { useMemo, useState } from 'react'
import {
  useGetRefundPaymentsQuery,
  type AdvancePayment,
  type RefundPayment,
} from '@/services/paymentsApi'
import {
  useCheckoutTenantWithDateMutation,
  useDeleteTenantMutation,
  useGetTenantByIdQuery,
  useUpdateTenantCheckoutDateMutation,
  useUpdateTenantMutation,
  type Tenant,
  type TenantPayment,
} from '@/services/tenantsApi'
import {
  CircleAlert,
  Edit,
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
  ChevronRight,
  ChevronDown,
  Wallet,
  Undo2,
  Clock,
  CheckCircle,
  RotateCcw,
  LogOut,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AppDialog } from '@/components/form/app-dialog'
import { PageHeader } from '@/components/form/page-header'
import { AdvancePaymentDialog } from './AdvancePaymentDialog'
import { RentPaymentDialog } from './RentPaymentDialog'
import { RefundPaymentDialog } from './RefundPaymentDialog'

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

  const [updateTenant, { isLoading: updatingVacate }] =
    useUpdateTenantMutation()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutDate, setCheckoutDate] = useState(
    () => new Date().toISOString().split('T')[0]
  )

  const [checkoutEditOpen, setCheckoutEditOpen] = useState(false)
  const [checkoutEditDate, setCheckoutEditDate] = useState('')
  const [clearCheckout, setClearCheckout] = useState(false)

  const [vacateDialogOpen, setVacateDialogOpen] = useState(false)
  const [vacateDate, setVacateDate] = useState('')

  const [rentOpen, setRentOpen] = useState(false)
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)
  const [transferHistoryOpen, setTransferHistoryOpen] = useState(false)

  const [deleteAdvanceDialogOpen, setDeleteAdvanceDialogOpen] = useState(false)
  const [advanceToDelete, setAdvanceToDelete] = useState<{
    id: number
    amount: string
    date: string
  } | null>(null)

  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false)
  const [rentDialogOpen, setRentDialogOpen] = useState(false)

  const [refundDialogOpen, setRefundDialogOpen] = useState(false)

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

  const rentPayments = useMemo(
    () => asArray<TenantPayment>(tenant?.rent_payments),
    [tenant]
  )

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

  const handleOpenVacateDialog = () => {
    setVacateDate(
      tenant?.expected_vacate_date
        ? new Date(tenant.expected_vacate_date).toISOString().split('T')[0]
        : ''
    )
    setVacateDialogOpen(true)
  }

  const handleSaveVacateDate = async () => {
    if (!tenant) return
    try {
      await updateTenant({
        id: tenant.s_no,
        data: { expected_vacate_date: vacateDate || null },
      }).unwrap()
      showSuccessAlert(
        vacateDate ? 'Expected vacate date saved' : 'Expected vacate date cleared'
      )
      setVacateDialogOpen(false)
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Update Error')
    }
  }

  const handleClearCheckout = async () => {
    if (!tenant) return
    try {
      await updateTenantCheckoutDate({
        id: tenant.s_no,
        clear_checkout: true,
      }).unwrap()
      showSuccessAlert('Checkout cleared and tenant reactivated')
      setCheckoutEditOpen(false)
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Clear Checkout Error')
    }
  }

  const derivedRentStatus = (() => {
    const rentDue = rentDueAmount
    const pendingDue = pendingDueAmount
    const partialDue = partialDueAmount

    let label = 'RENT STATUS'
    let color = 'text-slate-500'
    let bg = 'bg-slate-50'

    if (rentDue <= 0) {
      label = 'RENT PAID'
      color = 'text-emerald-700'
      bg = 'bg-emerald-50'
    } else if (partialDue > 0) {
      label = pendingDue > 0 ? 'RENT PARTIAL + PENDING' : 'RENT PARTIAL'
      color = 'text-orange-700'
      bg = 'bg-orange-50'
    } else {
      label = String(tenant?.payment_status ?? '') === 'NO_PAYMENT' ? 'RENT NOT PAID' : 'RENT PENDING'
      color = 'text-red-700'
      bg = 'bg-red-50'
    }

    return { label, color, bg, rentDue, pendingDue, partialDue }
  })()

  const transferHistory = useMemo(() => {
    const allocs = asArray<NonNullable<Tenant['tenant_allocations']>[number]>(
      tenant?.tenant_allocations
    )
    return allocs
      .slice()
      .sort(
        (a, b) =>
          new Date(b.effective_from).getTime() -
          new Date(a.effective_from).getTime()
      )
  }, [tenant])

  return (
    <div className='container mx-auto max-w-4xl px-4 py-4'>
      <PageHeader
          title={tenant?.name || 'Tenant Details'}
          showBack={true}
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
      {fetchErrorMessage ? (
        <div className='mt-4'>
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
        <div className='mt-4 py-4 text-center text-sm text-muted-foreground'>
          Loading...
        </div>
      ) : !tenant ? (
        <div className='mt-4 py-8 text-center'>
          <div className='text-sm font-medium'>Tenant not found</div>
          <div className='text-xs text-muted-foreground'>
            Please check the tenant ID.
          </div>
        </div>
      ) : (
        <div className='mt-4 space-y-3'>
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
                  <LogOut className='mr-1 size-3' />
                  {tenant.status === 'CHECKED_OUT'
                    ? 'Checked Out'
                    : checkingOut
                      ? 'Checking out...'
                      : 'Checkout'}
                </Button>
                {tenant.status === 'CHECKED_OUT' && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleClearCheckout}
                    disabled={updatingCheckout}
                    className='h-8 text-xs'
                  >
                    <RotateCcw className='mr-1 size-3' />
                    Clear Checkout
                  </Button>
                )}
                {tenant.status !== 'CHECKED_OUT' && (
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
                    <Calendar className='mr-1 size-3' />
                    Edit Checkout
                  </Button>
                )}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleOpenVacateDialog}
                  className='h-8 text-xs'
                >
                  <Clock className='mr-1 size-3' />
                  {tenant.expected_vacate_date ? 'Edit Vacate Date' : 'Set Vacate Date'}
                </Button>
              </div>

              <div className='mt-3 flex flex-wrap gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setRentDialogOpen(true)}
                  className='h-8 text-xs'
                >
                  <Wallet className='mr-1 size-3' />
                  Add Rent
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setAdvanceDialogOpen(true)}
                  className='h-8 text-xs'
                >
                  <CreditCard className='mr-1 size-3' />
                  Add Advance
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setRefundDialogOpen(true)}
                  className='h-8 text-xs'
                >
                  <Undo2 className='mr-1 size-3' />
                  Add Refund
                </Button>
              </div>

              {tenant.expected_vacate_date && (
                <div className='mt-3 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-3'>
                  <div className='flex items-center gap-2'>
                    <Clock className='size-4 text-amber-600' />
                    <div>
                      <div className='text-[10px] font-medium text-amber-600'>
                        Expected Vacate Date
                      </div>
                      <div className='text-sm font-bold text-amber-800'>
                        {toDateOnly(tenant.expected_vacate_date)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

          {/* Rent Payments Accordion */}
          <Collapsible open={rentOpen} onOpenChange={setRentOpen}>
            <Card className='border-slate-200'>
              <CollapsibleTrigger asChild>
                <CardContent className='flex cursor-pointer items-center justify-between p-4'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600'>
                      <Wallet className='size-4' />
                    </div>
                    <div>
                      <div className='text-sm font-bold text-slate-900'>
                        Rent Payments
                      </div>
                      <div className='text-[10px] text-slate-500'>
                        {rentPayments.length} payment(s)
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {rentOpen ? (
                      <ChevronDown className='size-4 text-slate-400' />
                    ) : (
                      <ChevronRight className='size-4 text-slate-400' />
                    )}
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className='border-t border-slate-100 p-4 pt-3'>
                  {/* Rent Status Summary */}
                  <div className='mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3'>
                    <div className='flex items-center justify-between'>
                      <div className='text-xs font-bold text-slate-700'>
                        {derivedRentStatus.label}
                      </div>
                      {isRentPaid ? (
                        <CheckCircle className='size-4 text-emerald-600' />
                      ) : (
                        <CircleAlert className='size-4 text-red-500' />
                      )}
                    </div>
                    <div className='mt-2 grid grid-cols-3 gap-2'>
                      <div className='rounded-lg border border-slate-200 bg-white p-2'>
                        <div className='text-[9px] font-medium text-slate-500'>
                          Due
                        </div>
                        <div className='text-xs font-bold text-slate-900'>
                          ₹{derivedRentStatus.rentDue}
                        </div>
                      </div>
                      <div className='rounded-lg border border-slate-200 bg-white p-2'>
                        <div className='text-[9px] font-medium text-slate-500'>
                          Partial
                        </div>
                        <div className='text-xs font-bold text-slate-900'>
                          ₹{derivedRentStatus.partialDue}
                        </div>
                      </div>
                      <div className='rounded-lg border border-slate-200 bg-white p-2'>
                        <div className='text-[9px] font-medium text-slate-500'>
                          Pending
                        </div>
                        <div className='text-xs font-bold text-slate-900'>
                          ₹{derivedRentStatus.pendingDue}
                        </div>
                      </div>
                    </div>
                    {!hasOutstandingAmount && (
                      <div className='mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2'>
                        <CheckCircle className='size-3.5 text-emerald-600' />
                        <span className='text-[11px] font-medium text-emerald-700'>
                          No pending rent payments
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Recent Rent Payments */}
                  {rentPayments.length > 0 ? (
                    <div className='space-y-2'>
                      {rentPayments.slice(0, 5).map((payment) => (
                        <div
                          key={payment.s_no}
                          className='flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5'
                        >
                          <div>
                            <div className='text-xs font-bold text-slate-900'>
                              ₹{payment.amount_paid}
                            </div>
                            <div className='text-[10px] text-slate-500'>
                              {toDateOnly(payment.payment_date)} •{' '}
                              {payment.payment_method}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='py-4 text-center text-xs text-slate-500'>
                      No rent payments found
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Advance Payments Accordion */}
          <Collapsible open={advanceOpen} onOpenChange={setAdvanceOpen}>
            <Card className='border-slate-200'>
              <CollapsibleTrigger asChild>
                <CardContent className='flex cursor-pointer items-center justify-between p-4'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600'>
                      <CreditCard className='size-4' />
                    </div>
                    <div>
                      <div className='text-sm font-bold text-slate-900'>
                        Advance Payments
                      </div>
                      <div className='text-[10px] text-slate-500'>
                        {advancePayments.length} payment(s)
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {advanceOpen ? (
                      <ChevronDown className='size-4 text-slate-400' />
                    ) : (
                      <ChevronRight className='size-4 text-slate-400' />
                    )}
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className='border-t border-slate-100 p-4 pt-3'>
                  {advancePayments.length > 0 ? (
                    <div className='space-y-2'>
                      {advancePayments.map((payment) => (
                        <div
                          key={payment.s_no}
                          className='flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5'
                        >
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
                      ))}
                    </div>
                  ) : (
                    <div className='py-4 text-center text-xs text-slate-500'>
                      No advance payments found
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Refund Payments Accordion */}
          <Collapsible open={refundOpen} onOpenChange={setRefundOpen}>
            <Card className='border-slate-200'>
              <CollapsibleTrigger asChild>
                <CardContent className='flex cursor-pointer items-center justify-between p-4'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600'>
                      <Undo2 className='size-4' />
                    </div>
                    <div>
                      <div className='text-sm font-bold text-slate-900'>
                        Refund Payments
                      </div>
                      <div className='text-[10px] text-slate-500'>
                        {refundPayments.length} payment(s)
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {refundOpen ? (
                      <ChevronDown className='size-4 text-slate-400' />
                    ) : (
                      <ChevronRight className='size-4 text-slate-400' />
                    )}
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className='border-t border-slate-100 p-4 pt-3'>
                  {refundPayments.length > 0 ? (
                    <div className='space-y-2'>
                      {refundPayments.map((payment) => (
                        <div
                          key={payment.s_no}
                          className='rounded-xl border border-slate-200 bg-slate-50 p-2.5'
                        >
                          <div className='flex items-center justify-between'>
                            <div className='text-xs font-bold text-slate-900'>
                              ₹{payment.amount_paid}
                            </div>
                          </div>
                          <div className='text-[10px] text-slate-500'>
                            {toDateOnly(payment.payment_date)} •{' '}
                            {payment.payment_method}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='py-4 text-center text-xs text-slate-500'>
                      No refund payments found
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Transfer History Accordion */}
          {transferHistory.length > 0 && (
            <Collapsible
              open={transferHistoryOpen}
              onOpenChange={setTransferHistoryOpen}
            >
              <Card className='border-slate-200'>
                <CollapsibleTrigger asChild>
                  <CardContent className='flex cursor-pointer items-center justify-between p-4'>
                    <div className='flex items-center gap-3'>
                      <div className='flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600'>
                        <Home className='size-4' />
                      </div>
                      <div>
                        <div className='text-sm font-bold text-slate-900'>
                          Transfer History
                        </div>
                        <div className='text-[10px] text-slate-500'>
                          {transferHistory.length} allocation(s)
                        </div>
                      </div>
                    </div>
                    {transferHistoryOpen ? (
                      <ChevronDown className='size-4 text-slate-400' />
                    ) : (
                      <ChevronRight className='size-4 text-slate-400' />
                    )}
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className='border-t border-slate-100 p-4 pt-3'>
                    <div className='space-y-2'>
                      {transferHistory.map((alloc) => (
                        <div
                          key={alloc.s_no}
                          className='rounded-xl border border-slate-200 bg-slate-50 p-3'
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
                          {alloc.bed_price_snapshot !== undefined && (
                            <div className='text-[10px] text-slate-500'>
                              Price: ₹{alloc.bed_price_snapshot}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}
        </div>
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

      {tenant && (
        <RefundPaymentDialog
          open={refundDialogOpen}
          onOpenChange={setRefundDialogOpen}
          tenant={{
            s_no: tenant.s_no,
            name: tenant.name,
            pg_id: tenant.pg_id,
            room_id: tenant.room_id || 0,
            bed_id: tenant.bed_id || 0,
            rooms: tenant.rooms,
            beds: tenant.beds,
            check_in_date: tenant.check_in_date,
          }}
          onSaved={() => {
            setRefundDialogOpen(false)
            void refetch()
          }}
        />
      )}

      <AppDialog
        open={vacateDialogOpen}
        onOpenChange={setVacateDialogOpen}
        title='Expected Vacate Date'
        description={tenant?.name ? `Tenant: ${tenant.name}` : 'Tenant'}
      >
        <div className='space-y-3 py-2'>
          <div className='rounded-xl border border-blue-200 bg-blue-50 p-3'>
            <p className='text-[11px] text-slate-600'>
              Set this if the tenant plans to leave on a specific date. This is
              different from the actual checkout date — it's for planning
              purposes only.
            </p>
          </div>
          <div>
            <label className='text-[10px] text-muted-foreground'>
              Expected Vacate Date
            </label>
            <Input
              type='date'
              value={vacateDate}
              onChange={(e) => setVacateDate(e.target.value)}
              className='mt-1 text-xs'
            />
          </div>
          {vacateDate && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setVacateDate('')}
              className='h-7 w-full border-red-200 text-xs text-red-600 hover:bg-red-50'
            >
              Clear Date
            </Button>
          )}
        </div>
        <div className='flex justify-end gap-2 pt-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setVacateDialogOpen(false)}
            className='h-7 text-xs'
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveVacateDate}
            disabled={updatingVacate}
            className='h-7 bg-black text-xs text-white hover:bg-black/90'
          >
            {updatingVacate ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </AppDialog>
    </div>
  )
}
