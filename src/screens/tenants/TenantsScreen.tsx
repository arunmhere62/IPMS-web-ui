import { useEffect, useMemo, useState, useRef } from 'react'
import {
  useGetAllRoomsQuery,
  type Room,
} from '@/services/roomsApi'
import {
  useDeleteTenantMutation,
  useLazyGetTenantsQuery,
  type Tenant,
} from '@/services/tenantsApi'
import { useAppSelector } from '@/store/hooks'
import {
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Filter,
  Search,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
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
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/form/page-header'
import { motion, AnimatePresence } from 'framer-motion'
import { RoomSkeleton } from '@/components/ui/room-skeleton'
import { TenantFilterModal } from '@/components/tenants/TenantFilterModal'

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'CHECKED_OUT'

const asArray = <T,>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : []
}

type UnpaidMonth = {
  month_name?: string
  cycle_start?: string
  cycle_end?: string
}

const getUnpaidMonths = (t: unknown): UnpaidMonth[] => {
  if (!t || typeof t !== 'object') return []
  const v = (t as Record<string, unknown>)['unpaid_months']
  return asArray<UnpaidMonth>(v)
}

type ErrorLike = {
  data?: {
    message?: string
  }
  message?: string
}

export function TenantsScreen() {
  const navigate = useNavigate()
  const selectedPGLocationId = useAppSelector(
    (s) => s.pgLocations.selectedPGLocationId
  )

  const [expandedPaymentCards, setExpandedPaymentCards] = useState<Set<number>>(
    () => new Set()
  )

  const togglePaymentDetails = (tenantId: number) => {
    setExpandedPaymentCards((prev) => {
      const next = new Set(prev)
      if (next.has(tenantId)) next.delete(tenantId)
      else next.add(tenantId)
      return next
    })
  }

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20
  const [allTenants, setAllTenants] = useState<Tenant[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  const [filtersOpen, setFiltersOpen] = useState(false)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [pendingRent, setPendingRent] = useState(false)
  const [pendingAdvance, setPendingAdvance] = useState(false)
  const [partialRent, setPartialRent] = useState(false)

  const { data: roomsResponse } = useGetAllRoomsQuery(
    selectedPGLocationId
      ? { limit: 200 }
      : undefined,
    { skip: !selectedPGLocationId }
  )

  const rooms: Room[] = asArray<Room>((roomsResponse as { data?: unknown } | undefined)?.data)

  const roomOptions = useMemo(
    () => rooms.map((r) => ({
      label: String(r.room_no),
      value: String(r.s_no),
    })),
    [rooms]
  )

  const queryOptions = useMemo(
    () => ({
      page,
      limit,
      search: query.trim() ? query.trim() : undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      room_id: selectedRoomId ?? undefined,
      pending_rent: pendingRent ? true : undefined,
      pending_advance: pendingAdvance ? true : undefined,
      partial_rent: partialRent ? true : undefined,
    }),
    [page, limit, query, statusFilter, selectedRoomId, pendingRent, pendingAdvance, partialRent],
  )

  const [trigger, { data: tenantsResponse, isFetching, error }] = useLazyGetTenantsQuery()

  useEffect(() => {
    if (selectedPGLocationId && queryOptions) {
      void trigger(queryOptions)
    }
  }, [trigger, queryOptions, selectedPGLocationId])

  const { isFetching: isInfiniteFetching, checkScroll } = useInfiniteScroll({
    hasMore,
    isLoading: isFetching,
  })

  // Accumulate tenants data when response changes
  useEffect(() => {
    if (tenantsResponse?.data) {
      if (page === 1) {
        setAllTenants(tenantsResponse.data)
      } else {
        setAllTenants((prev) => {
          const existingIds = new Set(prev.map((tenant) => tenant.s_no))
          const newTenants = tenantsResponse.data.filter((tenant) => !existingIds.has(tenant.s_no))
          return [...prev, ...newTenants]
        })
      }
      setHasMore(tenantsResponse.pagination?.hasMore ?? false)
      setHasLoadedOnce(true)

      // Check if we need to load more immediately after data loads
      setTimeout(() => {
        checkScroll()
      }, 100)
    }
  }, [tenantsResponse, page, checkScroll])

  // Load more data when infinite scroll triggers
  useEffect(() => {
    if (isInfiniteFetching && hasMore && !isFetching && selectedPGLocationId) {
      const nextPage = page + 1
      setPage(nextPage)
      void trigger({
        ...queryOptions,
        page: nextPage,
      })
    }
  }, [isInfiniteFetching, hasMore, isFetching, page, trigger, queryOptions, selectedPGLocationId])

  const tenants = allTenants
  const isLoading = isFetching && !hasLoadedOnce

  const [deleteTenant, { isLoading: deleting }] = useDeleteTenantMutation()

  const pagination = (tenantsResponse as { pagination?: unknown } | undefined)
    ?.pagination as
    | {
        total?: number
        page?: number
        limit?: number
        totalPages?: number
        hasMore?: boolean
      }
    | undefined

  const total = Number(pagination?.total ?? tenants.length)

  const fetchErrorMessage =
    (error as ErrorLike | undefined)?.data?.message ||
    (error as ErrorLike | undefined)?.message

  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const askDelete = (t: Tenant) => {
    setDeleteTarget(t)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteTenant(deleteTarget.s_no).unwrap()
      showSuccessAlert('Tenant deleted successfully')
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      void trigger(queryOptions)
    } catch (e: unknown) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const filterCount =
    Number(statusFilter !== 'ALL') +
    Number(Boolean(selectedRoomId)) +
    Number(pendingRent) +
    Number(pendingAdvance) +
    Number(partialRent)

  const activeRoomLabel = useMemo(() => {
    if (!selectedRoomId) return 'All Rooms'
    const room = rooms.find((r) => Number(r.s_no) === Number(selectedRoomId))
    return room?.room_no ? String(room.room_no) : `Room #${selectedRoomId}`
  }, [rooms, selectedRoomId])

  const statusLabel = statusFilter === 'ALL' ? 'All' : statusFilter === 'ACTIVE' ? 'Occupied' : statusFilter

  const getInitial = (name?: string) => {
    const n = String(name ?? '').trim()
    return n ? n.charAt(0).toUpperCase() : 'T'
  }

  const formatDate = (raw?: string) => {
    if (!raw) return ''
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return String(raw).split('T')[0]
    try {
      return d.toLocaleDateString('en-IN')
    } catch {
      return String(raw).split('T')[0]
    }
  }

  return (
    <div className='container mx-auto max-w-6xl px-3 py-6'>
      <PageHeader
        title='Tenants'
        subtitle='Manage tenants in your PG'
        right={null}
      />

      {fetchErrorMessage ? (
        <div className='mt-6'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load tenants</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <div className='mt-4'>
          <EmptyState
            icon={Users}
            title='Select a PG Location'
            description='Choose a PG from the top bar to manage tenants.'
          />
        </div>
      ) : (
        <>
          <div className='mt-4 flex flex-row gap-2 items-start sm:flex-col sm:items-start'>
            <div className='relative w-full sm:max-w-xs'>
              <Search className='pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground' />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder='Search by name, phone'
                className='h-8 pl-8 text-sm'
              />
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <Button
                variant={filterCount > 0 ? 'default' : 'outline'}
                size='sm'
                onClick={() => setFiltersOpen(true)}
              >
                <Filter className='me-2 size-4' />
                Filters
                {filterCount > 0 ? (
                  <span className='ms-2 text-xs font-semibold'>
                    ({filterCount})
                  </span>
                ) : null}
              </Button>

              <Badge variant='outline' className='h-7 px-2 text-xs'>
                {activeRoomLabel} · {statusLabel}
              </Badge>
            </div>
          </div>

          {/* Floating Count Display */}
          {selectedPGLocationId && (Number.isFinite(total) && total > 0) && (
            <div className='fixed bottom-6 right-6 z-50'>
              <div className='bg-primary text-primary-foreground rounded-full px-4 py-2 shadow-lg border-2 border-background'>
                <div className='text-sm font-bold'>
                  {tenants.length}/{total}
                </div>
                <div className='text-xs opacity-90'>
                  Tenants
                </div>
              </div>
            </div>
          )}

          <div className='mt-4'>
            {isLoading ? (
              <div className='rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>
                Loading...
              </div>
            ) : tenants.length === 0 ? (
              <EmptyState
                icon={Users}
                title='No Tenants'
                description='Tenants can be added from bed details pages.'
              />
            ) : (
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                <AnimatePresence>
                  {tenants.map((t, index) => {
                  const tenantImage =
                    Array.isArray(t.images) && t.images.length > 0
                      ? (t.images[0] as string)
                      : ''

                  const roomNo = t.rooms?.room_no
                  const bedNo = t.beds?.bed_no
                  const rentPrice = t.rooms?.rent_price
                  const occupation = t.occupation

                  const isRentPaid = Boolean(t.is_rent_paid)
                  const isRentPartial = Boolean(t.is_rent_partial)
                  const rentDueAmount = Number(t.rent_due_amount ?? 0)
                  const partialDueAmount = Number(t.partial_due_amount ?? 0)
                  const pendingDueAmount = Number(t.pending_due_amount ?? 0)
                  const isAdvancePaid = Boolean(t.is_advance_paid)
                  const unpaidMonths = getUnpaidMonths(t)

                  const hasOutstandingAmount = rentDueAmount > 0
                  const hasBothPartialAndPending =
                    partialDueAmount > 0 && pendingDueAmount > 0
                  const showPaymentDetails = expandedPaymentCards.has(t.s_no)

                  const leftBorderClass = hasOutstandingAmount
                    ? isRentPartial
                      ? 'border-l-orange-500'
                      : 'border-l-amber-500'
                    : 'border-l-transparent'

                  const leftBorderWidthClass = hasOutstandingAmount
                    ? 'border-l-4'
                    : 'border-l-0'

                  return (
                    <motion.div
                      key={`tenant-${t.s_no}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                        ease: "easeOut"
                      }}
                    >
                      <Card
                        className={`h-full py-0 ${leftBorderWidthClass} ${leftBorderClass}`}
                      >
                      <CardContent className='flex h-full flex-col gap-3 p-4'>
                        <div className='flex items-start gap-3'>
                          <div className='h-14 w-14 shrink-0 overflow-hidden rounded-full bg-primary text-primary-foreground'>
                            {tenantImage ? (
                              <img
                                src={tenantImage}
                                alt=''
                                className='h-full w-full object-cover'
                              />
                            ) : (
                              <div className='grid h-full w-full place-items-center text-lg font-bold'>
                                {getInitial(t.name)}
                              </div>
                            )}
                          </div>

                          <div className='min-w-0 flex-1'>
                            <div className='flex items-start justify-between gap-2'>
                              <div className='min-w-0'>
                                <div className='truncate text-base font-bold'>
                                  {t.name || 'Tenant'}
                                </div>
                                <div className='mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                                  {roomNo ? <span>🏠 {roomNo}</span> : null}
                                  {bedNo ? <span>🛏️ {bedNo}</span> : null}
                                  {typeof rentPrice === 'number' ? (
                                    <span className='font-semibold text-primary'>
                                      💰 ₹{rentPrice}/mo
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div className='shrink-0'>
                                <span
                                  className={
                                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ' +
                                    (t.status === 'ACTIVE'
                                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                      : t.status === 'CHECKED_OUT'
                                        ? 'border border-amber-200 bg-amber-50 text-amber-700'
                                        : 'border border-red-200 bg-red-50 text-red-700')
                                  }
                                >
                                  {t.status}
                                </span>
                              </div>
                            </div>

                            {occupation ? (
                              <div className='mt-2 text-sm text-muted-foreground'>
                                💼 {occupation}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div>
                          <div className='text-[11px] font-semibold text-muted-foreground'>
                            Payment Status
                          </div>
                          <div className='mt-2 flex flex-wrap items-center gap-2'>
                            {isRentPaid ? (
                              <span className='rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white'>
                                ✅ Rent PAID
                              </span>
                            ) : null}
                            {isAdvancePaid ? (
                              <span className='rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white'>
                                ✅ Advance Paid
                              </span>
                            ) : null}
                            {isRentPartial ? (
                              <span className='rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold text-white'>
                                ⏳ PARTIAL
                              </span>
                            ) : null}
                            {!isRentPaid ? (
                              <span className='rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white'>
                                📅 PENDING RENT
                              </span>
                            ) : null}
                            {hasOutstandingAmount ? (
                              <span className='rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white'>
                                ₹{rentDueAmount} DUE
                              </span>
                            ) : null}
                            {!isAdvancePaid ? (
                              <span className='rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white'>
                                💰 NO ADVANCE
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {hasOutstandingAmount ? (
                          <div
                            className={
                              'overflow-hidden rounded-lg border ' +
                              (isRentPartial
                                ? 'border-orange-200 bg-orange-50'
                                : 'border-amber-200 bg-amber-50')
                            }
                          >
                            <button
                              type='button'
                              className='flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left'
                              onClick={() => togglePaymentDetails(t.s_no)}
                            >
                              <div className='min-w-0 flex-1'>
                                <div
                                  className={
                                    'truncate text-xs font-bold ' +
                                    (isRentPartial
                                      ? 'text-orange-600'
                                      : 'text-amber-700')
                                  }
                                >
                                  {hasBothPartialAndPending
                                    ? 'Partial + Pending'
                                    : isRentPartial
                                      ? 'Partial Payment'
                                      : 'Pending Payment'}
                                </div>
                                <div className='mt-0.5 truncate text-[11px] text-muted-foreground'>
                                  Due ₹{rentDueAmount}
                                  {unpaidMonths.length > 0
                                    ? ` · ${unpaidMonths.length} month(s)`
                                    : ''}
                                  {!isAdvancePaid ? ' · No advance' : ''}
                                </div>
                              </div>
                              {showPaymentDetails ? (
                                <ChevronUp
                                  className={
                                    isRentPartial
                                      ? 'size-4 text-orange-600'
                                      : 'size-4 text-amber-700'
                                  }
                                />
                              ) : (
                                <ChevronDown
                                  className={
                                    isRentPartial
                                      ? 'size-4 text-orange-600'
                                      : 'size-4 text-amber-700'
                                  }
                                />
                              )}
                            </button>

                            {showPaymentDetails ? (
                              <div className='px-3 pb-3'>
                                {partialDueAmount > 0 &&
                                pendingDueAmount > 0 ? (
                                  <div className='mt-1 text-[11px] text-muted-foreground'>
                                    Partial: ₹{partialDueAmount} • Pending: ₹
                                    {pendingDueAmount}
                                  </div>
                                ) : null}

                                {unpaidMonths.length > 0 ? (
                                  <div className='mt-3'>
                                    <div
                                      className={
                                        'text-[11px] font-bold ' +
                                        (isRentPartial
                                          ? 'text-orange-600'
                                          : 'text-amber-700')
                                      }
                                    >
                                      Unpaid months
                                    </div>
                                    {unpaidMonths.slice(0, 2).map((m, idx) => (
                                      <div
                                        key={String(idx)}
                                        className='mt-1 text-[10px] text-muted-foreground'
                                      >
                                        {m.month_name ? m.month_name : 'Month'}
                                        {m.cycle_start && m.cycle_end
                                          ? ` (${m.cycle_start} to ${m.cycle_end})`
                                          : ''}
                                      </div>
                                    ))}
                                    {unpaidMonths.length > 2 ? (
                                      <div className='mt-1 text-[10px] text-muted-foreground'>
                                        +{unpaidMonths.length - 2} more
                                      </div>
                                    ) : null}
                                  </div>
                                ) : null}

                                {!isAdvancePaid ? (
                                  <div className='mt-3 text-[11px] text-muted-foreground'>
                                    No advance payment
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        <div className='text-[11px] text-muted-foreground'>
                          Check-in: {formatDate(t.check_in_date)}
                        </div>

                        <div className='mt-auto flex flex-col gap-2 pt-1'>
                          <Button
                            asChild
                            className='w-full'
                            disabled={!selectedPGLocationId}
                          >
                            <Link to={`/tenants/${t.s_no}`}>View Details</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    </motion.div>
                  )
                })}
                </AnimatePresence>
              </div>
            )}

            {allTenants.length > 0 && (
              <>
                {/* Skeleton loading at the bottom */}
                <AnimatePresence>
                  {(isFetching || (isInfiniteFetching && hasMore)) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className='space-y-2 mb-8'
                    >
                      {Array.from({ length: 2 }).map((_, index) => (
                        <motion.div
                          key={`skeleton-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                        >
                          <RoomSkeleton />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* End of data indicator */}
                <AnimatePresence>
                  {!hasMore && allTenants.length > 0 && !isFetching && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className='mt-8 mb-12 text-center py-4 border-t'
                    >
                      <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
                        <motion.div
                          className='h-px bg-border flex-1 max-w-16'
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        ></motion.div>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.3 }}
                        >
                          Showing all {allTenants.length} tenants
                        </motion.span>
                        <motion.div
                          className='h-px bg-border flex-1 max-w-16'
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        ></motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>{deleteTarget?.name}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteTarget(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TenantFilterModal
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        statusFilter={statusFilter}
        selectedRoomId={selectedRoomId}
        pendingRent={pendingRent}
        pendingAdvance={pendingAdvance}
        partialRent={partialRent}
        roomOptions={roomOptions}
        onStatusFilterChange={setStatusFilter}
        onRoomChange={setSelectedRoomId}
        onPendingRentChange={setPendingRent}
        onPendingAdvanceChange={setPendingAdvance}
        onPartialRentChange={setPartialRent}
        onClear={() => {
          setStatusFilter('ALL')
          setSelectedRoomId(null)
          setPendingRent(false)
          setPendingAdvance(false)
          setPartialRent(false)
          setPage(1)
          setAllTenants([])
          void trigger(queryOptions)
        }}
        onApply={() => {
          setPage(1)
          setAllTenants([])
          void trigger(queryOptions)
        }}
      />
    </div>
  )
}
