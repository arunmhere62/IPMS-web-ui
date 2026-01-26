import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CircleAlert, Filter, RefreshCw } from 'lucide-react'

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/form/page-header'

import { type Payment, useGetTenantPaymentsQuery, useUpdatePaymentStatusMutation } from '@/services/paymentsApi'
import { useAppSelector } from '@/store/hooks'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

type StatusFilter = 'ALL' | 'PAID' | 'PARTIAL' | 'PENDING' | 'FAILED'

type ErrorLike = {
  data?: { message?: string }
  message?: string
}

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

type QuickFilter = 'NONE' | 'LAST_WEEK' | 'LAST_MONTH'

const formatDate = (value?: string) => {
  const s = String(value ?? '')
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s.includes('T') ? s.split('T')[0] : s
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatMoney = (value: unknown) => {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

const paymentMethodIcon = (method?: string) => {
  const m = String(method ?? '').toUpperCase()
  if (m === 'GPAY') return '📱'
  if (m === 'PHONEPE') return '📱'
  if (m === 'CASH') return '💵'
  if (m === 'BANK_TRANSFER') return '🏦'
  return '💰'
}

const statusBadgeVariant = (status?: string) => {
  const s = String(status ?? '').toUpperCase()
  if (s === 'PAID') return 'default'
  if (s === 'PARTIAL') return 'secondary'
  if (s === 'PENDING') return 'outline'
  if (s === 'FAILED') return 'destructive'
  return 'outline'
}

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

const readListData = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return undefined
  return (value as Record<string, unknown>)['data']
}

const readPagination = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return undefined
  return (value as Record<string, unknown>)['pagination']
}

