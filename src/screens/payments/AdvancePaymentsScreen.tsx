import { useMemo, useState } from 'react'
import {
  type AdvancePayment,
  type GetAdvancePaymentsParams,
  useGetAdvancePaymentsQuery,
} from '@/services/paymentsApi'
import { useAppSelector } from '@/store/hooks'
import {
  ArrowLeft,
  Calendar,
  CircleAlert,
  CreditCard,
  Filter,
  Home,
  Bed,
  MapPin,
  RefreshCw,
  DollarSign,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
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
import { PageHeader } from '@/components/form/page-header'

type StatusFilter = 'ALL' | 'PAID' | 'PARTIAL' | 'PENDING' | 'FAILED'

type ErrorLike = {
  data?: { message?: string }
  message?: string
}

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'

type QuickFilter = 'NONE' | 'LAST_WEEK' | 'LAST_MONTH'

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

const toISODate = (d: Date) => d.toISOString().split('T')[0]

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

const asArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : []

const readListData = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return undefined
  return (value as Record<string, unknown>)['data']
}

const readPagination = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return undefined
  return (value as Record<string, unknown>)['pagination']
}

export function AdvancePaymentsScreen() {
  const navigate = useNavigate()
  const selectedPGLocationId = useAppSelector(
    (s) => (s as any).pgLocations?.selectedPGLocationId
  ) as number | null

  const [page, setPage] = useState(1)
  const limit = 50

  const [filtersOpen, setFiltersOpen] = useState(false)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('NONE')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [draftStatus, setDraftStatus] = useState<StatusFilter>('ALL')
  const [draftMonth, setDraftMonth] = useState<string | null>(null)
  const [draftYear, setDraftYear] = useState<number | null>(null)
  const [draftQuick, setDraftQuick] = useState<QuickFilter>('NONE')
  const [draftStartDate, setDraftStartDate] = useState('')
  const [draftEndDate, setDraftEndDate] = useState('')

  const years = useMemo(() => {
    const y = new Date().getFullYear()
    return [y, y - 1, y - 2]
  }, [])

  const computedDates = useMemo(() => {
    if (quickFilter === 'NONE')
      return { start_date: undefined, end_date: undefined }
    const end = new Date()
    const start = new Date()
    if (quickFilter === 'LAST_WEEK') start.setDate(end.getDate() - 7)
    if (quickFilter === 'LAST_MONTH') start.setMonth(end.getMonth() - 1)
    return { start_date: toISODate(start), end_date: toISODate(end) }
  }, [quickFilter])

  const queryArgs = useMemo(() => {
    const params: GetAdvancePaymentsParams & { page: number; limit: number } = {
      page,
      limit,
    }

    if (statusFilter !== 'ALL') params.status = statusFilter

    if (selectedMonth && selectedYear) {
      params.month = selectedMonth
      params.year = selectedYear
    } else if (startDate || endDate) {
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
    } else if (computedDates.start_date && computedDates.end_date) {
      params.start_date = computedDates.start_date
      params.end_date = computedDates.end_date
    }

    return params
  }, [
    computedDates.end_date,
    computedDates.start_date,
    endDate,
    limit,
    page,
    selectedMonth,
    selectedYear,
    startDate,
    statusFilter,
  ])

  const {
    data: listResponse,
    isLoading,
    error,
    refetch,
  } = useGetAdvancePaymentsQuery(queryArgs, { skip: !selectedPGLocationId })

  const items = useMemo(() => {
    return asArray<AdvancePayment>(readListData(listResponse))
  }, [listResponse])

  const pagination = readPagination(listResponse) as
    | {
        total?: number
        page?: number
        limit?: number
        totalPages?: number
        hasMore?: boolean
      }
    | undefined

  const totalPages = Number(
    pagination?.totalPages ?? (pagination?.hasMore ? page + 1 : 1)
  )

  const fetchErrorMessage =
    (error as ErrorLike | undefined)?.data?.message ||
    (error as ErrorLike | undefined)?.message

  const canPrev = page > 1
  const canNext =
    Boolean(pagination?.hasMore) ||
    (Number.isFinite(totalPages) && page < totalPages)

  const filterCount = useMemo(() => {
    let c = 0
    if (statusFilter !== 'ALL') c++
    if (quickFilter !== 'NONE') c++
    if (selectedMonth || selectedYear) c++
    if (startDate || endDate) c++
    return c
  }, [
    endDate,
    quickFilter,
    selectedMonth,
    selectedYear,
    startDate,
    statusFilter,
  ])

  const openFilters = () => {
    setDraftStatus(statusFilter)
    setDraftMonth(selectedMonth)
    setDraftYear(selectedYear)
    setDraftQuick(quickFilter)
    setDraftStartDate(startDate)
    setDraftEndDate(endDate)
    setFiltersOpen(true)
  }

  const applyFilters = () => {
    setStatusFilter(draftStatus)
    setSelectedMonth(draftMonth)
    setSelectedYear(draftYear)
    setQuickFilter(draftQuick)
    setStartDate(draftStartDate)
    setEndDate(draftEndDate)
    setPage(1)
    setFiltersOpen(false)
  }

  const clearFilters = () => {
    setDraftStatus('ALL')
    setDraftMonth(null)
    setDraftYear(null)
    setDraftQuick('NONE')
    setDraftStartDate('')
    setDraftEndDate('')

    setStatusFilter('ALL')
    setSelectedMonth(null)
    setSelectedYear(null)
    setQuickFilter('NONE')
    setStartDate('')
    setEndDate('')
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
        title='Advance Payments'
        subtitle='Manage advances paid by tenants'
        right={
          <>
            <Button
              variant='outline'
              size='sm'
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              <RefreshCw className='me-2 size-4' />
              Refresh
            </Button>
            <Button variant='outline' size='sm' onClick={openFilters}>
              <Filter className='me-2 size-4' />
              Filters
              {filterCount > 0 ? (
                <Badge variant='secondary' className='ms-2'>
                  {filterCount}
                </Badge>
              ) : null}
            </Button>
          </>
        }
      />

      {!selectedPGLocationId ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>
          Select a PG location.
        </div>
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
          <div className='rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className='rounded-md border bg-card px-3 py-8 text-center'>
            <div className='text-base font-semibold'>No Payments</div>
            <div className='mt-1 text-xs text-muted-foreground'>
              No advance payments found.
            </div>
          </div>
        ) : (
          items.map((p) => {
            const tenantName = p.tenants?.name || `Tenant #${p.tenant_id}`
            const canViewTenant =
              Boolean(p.tenants) && !p.tenant_unavailable_reason
            const statusColor =
              p.status === 'PAID'
                ? 'bg-slate-700'
                : p.status === 'PARTIAL'
                  ? 'bg-orange-500'
                  : p.status === 'PENDING'
                    ? 'bg-amber-500'
                    : 'bg-red-500'

            return (
              <Card
                key={p.s_no}
                className='group cursor-pointer border-2 border-transparent bg-gradient-to-br from-white via-white to-slate-50 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200'
                onClick={() =>
                  canViewTenant && navigate(`/tenants/${p.tenant_id}`)
                }
              >
                <CardContent className='p-5'>
                  <div className='flex items-start gap-4'>
                    <div className='min-w-0 flex-1'>
                      <div className='mb-2 flex items-center gap-2'>
                        <div className='h-8 w-1 rounded-full bg-gradient-to-b from-slate-400 to-slate-300'></div>
                        <div>
                          <h3 className='text-lg font-bold text-foreground'>
                            {tenantName}
                          </h3>
                          {p.tenants?.phone_no && (
                            <p className='text-xs text-muted-foreground'>
                              {p.tenants.phone_no}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className='mt-3 grid grid-cols-2 gap-3'>
                        <div className='flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2'>
                          <Calendar className='h-4 w-4 text-slate-500' />
                          <span className='text-xs font-medium text-slate-700'>
                            {p.payment_date ? formatDate(p.payment_date) : '—'}
                          </span>
                        </div>
                        <div className='flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2'>
                          <CreditCard className='h-4 w-4 text-slate-500' />
                          <span className='text-xs font-medium text-slate-700'>
                            {String(p.payment_method ?? '')}
                          </span>
                        </div>
                        <div className='flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2'>
                          <Home className='h-4 w-4 text-slate-500' />
                          <span className='text-xs font-medium text-slate-700'>
                            Room {(p as any).rooms?.room_no || 'N/A'}
                          </span>
                        </div>
                        <div className='flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2'>
                          <Bed className='h-4 w-4 text-slate-500' />
                          <span className='text-xs font-medium text-slate-700'>
                            Bed {(p as any).beds?.bed_no || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className='mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 p-2'>
                        <MapPin className='h-4 w-4 text-slate-500' />
                        <span className='text-xs font-medium text-slate-700'>
                          {(p as any).pg_locations?.location_name || 'N/A'}
                        </span>
                      </div>

                      {(p as any).actual_rent_amount &&
                        (p as any).actual_rent_amount !== p.amount_paid && (
                          <div className='mt-2 flex items-center gap-2 text-xs text-muted-foreground'>
                            <DollarSign className='h-3 w-3' />
                            <span>
                              Actual Rent:{' '}
                              {formatMoney((p as any).actual_rent_amount)}
                            </span>
                          </div>
                        )}
                    </div>

                    <div className='flex flex-col items-end gap-2'>
                      <Badge
                        variant='outline'
                        className='border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700'
                      >
                        #{p.s_no}
                      </Badge>
                      <Badge
                        variant={statusBadgeVariant(p.status) as BadgeVariant}
                        className={`text-xs font-semibold ${statusColor} border-0 text-white`}
                      >
                        {String(p.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className='mt-4 border-t border-slate-200 pt-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-muted-foreground'>
                        Amount Paid
                      </span>
                      <div className='flex items-center gap-2'>
                        <span className='text-2xl font-bold text-slate-700'>
                          {formatMoney(p.amount_paid)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {p.remarks && (
                    <div className='mt-4 rounded-lg border-l-4 border-slate-400 bg-slate-50 p-3'>
                      <div className='mb-1 text-xs font-semibold text-muted-foreground'>
                        Remarks
                      </div>
                      <div className='text-sm'>{p.remarks}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <div className='mt-6 flex items-center justify-between gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!canPrev}
        >
          Prev
        </Button>
        <div className='text-xs text-muted-foreground'>Page {page}</div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setPage((p) => p + 1)}
          disabled={!canNext}
        >
          Next
        </Button>
      </div>

      <AlertDialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Filters</AlertDialogTitle>
            <AlertDialogDescription>
              Filter payments by status and date.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className='grid gap-3'>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Status</div>
              <Select
                value={draftStatus}
                onValueChange={(v) => setDraftStatus(v as StatusFilter)}
              >
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
                    setDraftStartDate('')
                    setDraftEndDate('')
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
                    if (next) {
                      setDraftQuick('NONE')
                      setDraftStartDate('')
                      setDraftEndDate('')
                    }
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
                    setDraftYear(
                      Number.isFinite(next as number) ? (next as number) : null
                    )
                    if (v) {
                      setDraftQuick('NONE')
                      setDraftStartDate('')
                      setDraftEndDate('')
                    }
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

            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='grid gap-2'>
                <div className='text-sm font-medium'>Start Date</div>
                <Input
                  type='date'
                  value={draftStartDate}
                  onChange={(e) => {
                    setDraftStartDate(e.target.value)
                    if (e.target.value) {
                      setDraftQuick('NONE')
                      setDraftMonth(null)
                      setDraftYear(null)
                    }
                  }}
                />
              </div>
              <div className='grid gap-2'>
                <div className='text-sm font-medium'>End Date</div>
                <Input
                  type='date'
                  value={draftEndDate}
                  onChange={(e) => {
                    setDraftEndDate(e.target.value)
                    if (e.target.value) {
                      setDraftQuick('NONE')
                      setDraftMonth(null)
                      setDraftYear(null)
                    }
                  }}
                />
              </div>
            </div>

            <div className='text-xs text-muted-foreground'>
              Month + Year or Date Range will override quick filter.
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFiltersOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button type='button' variant='outline' onClick={clearFilters}>
              Clear
            </Button>
            <AlertDialogAction onClick={applyFilters}>Apply</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
