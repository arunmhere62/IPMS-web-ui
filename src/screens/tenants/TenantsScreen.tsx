import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, CircleAlert, Filter, Plus, Search, Users } from 'lucide-react'

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppDialog } from '@/components/form/app-dialog'
import { PageHeader } from '@/components/form/page-header'

import { useGetAllRoomsQuery, type Room } from '@/services/roomsApi'
import { useAppSelector } from '@/store/hooks'
import { useDeleteTenantMutation, useGetTenantsQuery, type Tenant } from '@/services/tenantsApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

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
  const selectedPGLocationId = useAppSelector((s) => s.pgLocations.selectedPGLocationId)

  const [expandedPaymentCards, setExpandedPaymentCards] = useState<Set<number>>(() => new Set())

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

  const [filtersOpen, setFiltersOpen] = useState(false)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [pendingRent, setPendingRent] = useState(false)
  const [pendingAdvance, setPendingAdvance] = useState(false)
  const [partialRent, setPartialRent] = useState(false)

  const [draftStatus, setDraftStatus] = useState<StatusFilter>('ALL')
  const [draftRoomId, setDraftRoomId] = useState<number | null>(null)
  const [draftPendingRent, setDraftPendingRent] = useState(false)
  const [draftPendingAdvance, setDraftPendingAdvance] = useState(false)
  const [draftPartialRent, setDraftPartialRent] = useState(false)

  const { data: roomsResponse } = useGetAllRoomsQuery(
    selectedPGLocationId ? { pg_id: selectedPGLocationId, limit: 200 } : undefined,
    { skip: !selectedPGLocationId }
  )

  const rooms = useMemo(() => asArray<Room>((roomsResponse as { data?: unknown } | undefined)?.data), [roomsResponse])

  const roomOptions = useMemo(
    () => [{ label: 'All Rooms', value: '' }, ...rooms.map((r) => ({ label: String(r.room_no), value: String(r.s_no) }))],
    [rooms]
  )

  const {
    data: tenantsResponse,
    isLoading,
    error,
    refetch,
  } = useGetTenantsQuery(
    selectedPGLocationId
      ? {
          page,
          limit,
          search: query.trim() ? query.trim() : undefined,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          room_id: selectedRoomId ?? undefined,
          pending_rent: pendingRent ? true : undefined,
          pending_advance: pendingAdvance ? true : undefined,
          partial_rent: partialRent ? true : undefined,
        }
      : undefined,
    { skip: !selectedPGLocationId }
  )

  const [deleteTenant, { isLoading: deleting }] = useDeleteTenantMutation()

  const tenants: Tenant[] = asArray<Tenant>((tenantsResponse as { data?: unknown } | undefined)?.data)

  const pagination = (tenantsResponse as { pagination?: unknown } | undefined)?.pagination as
    | {
        total?: number
        page?: number
        limit?: number
        totalPages?: number
        hasMore?: boolean
      }
    | undefined

  const total = Number(pagination?.total ?? tenants.length)
  const totalPages = Number(pagination?.totalPages ?? (pagination?.hasMore ? page + 1 : 1))

  const fetchErrorMessage = (error as ErrorLike | undefined)?.data?.message || (error as ErrorLike | undefined)?.message

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
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const canPrev = page > 1
  const canNext = Boolean(pagination?.hasMore) || (Number.isFinite(totalPages) && page < totalPages)

  const countLabel = useMemo(() => {
    if (!selectedPGLocationId) return 'Select PG'
    if (Number.isFinite(total) && total > 0) return `${total} Tenants`
    return `${tenants.length} Tenants`
  }, [selectedPGLocationId, tenants.length, total])

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

  const statusLabel = statusFilter === 'ALL' ? 'All' : statusFilter

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
        right={
          <>
            <Button asChild type='button' size='icon' aria-label='Add tenant' title='Add tenant' disabled={!selectedPGLocationId}>
              <Link to='/tenants/new'>
                <Plus className='size-4' />
              </Link>
            </Button>
            <Button variant='outline' size='sm' onClick={() => refetch()} disabled={!selectedPGLocationId}>
              Refresh
            </Button>
          </>
        }
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
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>Select a PG Location</div>
          <div className='mt-1 text-xs text-muted-foreground'>Choose a PG from the top bar to manage tenants.</div>
        </div>
      ) : (
        <>
          <div className='mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <div className='relative w-full sm:max-w-xs'>
              <Search className='pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground' />
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
              <Badge variant='secondary' className='h-7 px-2 text-xs'>
                {countLabel}
              </Badge>

              <Button
                variant={filterCount > 0 ? 'default' : 'outline'}
                size='sm'
                onClick={() => {
                  setDraftStatus(statusFilter)
                  setDraftRoomId(selectedRoomId)
                  setDraftPendingRent(pendingRent)
                  setDraftPendingAdvance(pendingAdvance)
                  setDraftPartialRent(partialRent)
                  setFiltersOpen(true)
                }}
              >
                <Filter className='me-2 size-4' />
                Filters
                {filterCount > 0 ? <span className='ms-2 text-xs font-semibold'>({filterCount})</span> : null}
              </Button>

              <Badge variant='outline' className='h-7 px-2 text-xs'>
                {activeRoomLabel} • {statusLabel}
              </Badge>
            </div>
          </div>

          <div className='mt-4'>
            {isLoading ? (
              <div className='rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>Loading...</div>
            ) : tenants.length === 0 ? (
              <div className='rounded-md border bg-card px-3 py-8 text-center'>
                <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-muted'>
                  <Users className='size-6 text-muted-foreground' />
                </div>
                <div className='mt-3 text-base font-semibold'>No Tenants</div>
                <div className='mt-1 text-xs text-muted-foreground'>Add your first tenant to get started.</div>
                <div className='mt-4'>
                  <Button asChild>
                    <Link to='/tenants/new'>Add Tenant</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {tenants.map((t) => {
                  const tenantImage = Array.isArray(t.images) && t.images.length > 0 ? (t.images[0] as string) : ''

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
                  const hasBothPartialAndPending = partialDueAmount > 0 && pendingDueAmount > 0
                  const hasPendingRent = pendingDueAmount > 0 || unpaidMonths.length > 0
                  const showPaymentDetails = expandedPaymentCards.has(t.s_no)

                  const leftBorderClass = hasOutstandingAmount
                    ? isRentPartial
                      ? 'border-l-orange-500'
                      : 'border-l-amber-500'
                    : 'border-l-transparent'

                  const leftBorderWidthClass = hasOutstandingAmount ? 'border-l-4' : 'border-l-0'

                  return (
                    <Card
                      key={t.s_no}
                      className={`h-full ${leftBorderWidthClass} ${leftBorderClass}`}
                    >
                      <CardContent className='flex h-full flex-col gap-3 p-4'>
                        <div className='flex items-start gap-3'>
                          <div className='h-14 w-14 shrink-0 overflow-hidden rounded-full bg-primary text-primary-foreground'>
                            {tenantImage ? (
                              <img src={tenantImage} alt='' className='h-full w-full object-cover' />
                            ) : (
                              <div className='grid h-full w-full place-items-center text-lg font-bold'>
                                {getInitial(t.name)}
                              </div>
                            )}
                          </div>

                          <div className='min-w-0 flex-1'>
                            <div className='flex items-start justify-between gap-2'>
                              <div className='min-w-0'>
                                <div className='truncate text-base font-bold'>{t.name || 'Tenant'}</div>
                                <div className='mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                                  {roomNo ? <span>🏠 {roomNo}</span> : null}
                                  {bedNo ? <span>🛏️ {bedNo}</span> : null}
                                  {typeof rentPrice === 'number' ? (
                                    <span className='font-semibold text-primary'>💰 ₹{rentPrice}/mo</span>
                                  ) : null}
                                </div>
                              </div>

                              <div className='shrink-0'>
                                <span
                                  className={
                                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ' +
                                    (t.status === 'ACTIVE'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : t.status === 'CHECKED_OUT'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-red-50 text-red-700 border border-red-200')
                                  }
                                >
                                  {t.status}
                                </span>
                              </div>
                            </div>

                            {occupation ? <div className='mt-2 text-sm text-muted-foreground'>💼 {occupation}</div> : null}
                          </div>
                        </div>

                        <div>
                          <div className='text-[11px] font-semibold text-muted-foreground'>Payment Status</div>
                          <div className='mt-2 flex flex-wrap items-center gap-2'>
                            {isRentPaid ? (
                              <span className='rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white'>✅ Rent PAID</span>
                            ) : null}
                            {isAdvancePaid ? (
                              <span className='rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white'>✅ Advance Paid</span>
                            ) : null}
                            {isRentPartial ? (
                              <span className='rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold text-white'>⏳ PARTIAL</span>
                            ) : null}
                            {hasPendingRent ? (
                              <span className='rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white'>📅 PENDING RENT</span>
                            ) : null}
                            {hasOutstandingAmount ? (
                              <span className='rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white'>₹{rentDueAmount} DUE</span>
                            ) : null}
                            {!isAdvancePaid ? (
                              <span className='rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white'>💰 NO ADVANCE</span>
                            ) : null}
                          </div>
                        </div>

                        {hasOutstandingAmount ? (
                          <div className={
                            'overflow-hidden rounded-lg border ' +
                            (isRentPartial ? 'border-orange-200 bg-orange-50' : 'border-amber-200 bg-amber-50')
                          }>
                            <button
                              type='button'
                              className='flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left'
                              onClick={() => togglePaymentDetails(t.s_no)}
                            >
                              <div className='min-w-0 flex-1'>
                                <div className={
                                  'truncate text-xs font-bold ' + (isRentPartial ? 'text-orange-600' : 'text-amber-700')
                                }>
                                  {hasBothPartialAndPending
                                    ? 'Partial + Pending'
                                    : isRentPartial
                                      ? 'Partial Payment'
                                      : 'Pending Payment'}
                                </div>
                                <div className='mt-0.5 truncate text-[11px] text-muted-foreground'>
                                  Due ₹{rentDueAmount}
                                  {unpaidMonths.length > 0 ? ` · ${unpaidMonths.length} month(s)` : ''}
                                  {!isAdvancePaid ? ' · No advance' : ''}
                                </div>
                              </div>
                              {showPaymentDetails ? (
                                <ChevronUp className={isRentPartial ? 'size-4 text-orange-600' : 'size-4 text-amber-700'} />
                              ) : (
                                <ChevronDown className={isRentPartial ? 'size-4 text-orange-600' : 'size-4 text-amber-700'} />
                              )}
                            </button>

                            {showPaymentDetails ? (
                              <div className='px-3 pb-3'>
                                {partialDueAmount > 0 && pendingDueAmount > 0 ? (
                                  <div className='mt-1 text-[11px] text-muted-foreground'>
                                    Partial: ₹{partialDueAmount} • Pending: ₹{pendingDueAmount}
                                  </div>
                                ) : null}

                                {unpaidMonths.length > 0 ? (
                                  <div className='mt-3'>
                                    <div className={
                                      'text-[11px] font-bold ' + (isRentPartial ? 'text-orange-600' : 'text-amber-700')
                                    }>
                                      Unpaid months
                                    </div>
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

                                {!isAdvancePaid ? (
                                  <div className='mt-3 text-[11px] text-muted-foreground'>No advance payment</div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        <div className='text-[11px] text-muted-foreground'>Check-in: {formatDate(t.check_in_date)}</div>

                        <div className='mt-auto flex flex-col gap-2 pt-1'>
                          <Button asChild className='w-full' disabled={!selectedPGLocationId}>
                            <Link to={`/tenants/${t.s_no}`}>View Details</Link>
                          </Button>
                          <div className='flex items-center justify-between'>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => navigate(`/tenants/${t.s_no}/edit`)}
                            >
                              Edit
                            </Button>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => askDelete(t)}
                              disabled={deleting}
                              className='border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive'
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            <div className='mt-5 flex items-center justify-between gap-2'>
              <Button variant='outline' size='sm' disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </Button>
              <div className='text-xs text-muted-foreground'>
                Page {page}
                {Number.isFinite(totalPages) && totalPages > 0 ? ` / ${totalPages}` : ''}
              </div>
              <Button variant='outline' size='sm' disabled={!canNext} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className='font-semibold'>{deleteTarget?.name}</span>? This action cannot be undone.
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

      <AppDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title='Filters'
        description='Filter tenants by status, room and dues.'
        size='sm'
        footer={
          <div className='flex w-full justify-end gap-2 px-3 pb-3'>
            {filterCount > 0 ? (
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setStatusFilter('ALL')
                  setSelectedRoomId(null)
                  setPendingRent(false)
                  setPendingAdvance(false)
                  setPartialRent(false)
                  setFiltersOpen(false)
                  setPage(1)
                  void refetch()
                }}
              >
                Clear
              </Button>
            ) : null}

            <Button
              type='button'
              onClick={() => {
                setStatusFilter(draftStatus)
                setSelectedRoomId(draftRoomId)
                setPendingRent(draftPendingRent)
                setPendingAdvance(draftPendingAdvance)
                setPartialRent(draftPartialRent)
                setFiltersOpen(false)
                setPage(1)
                void refetch()
              }}
            >
              Apply
            </Button>
          </div>
        }
      >
        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <div className='text-sm font-medium'>Status</div>
            <Select value={draftStatus} onValueChange={(v) => setDraftStatus(v as StatusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder='All' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All</SelectItem>
                <SelectItem value='ACTIVE'>Active</SelectItem>
                <SelectItem value='INACTIVE'>Inactive</SelectItem>
                <SelectItem value='CHECKED_OUT'>Checked Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid gap-2'>
            <div className='text-sm font-medium'>Room</div>
            <Select
              value={draftRoomId ? String(draftRoomId) : ''}
              onValueChange={(v) => {
                const id = v ? Number(v) : NaN
                setDraftRoomId(Number.isFinite(id) && id > 0 ? id : null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder='All Rooms' />
              </SelectTrigger>
              <SelectContent>
                {roomOptions.map((o) => (
                  <SelectItem key={String(o.value)} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='grid gap-2'>
            <div className='text-sm font-medium'>Dues</div>
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                variant={draftPendingRent ? 'default' : 'outline'}
                size='sm'
                onClick={() => setDraftPendingRent((v) => !v)}
              >
                Pending Rent
              </Button>
              <Button
                type='button'
                variant={draftPartialRent ? 'default' : 'outline'}
                size='sm'
                onClick={() => setDraftPartialRent((v) => !v)}
              >
                Partial Rent
              </Button>
              <Button
                type='button'
                variant={draftPendingAdvance ? 'default' : 'outline'}
                size='sm'
                onClick={() => setDraftPendingAdvance((v) => !v)}
              >
                Pending Advance
              </Button>
            </div>
          </div>
        </div>
      </AppDialog>
    </div>
  )
}