export function RentPaymentsScreen() {
  const navigate = useNavigate()
  const selectedPGLocationId = useAppSelector((s) => (s as any).pgLocations?.selectedPGLocationId) as number | null

  const [page, setPage] = useState(1)
  const limit = 50

  const [filtersOpen, setFiltersOpen] = useState(false)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('NONE')

  const [draftStatus, setDraftStatus] = useState<StatusFilter>('ALL')
  const [draftMonth, setDraftMonth] = useState<string | null>(null)
  const [draftYear, setDraftYear] = useState<number | null>(null)
  const [draftQuick, setDraftQuick] = useState<QuickFilter>('NONE')

  const years = useMemo(() => {
    const y = new Date().getFullYear()
    return [y, y - 1, y - 2]
  }, [])

  const toISODate = (d: Date) => d.toISOString().split('T')[0]

  const computedDates = useMemo(() => {
    if (quickFilter === 'NONE') return { start_date: undefined, end_date: undefined }
    const end = new Date()
    const start = new Date()
    if (quickFilter === 'LAST_WEEK') start.setDate(end.getDate() - 7)
    if (quickFilter === 'LAST_MONTH') start.setMonth(end.getMonth() - 1)
    return { start_date: toISODate(start), end_date: toISODate(end) }
  }, [quickFilter])

  const queryArgs = useMemo(() => {
    const params: any = {
      page,
      limit,
    }

    if (selectedPGLocationId) params.pg_id = selectedPGLocationId
    if (statusFilter !== 'ALL') params.status = statusFilter

    if (selectedMonth && selectedYear) {
      params.month = selectedMonth
      params.year = selectedYear
    } else if (computedDates.start_date && computedDates.end_date) {
      params.start_date = computedDates.start_date
      params.end_date = computedDates.end_date
    }

    return params
  }, [computedDates.end_date, computedDates.start_date, limit, page, selectedMonth, selectedPGLocationId, selectedYear, statusFilter])

  const {
    data: paymentsResponse,
    isLoading,
    error,
    refetch,
  } = useGetTenantPaymentsQuery(queryArgs, { skip: !selectedPGLocationId })

  const [updateStatus, { isLoading: updatingStatus }] = useUpdatePaymentStatusMutation()

  const payments = useMemo(() => {
    return asArray<Payment>(readListData(paymentsResponse))
  }, [paymentsResponse])

  const pagination = readPagination(paymentsResponse) as
    | {
        total?: number
        page?: number
        limit?: number
        totalPages?: number
        hasMore?: boolean
      }
    | undefined

  const totalPages = Number(pagination?.totalPages ?? (pagination?.hasMore ? page + 1 : 1))

  const fetchErrorMessage =
    (error as ErrorLike | undefined)?.data?.message || (error as ErrorLike | undefined)?.message

  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false)
  const [markPaidTarget, setMarkPaidTarget] = useState<Payment | null>(null)

  const askMarkAsPaid = (p: Payment) => {
    setMarkPaidTarget(p)
    setMarkPaidDialogOpen(true)
  }

  const confirmMarkAsPaid = async () => {
    if (!markPaidTarget) return
    try {
      await updateStatus({
        id: markPaidTarget.s_no,
        status: 'PAID',
        payment_date: new Date().toISOString().split('T')[0],
      }).unwrap()
      showSuccessAlert('Payment marked as paid successfully')
      setMarkPaidDialogOpen(false)
      setMarkPaidTarget(null)
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Payment Error')
    }
  }

  const canPrev = page > 1
  const canNext = Boolean(pagination?.hasMore) || (Number.isFinite(totalPages) && page < totalPages)

  const filterCount = useMemo(() => {
    let c = 0
    if (statusFilter !== 'ALL') c++
    if (quickFilter !== 'NONE') c++
    if (selectedMonth || selectedYear) c++
    return c
  }, [quickFilter, selectedMonth, selectedYear, statusFilter])

  const openFilters = () => {
    setDraftStatus(statusFilter)
    setDraftMonth(selectedMonth)
    setDraftYear(selectedYear)
    setDraftQuick(quickFilter)
    setFiltersOpen(true)
  }

  const applyFilters = () => {
    setStatusFilter(draftStatus)
    setSelectedMonth(draftMonth)
    setSelectedYear(draftYear)
    setQuickFilter(draftQuick)
    setPage(1)
    setFiltersOpen(false)
  }

  const clearFilters = () => {
    setDraftStatus('ALL')
    setDraftMonth(null)
    setDraftYear(null)
    setDraftQuick('NONE')

    setStatusFilter('ALL')
    setSelectedMonth(null)
    setSelectedYear(null)
    setQuickFilter('NONE')
    setPage(1)
    setFiltersOpen(false)
  }

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/payments')
  }

  return (
    <div className='container mx-auto max-w-6xl px-3 py-6'>
      <div className='mb-3'>
        <Button type='button' variant='outline' size='sm' onClick={goBack}>
          <ArrowLeft className='me-2 size-4' />
          Back
        </Button>
      </div>
      <PageHeader
        title='Rent Payments'
        subtitle='Track monthly rent payments and statuses'
        right={
          <>
            <Button variant='outline' size='sm' onClick={() => void refetch()} disabled={isLoading}>
              <RefreshCw className='me-2 size-4' />
              Refresh
            </Button>
            <Button variant='outline' size='sm' onClick={openFilters}>
              <Filter className='me-2 size-4' />
              Filters
              {filterCount > 0 ? <Badge variant='secondary' className='ms-2'>{filterCount}</Badge> : null}
            </Button>
          </>
        }
      />

      {!selectedPGLocationId ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>Select a PG location.</div>
      ) : null}

      {fetchErrorMessage ? (
        <div className='mt-4'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Error Loading Payments</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      <div className='mt-4 grid gap-3'>
        {isLoading ? (
          <div className='rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>Loading...</div>
        ) : payments.length === 0 ? (
          <div className='rounded-md border bg-card px-3 py-8 text-center'>
            <div className='text-base font-semibold'>No Payments</div>
            <div className='mt-1 text-xs text-muted-foreground'>No rent payments found.</div>
          </div>
        ) : (
          payments.map((p) => {
            const tenantName = p.tenants?.name || `Tenant #${p.tenant_id}`
            const room = p.rooms?.room_no ? `Room ${p.rooms.room_no}` : undefined
            const bed = p.beds?.bed_no ? `Bed ${p.beds.bed_no}` : undefined
            const where = [room, bed].filter(Boolean).join(' · ')
            const tenantIdLabel = p.tenants?.tenant_id ? `ID: ${p.tenants.tenant_id}` : null
            const phoneLabel = p.tenants?.phone_no ? String(p.tenants.phone_no) : null
            const canViewTenant = Boolean(p.tenants) && !p.tenant_unavailable_reason
            const periodStart = p.start_date
            const periodEnd = p.end_date

            return (
              <Card key={p.s_no}>
                <CardContent className='p-4'>
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2'>
                        <div className='rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary'>
                          {p.status === 'PARTIAL' ? '⚠️ PARTIAL PAYMENT' : 'RENT PAYMENT'}
                        </div>
                        <Badge variant={statusBadgeVariant(p.status) as BadgeVariant}>{p.status}</Badge>
                      </div>
                      <div className='mt-2 truncate text-sm font-semibold'>{tenantName}</div>
                      {tenantIdLabel ? <div className='mt-0.5 text-[11px] text-muted-foreground'>{tenantIdLabel}</div> : null}
                    </div>

                    <div className='text-right'>
                      <div className='text-base font-semibold text-primary'>{formatMoney(p.amount_paid)}</div>
                      {p.actual_rent_amount !== p.amount_paid ? (
                        <div className='mt-0.5 text-[11px] text-muted-foreground'>Actual Rent: {formatMoney(p.actual_rent_amount)}</div>
                      ) : null}
                    </div>
                  </div>

                  <div className='mt-3 rounded-md border bg-muted/10 p-3 text-xs'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <div className='text-muted-foreground'>{where ? where : 'Room N/A · Bed N/A'}</div>
                      <div className='text-muted-foreground'>{p.payment_date ? formatDate(p.payment_date) : '—'}</div>
                    </div>
                    <div className='mt-2 flex flex-wrap items-center justify-between gap-2'>
                      <div className='text-muted-foreground'>
                        {paymentMethodIcon(p.payment_method)} {p.payment_method}
                      </div>
                      {phoneLabel ? <div className='text-muted-foreground'>{phoneLabel}</div> : null}
                    </div>
                    {periodStart && periodEnd ? (
                      <div className='mt-2'>
                        <div className='text-[11px] text-muted-foreground'>Payment Period</div>
                        <div className='text-xs font-semibold'>
                          {formatDate(periodStart)} - {formatDate(periodEnd)}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {p.remarks ? (
                    <div className='mt-3 rounded-md border bg-muted/20 p-3'>
                      <div className='text-[11px] text-muted-foreground'>Remarks</div>
                      <div className='mt-1 text-xs text-muted-foreground'>{p.remarks}</div>
                    </div>
                  ) : null}

                  {p.tenant_unavailable_reason ? (
                    <div className='mt-3 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground'>
                      Tenant unavailable: {p.tenant_unavailable_reason}
                    </div>
                  ) : null}

                  <div className='mt-3 flex flex-col gap-2 sm:flex-row'>
                    <Button asChild variant='outline' className='justify-center' disabled={!canViewTenant}>
                      <Link to={canViewTenant ? `/tenants/${p.tenant_id}` : '#'}>View Details</Link>
                    </Button>
                    {p.status === 'PENDING' ? (
                      <Button type='button' onClick={() => askMarkAsPaid(p)} disabled={updatingStatus}>
                        Mark Paid
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <div className='mt-6 flex items-center justify-between gap-2'>
        <Button type='button' variant='outline' size='sm' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev}>
          Prev
        </Button>
        <div className='text-xs text-muted-foreground'>Page {page}</div>
        <Button type='button' variant='outline' size='sm' onClick={() => setPage((p) => p + 1)} disabled={!canNext}>
          Next
        </Button>
      </div>

      <AlertDialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Filters</AlertDialogTitle>
            <AlertDialogDescription>Filter payments by status and date.</AlertDialogDescription>
          </AlertDialogHeader>

          <div className='grid gap-3'>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Status</div>
              <Select value={draftStatus} onValueChange={(v) => setDraftStatus(v as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>All</SelectItem>
                  <SelectItem value='PAID'>Paid</SelectItem>
                  <SelectItem value='PARTIAL'>Partial</SelectItem>
                  <SelectItem value='PENDING'>Pending</SelectItem>
                  <SelectItem value='FAILED'>Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Quick Filter</div>
              <Select
                value={draftQuick}
                onValueChange={(v) => {
                  const next = v as QuickFilter
                  setDraftQuick(next)
                  if (next !== 'NONE') {
                    setDraftMonth(null)
                    setDraftYear(null)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select quick filter' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='NONE'>None</SelectItem>
                  <SelectItem value='LAST_WEEK'>Last Week</SelectItem>
                  <SelectItem value='LAST_MONTH'>Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='grid gap-2'>
                <div className='text-sm font-medium'>Month</div>
                <Select
                  value={draftMonth ?? ''}
                  onValueChange={(v) => {
                    const next = v || null
                    setDraftMonth(next)
                    if (next) setDraftQuick('NONE')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select month' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=''>All</SelectItem>
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <div className='text-sm font-medium'>Year</div>
                <Select
                  value={draftYear ? String(draftYear) : ''}
                  onValueChange={(v) => {
                    const next = v ? Number(v) : null
                    setDraftYear(Number.isFinite(next as number) ? (next as number) : null)
                    if (v) setDraftQuick('NONE')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select year' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=''>All</SelectItem>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='text-xs text-muted-foreground'>Month + Year will override quick filter.</div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFiltersOpen(false)}>Cancel</AlertDialogCancel>
            <Button type='button' variant='outline' onClick={clearFilters}>
              Clear
            </Button>
            <AlertDialogAction onClick={applyFilters}>Apply</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Paid</AlertDialogTitle>
            <AlertDialogDescription>
              Mark payment as paid for {markPaidTarget?.tenants?.name || (markPaidTarget ? `Tenant #${markPaidTarget.tenant_id}` : '')}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMarkPaidTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmMarkAsPaid()} disabled={updatingStatus}>
              {updatingStatus ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
