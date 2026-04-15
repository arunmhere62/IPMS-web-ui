import { useEffect, useMemo, useReducer } from 'react'
import {
  type AdvancePayment,
  useLazyGetAdvancePaymentsQuery,
} from '@/services/paymentsApi'
import { useAppSelector } from '@/store/hooks'
import type { RootState } from '@/store/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  CircleAlert,
  CreditCard,
  Home,
  Bed,
  MapPin,
  DollarSign,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/form/page-header'

type ErrorLike = {
  data?: { message?: string }
  message?: string
}

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'

type PaymentsState = {
  page: number
  allPayments: AdvancePayment[]
  hasMore: boolean
  hasLoadedOnce: boolean
}

type PaymentsAction =
  | { type: 'RESET' }
  | { type: 'SET_PAGE'; page: number }
  | {
      type: 'ADD_PAYMENTS'
      page: number
      data: AdvancePayment[]
      hasMore: boolean
    }

function paymentsReducer(
  state: PaymentsState,
  action: PaymentsAction
): PaymentsState {
  switch (action.type) {
    case 'RESET': {
      return {
        page: 1,
        allPayments: [],
        hasMore: true,
        hasLoadedOnce: false,
      }
    }
    case 'SET_PAGE': {
      return {
        ...state,
        page: action.page,
      }
    }
    case 'ADD_PAYMENTS': {
      const existingIds = new Set(state.allPayments.map((p) => p.s_no))
      const newPayments = action.data.filter((p) => !existingIds.has(p.s_no))
      return {
        ...state,
        allPayments:
          action.page === 1
            ? action.data
            : [...state.allPayments, ...newPayments],
        hasMore: action.hasMore,
        hasLoadedOnce: true,
      }
    }
    default:
      return state
  }
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

const formatMoney = (value: unknown) => {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

const statusBadgeVariant = (status?: string) => {
  const s = String(status ?? '').toUpperCase()
  if (s === 'PAID') return 'default'
  if (s === 'PARTIAL') return 'secondary'
  if (s === 'PENDING') return 'outline'
  if (s === 'FAILED') return 'destructive'
  return 'outline'
}

export function AdvancePaymentsScreen() {
  const navigate = useNavigate()
  const selectedPGLocationId = useAppSelector(
    (s: RootState) => s.pgLocations?.selectedPGLocationId
  )

  const limit = 50
  const [state, dispatch] = useReducer(paymentsReducer, {
    page: 1,
    allPayments: [],
    hasMore: true,
    hasLoadedOnce: false,
  })

  const queryArgs = useMemo(() => {
    if (!selectedPGLocationId) return undefined

    return {
      page: state.page,
      limit,
    }
  }, [state.page, limit, selectedPGLocationId])

  const [trigger, { data: paymentsResponse, isLoading, isFetching, error }] =
    useLazyGetAdvancePaymentsQuery()

  // Reset state when location changes
  useEffect(() => {
    dispatch({ type: 'RESET' })
  }, [selectedPGLocationId])

  // Load initial data or when page changes
  useEffect(() => {
    if (selectedPGLocationId && queryArgs) {
      void trigger(queryArgs)
    }
  }, [trigger, selectedPGLocationId, queryArgs])

  const { isFetching: isInfiniteFetching, checkScroll } = useInfiniteScroll({
    hasMore: state.hasMore,
    isLoading: isFetching,
  })

  // Accumulate payments data when response changes
  useEffect(() => {
    if (paymentsResponse?.data) {
      dispatch({
        type: 'ADD_PAYMENTS',
        page: state.page,
        data: paymentsResponse.data,
        hasMore:
          (paymentsResponse.pagination as { hasMore?: boolean })?.hasMore ??
          false,
      })

      // Check if we need to load more immediately after data loads
      setTimeout(() => {
        checkScroll()
      }, 100)
    }
  }, [paymentsResponse, state.page, checkScroll])

  // Load more data when infinite scroll triggers
  useEffect(() => {
    if (
      isInfiniteFetching &&
      state.hasMore &&
      !isFetching &&
      selectedPGLocationId
    ) {
      const nextPage = state.page + 1
      dispatch({ type: 'SET_PAGE', page: nextPage })
      void trigger({
        ...queryArgs!,
        page: nextPage,
      })
    }
  }, [
    isInfiniteFetching,
    state.hasMore,
    isFetching,
    state.page,
    trigger,
    selectedPGLocationId,
    queryArgs,
  ])

  const payments = state.allPayments

  const fetchErrorMessage =
    (error as ErrorLike | undefined)?.data?.message ||
    (error as ErrorLike | undefined)?.message

  return (
    <div className='container mx-auto max-w-6xl px-3 py-6'>
      <PageHeader
        title='Advance Payments'
        subtitle='Manage advances paid by tenants'
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

      <div className='pb-16'>
        {isLoading ? (
          <div className='space-y-3'>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className='rounded-lg border bg-card p-5'
              >
                <div className='flex items-start gap-4'>
                  <div className='flex-1 space-y-3'>
                    <div className='h-6 w-32 animate-pulse rounded bg-gray-200'></div>
                    <div className='h-4 w-24 animate-pulse rounded bg-gray-200'></div>
                    <div className='grid grid-cols-2 gap-3'>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className='h-10 animate-pulse rounded bg-gray-200'
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className='flex flex-col gap-2'>
                    <div className='h-6 w-12 animate-pulse rounded bg-gray-200'></div>
                    <div className='h-6 w-16 animate-pulse rounded bg-gray-200'></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : payments.length === 0 && state.hasLoadedOnce ? (
          <div className='rounded-md border bg-card px-3 py-8 text-center'>
            <div className='text-base font-semibold'>No Payments</div>
            <div className='mt-1 text-xs text-muted-foreground'>
              No advance payments found.
            </div>
          </div>
        ) : (
          <div className='space-y-3'>
            <AnimatePresence>
              {payments.map((p, index) => {
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
                  <motion.div
                    key={`payment-${p.s_no}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      ease: 'easeOut',
                    }}
                  >
                    <Card
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
                                  {p.payment_date
                                    ? formatDate(p.payment_date)
                                    : '—'}
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
                                  Room {p.rooms?.room_no || 'N/A'}
                                </span>
                              </div>
                              <div className='flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2'>
                                <Bed className='h-4 w-4 text-slate-500' />
                                <span className='text-xs font-medium text-slate-700'>
                                  Bed {p.beds?.bed_no || 'N/A'}
                                </span>
                              </div>
                            </div>

                            <div className='mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 p-2'>
                              <MapPin className='h-4 w-4 text-slate-500' />
                              <span className='text-xs font-medium text-slate-700'>
                                {p.pg_locations?.location_name || 'N/A'}
                              </span>
                            </div>

                            {p.actual_rent_amount &&
                              p.actual_rent_amount !== p.amount_paid && (
                                <div className='mt-2 flex items-center gap-2 text-xs text-muted-foreground'>
                                  <DollarSign className='h-3 w-3' />
                                  <span>
                                    Actual Rent:{' '}
                                    {formatMoney(p.actual_rent_amount)}
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
                              variant={
                                statusBadgeVariant(p.status) as BadgeVariant
                              }
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
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Skeleton loading at the bottom */}
        <AnimatePresence>
          {(isFetching || (isInfiniteFetching && state.hasMore)) &&
            state.allPayments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className='mb-8 space-y-3'
              >
                {Array.from({ length: 2 }).map((_, index) => (
                  <motion.div
                    key={`skeleton-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <div className='rounded-lg border bg-card p-5'>
                      <div className='flex items-start gap-4'>
                        <div className='flex-1 space-y-3'>
                          <div className='h-6 w-32 animate-pulse rounded bg-gray-200'></div>
                          <div className='h-4 w-24 animate-pulse rounded bg-gray-200'></div>
                          <div className='grid grid-cols-2 gap-3'>
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className='h-10 animate-pulse rounded bg-gray-200'
                              ></div>
                            ))}
                          </div>
                        </div>
                        <div className='flex flex-col gap-2'>
                          <div className='h-6 w-12 animate-pulse rounded bg-gray-200'></div>
                          <div className='h-6 w-16 animate-pulse rounded bg-gray-200'></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
        </AnimatePresence>

        {/* End of data indicator */}
        <AnimatePresence>
          {!state.hasMore && state.allPayments.length > 0 && !isFetching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className='mt-8 mb-12 border-t py-4 text-center'
            >
              <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
                <motion.div
                  className='h-px max-w-16 flex-1 bg-border'
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                ></motion.div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  Showing all {state.allPayments.length} payments
                </motion.span>
                <motion.div
                  className='h-px max-w-16 flex-1 bg-border'
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                ></motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
