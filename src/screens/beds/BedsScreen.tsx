import { useMemo, useState } from 'react'
import {
  type Bed,
  type Room,
  useDeleteBedMutation,
  useGetAllBedsQuery,
  useGetAllRoomsQuery,
} from '@/services/roomsApi'
import { useAppSelector } from '@/store/hooks'
import { Bed as BedIcon, CircleAlert, Filter, Search, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { ActionButtons } from '@/components/form/action-buttons'
import { BedFormDialog } from './BedFormDialog'

type OccupancyFilter = 'all' | 'occupied' | 'available'

type ErrorLike = {
  data?: { message?: string }
  message?: string
}

export function BedsScreen() {
  const navigate = useNavigate()
  const selectedPGLocationId = useAppSelector(
    (s) => s.pgLocations?.selectedPGLocationId
  ) as number | null

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [occupancyFilter, setOccupancyFilter] = useState<OccupancyFilter>('all')

  const [draftRoomId, setDraftRoomId] = useState<number | null>(null)
  const [draftOccupancy, setDraftOccupancy] = useState<OccupancyFilter>('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Bed | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Bed | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { data: roomsResponse } = useGetAllRoomsQuery(
    selectedPGLocationId
      ? { pg_id: selectedPGLocationId, limit: 200 }
      : undefined,
    { skip: !selectedPGLocationId }
  )

  const rooms: Room[] = useMemo(() => {
    return Array.isArray(roomsResponse?.data) ? roomsResponse.data : []
  }, [roomsResponse])

  const onlyUnoccupied = occupancyFilter === 'available' ? true : undefined

  const {
    data: bedsResponse,
    isLoading,
    error,
    refetch,
  } = useGetAllBedsQuery(
    selectedPGLocationId
      ? {
          page,
          limit,
          pg_id: selectedPGLocationId,
          room_id: selectedRoomId ?? undefined,
          search: query.trim() ? query.trim() : undefined,
          only_unoccupied: onlyUnoccupied,
        }
      : undefined,
    { skip: !selectedPGLocationId }
  )

  const [deleteBed, { isLoading: deleting }] = useDeleteBedMutation()

  const allBeds: Bed[] = useMemo(() => {
    return Array.isArray(bedsResponse?.data) ? (bedsResponse.data as Bed[]) : []
  }, [bedsResponse])

  const beds = useMemo(() => {
    if (occupancyFilter !== 'occupied') return allBeds
    return allBeds.filter((b) => Boolean(b.is_occupied))
  }, [allBeds, occupancyFilter])

  const pagination:
    | {
        total?: number
        page?: number
        limit?: number
        totalPages?: number
        hasMore?: boolean
      }
    | undefined = bedsResponse?.pagination

  const total = Number(pagination?.total ?? beds.length)
  const totalPages = Number(
    pagination?.totalPages ?? (pagination?.hasMore ? page + 1 : 1)
  )

  const fetchErrorMessage =
    (error as ErrorLike | undefined)?.data?.message ||
    (error as ErrorLike | undefined)?.message

  const filterCount =
    Number(selectedRoomId ? 1 : 0) + Number(occupancyFilter !== 'all')

  const openEdit = (b: Bed) => {
    setEditTarget(b)
    setDialogOpen(true)
  }

  const askDelete = (b: Bed) => {
    setDeleteTarget(b)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteBed(deleteTarget.s_no).unwrap()
      showSuccessAlert('Bed deleted successfully')
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const canPrev = page > 1
  const canNext =
    Boolean(pagination?.hasMore) ||
    (Number.isFinite(totalPages) && page < totalPages)

  const occupancyLabel =
    occupancyFilter === 'all'
      ? 'All'
      : occupancyFilter === 'occupied'
        ? 'Occupied'
        : 'Available'

  const activeRoomLabel = useMemo(() => {
    if (!selectedRoomId) return 'All Rooms'
    const room = rooms.find((r) => Number(r.s_no) === Number(selectedRoomId))
    return room?.room_no ? String(room.room_no) : `Room #${selectedRoomId}`
  }, [rooms, selectedRoomId])

  return (
    <div className='container mx-auto max-w-7xl px-4 py-4'>
      <div className='mb-4 flex items-center justify-between border-b pb-3'>
        <div>
          <h1 className='text-2xl font-bold'>Beds</h1>
          <p className='text-xs text-muted-foreground'>
            Manage beds in your PG
          </p>
        </div>
      </div>

      {fetchErrorMessage ? (
        <div className='mb-3'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load beds</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <EmptyState
          icon={BedIcon}
          title='Select a PG Location'
          description='Choose a PG from the top bar.'
        />
      ) : (
        <>
          <div className='mb-3 flex items-center justify-between gap-3'>
            <div className='relative max-w-sm flex-1'>
              <Search className='pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder='Search beds...'
                className='h-8 pl-8 text-sm'
              />
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setDraftRoomId(selectedRoomId)
                  setDraftOccupancy(occupancyFilter)
                  setFiltersOpen(true)
                }}
              >
                <Filter className='mr-1 size-3.5' />
                Filters
                {filterCount > 0 ? (
                  <Badge
                    variant='secondary'
                    className='ml-1 h-4 px-1.5 text-xs'
                  >
                    {filterCount}
                  </Badge>
                ) : null}
              </Button>
              <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <BedIcon className='size-3.5' />
                <span>
                  {Number.isFinite(total) && total > 0
                    ? `${total} Beds`
                    : `${beds.length} Beds`}
                </span>
              </div>
            </div>
          </div>

          {filterCount > 0 && (
            <div className='mt-2 flex items-center gap-2'>
              <span className='text-xs text-muted-foreground'>Filters:</span>
              <Badge variant='outline' className='text-xs'>
                {activeRoomLabel}
              </Badge>
              <Badge variant='outline' className='text-xs'>
                {occupancyLabel}
              </Badge>
            </div>
          )}

          <div>
            {isLoading ? (
              <div className='rounded-lg border bg-card px-4 py-8 text-center'>
                <div className='mx-auto size-6 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
                <p className='mt-2 text-xs text-muted-foreground'>Loading...</p>
              </div>
            ) : beds.length === 0 ? (
              <EmptyState
                icon={BedIcon}
                title='No Beds Found'
                description={
                  query
                    ? 'Try adjusting your search or filters.'
                    : 'Go to a room details page to add beds.'
                }
              />
            ) : (
              <div className='space-y-2'>
                {beds.map((b) => {
                  const isOccupied = Boolean(b.is_occupied)
                  const tenant = b.tenants?.[0]
                  return (
                    <Card
                      key={b.s_no}
                      className='cursor-pointer py-0 transition-colors hover:border-green-500/50'
                      onClick={() => navigate(`/beds/${b.s_no}`)}
                    >
                      <CardContent className='p-3'>
                        {/* Mobile Layout (< md) */}
                        <div className='space-y-3 md:hidden'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <div className='flex size-9 items-center justify-center rounded-lg bg-green-600 text-white'>
                                <BedIcon className='size-4' />
                              </div>
                              <div>
                                <h3 className='text-sm font-semibold'>
                                  Bed {b.bed_no}
                                </h3>
                                <div className='text-xs text-muted-foreground'>
                                  Room {b.rooms?.room_no ?? b.room_id}
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant={isOccupied ? 'secondary' : 'default'}
                              className='text-xs'
                            >
                              {isOccupied ? 'Occupied' : 'Available'}
                            </Badge>
                          </div>

                          <div className='grid grid-cols-2 gap-2 text-xs'>
                            <div>
                              <div className='text-muted-foreground'>Price</div>
                              <div className='font-medium'>
                                {b.bed_price != null &&
                                String(b.bed_price).length > 0
                                  ? `₹${String(b.bed_price)}`
                                  : '—'}
                              </div>
                            </div>
                            <div>
                              <div className='text-muted-foreground'>ID</div>
                              <div className='font-medium'>{b.s_no}</div>
                            </div>
                          </div>

                          {tenant?.name && (
                            <div className='flex items-center gap-2 rounded border bg-muted/30 p-2'>
                              <User className='size-3.5 text-muted-foreground' />
                              <span className='truncate text-xs'>
                                {tenant.name}
                                {tenant.phone_no ? ` • ${tenant.phone_no}` : ''}
                              </span>
                            </div>
                          )}

                          <div
                            className='flex justify-end border-t pt-2'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ActionButtons
                              mode='icon'
                              onEdit={() => openEdit(b)}
                              onDelete={() => askDelete(b)}
                            />
                          </div>
                        </div>

                        {/* Desktop Layout (>= md) */}
                        <div className='hidden items-center gap-3 md:flex'>
                          <div className='flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-600 text-white'>
                            <BedIcon className='size-4' />
                          </div>

                          <div className='min-w-0 flex-1'>
                            <div className='mb-1 flex items-center gap-2'>
                              <h3 className='truncate text-sm font-semibold'>
                                Bed {b.bed_no}
                              </h3>
                              <Badge
                                variant={isOccupied ? 'secondary' : 'default'}
                                className='text-xs'
                              >
                                {isOccupied ? 'Occupied' : 'Available'}
                              </Badge>
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              Room {b.rooms?.room_no ?? b.room_id} • ID:{' '}
                              {b.s_no}
                            </div>
                          </div>

                          <div className='hidden items-center gap-4 text-xs lg:flex'>
                            <div className='text-center'>
                              <div className='text-sm font-medium'>
                                {b.bed_price != null &&
                                String(b.bed_price).length > 0
                                  ? `₹${String(b.bed_price)}`
                                  : '—'}
                              </div>
                              <div className='text-muted-foreground'>Price</div>
                            </div>
                            {tenant?.name && (
                              <div className='max-w-32 text-center'>
                                <div className='truncate text-sm font-medium'>
                                  {tenant.name}
                                </div>
                                <div className='text-muted-foreground'>
                                  Tenant
                                </div>
                              </div>
                            )}
                          </div>

                          {tenant?.name && (
                            <div className='flex max-w-40 min-w-0 items-center gap-2 lg:hidden'>
                              <User className='size-3.5 flex-shrink-0 text-muted-foreground' />
                              <span className='truncate text-xs'>
                                {tenant.name}
                              </span>
                            </div>
                          )}

                          <div
                            className='flex-shrink-0'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ActionButtons
                              mode='icon'
                              onEdit={() => openEdit(b)}
                              onDelete={() => askDelete(b)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {beds.length > 0 && (
              <div className='mt-3 flex items-center justify-between border-t pt-3'>
                <div className='text-xs text-muted-foreground'>
                  Page {page}
                  {Number.isFinite(totalPages) && totalPages > 0
                    ? ` of ${totalPages}`
                    : ''}
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={!canPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={!canNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

          <BedFormDialog
            open={dialogOpen}
            onOpenChange={(open: boolean) => {
              setDialogOpen(open)
              if (!open) setEditTarget(null)
            }}
            editTarget={editTarget}
            rooms={rooms}
            defaultRoomId={selectedRoomId ?? undefined}
            pgId={selectedPGLocationId}
            onSaved={() => {
              setDialogOpen(false)
              setEditTarget(null)
              void refetch()
            }}
          />

          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Bed</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{' '}
                  <span className='font-semibold'>{deleteTarget?.bed_no}</span>?
                  This action cannot be undone.
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

          {/* Responsive Filter Dialog */}
          {filtersOpen && (
            <div
              className='fixed inset-0 z-50 bg-black/50'
              onClick={() => setFiltersOpen(false)}
            >
              {/* Mobile: Bottom Sheet (< 640px) */}
              <div className='fixed inset-0 flex items-end sm:hidden'>
                <div
                  className='flex max-h-[90vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl'
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    transform: 'translateY(0)',
                    transition: 'transform 0.3s ease-out',
                  }}
                >
                  {/* Handle Bar */}
                  <div className='flex justify-center pt-3 pb-2'>
                    <div className='h-1 w-10 rounded-full bg-gray-300'></div>
                  </div>

                  {/* Header */}
                  <div className='flex items-center justify-between border-b px-5 py-4'>
                    <div>
                      <h3 className='text-lg font-semibold'>Filter Beds</h3>
                      {filterCount > 0 && (
                        <p className='mt-1 text-xs text-muted-foreground'>
                          {filterCount} filter{filterCount > 1 ? 's' : ''}{' '}
                          active
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setFiltersOpen(false)}
                      className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xl font-light text-gray-500'
                    >
                      ×
                    </button>
                  </div>

                  {/* Content */}
                  <div className='flex-1 space-y-5 overflow-y-auto px-5 py-4'>
                    {/* Room Filter */}
                    <div>
                      <h4 className='mb-3 text-sm font-semibold'>
                        Filter by Room
                      </h4>
                      <div className='flex flex-wrap gap-2'>
                        <button
                          onClick={() => setDraftRoomId(null)}
                          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                            draftRoomId === null
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 bg-white text-gray-600 active:bg-gray-50'
                          }`}
                        >
                          All Rooms
                        </button>
                        {rooms.map((room) => (
                          <button
                            key={room.s_no}
                            onClick={() => setDraftRoomId(room.s_no)}
                            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                              draftRoomId === room.s_no
                                ? 'border-black bg-black text-white'
                                : 'border-gray-200 bg-white text-gray-600 active:bg-gray-50'
                            }`}
                          >
                            {room.room_no}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Occupancy Filter */}
                    <div>
                      <h4 className='mb-3 text-sm font-semibold'>
                        Filter by Status
                      </h4>
                      <div className='space-y-2'>
                        <button
                          onClick={() => setDraftOccupancy('all')}
                          className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                            draftOccupancy === 'all'
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 bg-white text-gray-600 active:bg-gray-50'
                          }`}
                        >
                          <div
                            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                              draftOccupancy === 'all'
                                ? 'border-white'
                                : 'border-gray-400'
                            }`}
                          >
                            {draftOccupancy === 'all' && (
                              <div className='h-2.5 w-2.5 rounded-full bg-white'></div>
                            )}
                          </div>
                          <span className='font-medium'>All</span>
                        </button>

                        <button
                          onClick={() => setDraftOccupancy('available')}
                          className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                            draftOccupancy === 'available'
                              ? 'border-green-600 bg-green-600 text-white'
                              : 'border-gray-200 bg-white text-gray-600 active:bg-gray-50'
                          }`}
                        >
                          <div
                            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                              draftOccupancy === 'available'
                                ? 'border-white'
                                : 'border-gray-400'
                            }`}
                          >
                            {draftOccupancy === 'available' && (
                              <div className='h-2.5 w-2.5 rounded-full bg-white'></div>
                            )}
                          </div>
                          <span className='font-medium'>🟢 Available</span>
                        </button>

                        <button
                          onClick={() => setDraftOccupancy('occupied')}
                          className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                            draftOccupancy === 'occupied'
                              ? 'border-red-600 bg-red-600 text-white'
                              : 'border-gray-200 bg-white text-gray-600 active:bg-gray-50'
                          }`}
                        >
                          <div
                            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                              draftOccupancy === 'occupied'
                                ? 'border-white'
                                : 'border-gray-400'
                            }`}
                          >
                            {draftOccupancy === 'occupied' && (
                              <div className='h-2.5 w-2.5 rounded-full bg-white'></div>
                            )}
                          </div>
                          <span className='font-medium'>🔴 Occupied</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className='flex gap-3 border-t bg-white p-5 pt-4'>
                    {filterCount > 0 && (
                      <button
                        className='flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 active:bg-gray-50'
                        onClick={() => {
                          setSelectedRoomId(null)
                          setOccupancyFilter('all')
                          setDraftRoomId(null)
                          setDraftOccupancy('all')
                          setFiltersOpen(false)
                          setPage(1)
                          void refetch()
                        }}
                      >
                        Clear Filters
                      </button>
                    )}
                    <button
                      className='flex-1 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white active:bg-black/90'
                      onClick={() => {
                        setSelectedRoomId(draftRoomId)
                        setOccupancyFilter(draftOccupancy)
                        setFiltersOpen(false)
                        setPage(1)
                        void refetch()
                      }}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop: Centered Modal (>= 640px) */}
              <div className='hidden min-h-full items-center justify-center p-4 sm:flex'>
                <div
                  className='flex max-h-[80vh] w-full max-w-md flex-col rounded-lg bg-white shadow-xl'
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className='flex items-center justify-between border-b px-6 py-4'>
                    <div>
                      <h3 className='text-xl font-semibold'>Filter Beds</h3>
                      {filterCount > 0 && (
                        <p className='mt-1 text-sm text-muted-foreground'>
                          {filterCount} filter{filterCount > 1 ? 's' : ''}{' '}
                          active
                        </p>
                      )}
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setFiltersOpen(false)}
                      className='h-8 w-8 p-0'
                    >
                      ×
                    </Button>
                  </div>

                  {/* Content */}
                  <div className='flex-1 space-y-6 overflow-y-auto p-6'>
                    {/* Room Filter */}
                    <div>
                      <h4 className='mb-3 text-sm font-medium'>
                        Filter by Room
                      </h4>
                      <div className='flex flex-wrap gap-2'>
                        <button
                          onClick={() => setDraftRoomId(null)}
                          className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                            draftRoomId === null
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          All Rooms
                        </button>
                        {rooms.map((room) => (
                          <button
                            key={room.s_no}
                            onClick={() => setDraftRoomId(room.s_no)}
                            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                              draftRoomId === room.s_no
                                ? 'border-black bg-black text-white'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {room.room_no}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Occupancy Filter */}
                    <div>
                      <h4 className='mb-3 text-sm font-medium'>
                        Filter by Status
                      </h4>
                      <div className='space-y-2'>
                        <button
                          onClick={() => setDraftOccupancy('all')}
                          className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 transition-colors ${
                            draftOccupancy === 'all'
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                              draftOccupancy === 'all'
                                ? 'border-white'
                                : 'border-gray-400'
                            }`}
                          >
                            {draftOccupancy === 'all' && (
                              <div className='h-2 w-2 rounded-full bg-white'></div>
                            )}
                          </div>
                          <span className='text-sm font-medium'>All</span>
                        </button>

                        <button
                          onClick={() => setDraftOccupancy('available')}
                          className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 transition-colors ${
                            draftOccupancy === 'available'
                              ? 'border-green-600 bg-green-600 text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                              draftOccupancy === 'available'
                                ? 'border-white'
                                : 'border-gray-400'
                            }`}
                          >
                            {draftOccupancy === 'available' && (
                              <div className='h-2 w-2 rounded-full bg-white'></div>
                            )}
                          </div>
                          <span className='text-sm font-medium'>
                            🟢 Available
                          </span>
                        </button>

                        <button
                          onClick={() => setDraftOccupancy('occupied')}
                          className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 transition-colors ${
                            draftOccupancy === 'occupied'
                              ? 'border-red-600 bg-red-600 text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                              draftOccupancy === 'occupied'
                                ? 'border-white'
                                : 'border-gray-400'
                            }`}
                          >
                            {draftOccupancy === 'occupied' && (
                              <div className='h-2 w-2 rounded-full bg-white'></div>
                            )}
                          </div>
                          <span className='text-sm font-medium'>
                            🔴 Occupied
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className='flex gap-3 border-t p-6 pt-4'>
                    {filterCount > 0 && (
                      <Button
                        variant='outline'
                        className='flex-1'
                        onClick={() => {
                          setSelectedRoomId(null)
                          setOccupancyFilter('all')
                          setDraftRoomId(null)
                          setDraftOccupancy('all')
                          setFiltersOpen(false)
                          setPage(1)
                          void refetch()
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                    <Button
                      className='flex-1 bg-black text-white hover:bg-black/90'
                      onClick={() => {
                        setSelectedRoomId(draftRoomId)
                        setOccupancyFilter(draftOccupancy)
                        setFiltersOpen(false)
                        setPage(1)
                        void refetch()
                      }}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
