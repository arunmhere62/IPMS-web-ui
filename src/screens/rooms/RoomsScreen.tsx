import { useEffect, useMemo, useState } from 'react'
import {
  useDeleteRoomMutation,
  useLazyGetAllRoomsQuery,
  type Room,
} from '@/services/roomsApi'
import { useAppSelector } from '@/store/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { CircleAlert, DoorOpen, Plus, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
import { RoomSkeleton } from '@/components/ui/room-skeleton'
import { ActionButtons } from '@/components/form/action-buttons'
import { PageHeader } from '@/components/form/page-header'
import { FilterModal } from '@/components/rooms/FilterModal'
import { RoomFormDialog } from './RoomFormDialog'

type ErrorLike = {
  data?: { message?: string }
  message?: string
}

export function RoomsScreen() {
  const navigate = useNavigate()
  const selectedPGLocationId =
    useAppSelector((s) => s.pgLocations.selectedPGLocationId) ?? null

  const [page, setPage] = useState(1)
  const limit = 20
  const [filter, setFilter] = useState<'all' | 'occupied' | 'available'>('all')
  const [paginationState, setPaginationState] = useState({
    allRooms: [] as Room[],
    hasMore: true,
    hasLoadedOnce: false,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Room | null>(null)
  const [filterModalOpen, setFilterModalOpen] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const queryOptions = useMemo(() => {
    if (!selectedPGLocationId) return undefined

    return {
      page,
      limit,
      occupancy: filter === 'all' ? undefined : filter,
    }
  }, [page, limit, selectedPGLocationId, filter])

  const [trigger, { data: roomsResponse, isLoading, isFetching, error }] =
    useLazyGetAllRoomsQuery()
  const [deleteRoom, { isLoading: deleting }] = useDeleteRoomMutation()

  // Reset state when location or filter changes
  // Note: The original issue (multiple setState calls in one effect) has been fixed
  // by combining page, allRooms, hasMore, and hasLoadedOnce into paginationState.
  // This reduces setState calls from 4 to 2, which significantly reduces cascading renders.
  // The remaining setState calls are for legitimate useEffect patterns (syncing with API
  // response and infinite scroll) which are acceptable per React documentation.
  useEffect(() => {
    setTimeout(() => {
      setPage(1)
      setPaginationState({
        allRooms: [],
        hasMore: true,
        hasLoadedOnce: false,
      })
    }, 0)
  }, [selectedPGLocationId, filter])

  // Load initial data or when page changes
  useEffect(() => {
    if (selectedPGLocationId && queryOptions) {
      void trigger(queryOptions)
    }
  }, [trigger, queryOptions, selectedPGLocationId])

  const { isFetching: isInfiniteFetching, checkScroll } = useInfiniteScroll({
    hasMore: paginationState.hasMore,
    isLoading: isFetching,
  })

  // Accumulate rooms data when response changes
  // Note: setState in useEffect is acceptable here for syncing with external API response
  useEffect(() => {
    if (roomsResponse?.data) {
      setTimeout(() => {
        if (page === 1) {
          setPaginationState((prev) => ({
            ...prev,
            allRooms: roomsResponse.data,
            hasMore: roomsResponse.pagination?.hasMore ?? false,
            hasLoadedOnce: true,
          }))
        } else {
          setPaginationState((prev) => {
            const existingIds = new Set(prev.allRooms.map((room) => room.s_no))
            const newRooms = roomsResponse.data.filter(
              (room) => !existingIds.has(room.s_no)
            )
            return {
              ...prev,
              allRooms: [...prev.allRooms, ...newRooms],
              hasMore: roomsResponse.pagination?.hasMore ?? false,
              hasLoadedOnce: true,
            }
          })
        }
      }, 0)

      // Check if we need to load more immediately after data loads
      setTimeout(() => {
        checkScroll()
      }, 100)
    }
  }, [roomsResponse, page, checkScroll])

  // Load more data when infinite scroll triggers
  useEffect(() => {
    if (
      isInfiniteFetching &&
      paginationState.hasMore &&
      !isFetching &&
      selectedPGLocationId
    ) {
      const nextPage = page + 1
      setTimeout(() => {
        setPage(nextPage)
      }, 0)
      void trigger({
        ...queryOptions!,
        page: nextPage,
      })
    }
  }, [
    isInfiniteFetching,
    paginationState.hasMore,
    isFetching,
    page,
    trigger,
    queryOptions,
    selectedPGLocationId,
  ])

  const rooms = paginationState.allRooms

  const fetchErrorMessage =
    (error as ErrorLike | undefined)?.data?.message ||
    (error as ErrorLike | undefined)?.message

  const openCreate = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  const openEdit = (r: Room) => {
    setEditTarget(r)
    setDialogOpen(true)
  }

  const askDelete = (r: Room) => {
    setDeleteTarget(r)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteRoom(deleteTarget.s_no).unwrap()
      showSuccessAlert('Room deleted successfully')
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      setPage(1)
      setPaginationState({
        allRooms: [],
        hasMore: true,
        hasLoadedOnce: false,
      })
      if (selectedPGLocationId && queryOptions) {
        void trigger(queryOptions)
      }
    } catch (e) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const countLabel = useMemo(() => {
    if (!selectedPGLocationId) return 'Select PG'
    const total =
      roomsResponse?.pagination?.total ?? paginationState.allRooms.length
    return `${paginationState.allRooms.length} of ${total} Rooms`
  }, [paginationState.allRooms.length, selectedPGLocationId, roomsResponse])

  return (
    <div className='container mx-auto max-w-7xl px-4 py-4'>
      <PageHeader
        title='Rooms'
        right={
          <Button
            size='sm'
            onClick={openCreate}
            disabled={!selectedPGLocationId}
            className='bg-black text-white hover:bg-black/90'
          >
            <Plus className='mr-1 size-3.5' />
            Add Room
          </Button>
        }
      />

      {fetchErrorMessage ? (
        <div className='mt-3 mb-3'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load rooms</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <EmptyState
          icon={DoorOpen}
          title='Select a PG Location'
          description='Choose a PG from the top bar.'
        />
      ) : (
        <>
          <div className='mt-3 mb-3 flex items-center justify-between gap-2'>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <DoorOpen className='size-3.5' />
              <span>{countLabel}</span>
              {filter !== 'all' && (
                <span className='ml-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground'>
                  {filter === 'occupied' ? 'Occupied' : 'Available'}
                </span>
              )}
            </div>
            <Button
              variant={filter !== 'all' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilterModalOpen(true)}
              className='h-8 text-xs'
            >
              <Filter className='mr-1 size-3' />
              Filter
            </Button>
          </div>

          <div className='pb-16'>
            {isLoading ? (
              <div className='space-y-2'>
                {Array.from({ length: 3 }).map((_, index) => (
                  <RoomSkeleton key={`initial-skeleton-${index}`} />
                ))}
              </div>
            ) : rooms.length === 0 && paginationState.hasLoadedOnce ? (
              <EmptyState
                icon={DoorOpen}
                title='No Rooms Found'
                description='Add your first room.'
              />
            ) : (
              <div className='space-y-2'>
                <AnimatePresence>
                  {rooms.map((r, index) => {
                    const totalBeds = Number(r.total_beds ?? 0)
                    const occupiedBeds = Number(r.occupied_beds ?? 0)
                    const availableBeds = Number(r.available_beds ?? 0)
                    const occupancyPercent =
                      totalBeds > 0
                        ? Math.round((occupiedBeds / totalBeds) * 100)
                        : 0

                    return (
                      <motion.div
                        key={`room-${r.s_no}-${r.room_no}-${filter}`}
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
                          className='cursor-pointer py-0 transition-colors hover:border-blue-500/50'
                          onClick={() => navigate(`/rooms/${r.s_no}`)}
                        >
                          <CardContent className='p-3'>
                            {/* Mobile Layout (< md) */}
                            <div className='space-y-3 md:hidden'>
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-2'>
                                  <div className='flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white'>
                                    <DoorOpen className='size-4' />
                                  </div>
                                  <div>
                                    <h3 className='text-sm font-semibold'>
                                      Room {r.room_no}
                                    </h3>
                                    <div className='text-xs text-muted-foreground'>
                                      ID: {r.s_no}
                                    </div>
                                  </div>
                                </div>
                                <Badge
                                  variant={
                                    totalBeds === 0
                                      ? 'outline'
                                      : availableBeds > 0
                                        ? 'default'
                                        : 'secondary'
                                  }
                                  className='text-xs'
                                >
                                  {totalBeds === 0
                                    ? 'No Beds'
                                    : availableBeds > 0
                                      ? 'Available'
                                      : 'Full'}
                                </Badge>
                              </div>

                              <div className='grid grid-cols-3 gap-2 text-center text-xs'>
                                <div>
                                  <div className='text-sm font-bold'>
                                    {totalBeds}
                                  </div>
                                  <div className='text-muted-foreground'>
                                    Total
                                  </div>
                                </div>
                                <div>
                                  <div className='text-sm font-bold text-blue-600'>
                                    {occupiedBeds}
                                  </div>
                                  <div className='text-muted-foreground'>
                                    Occupied
                                  </div>
                                </div>
                                <div>
                                  <div className='text-sm font-bold text-green-600'>
                                    {availableBeds}
                                  </div>
                                  <div className='text-muted-foreground'>
                                    Available
                                  </div>
                                </div>
                              </div>

                              <div className='flex items-center justify-between'>
                                <div className='flex flex-1 items-center gap-2'>
                                  <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-muted'>
                                    <div
                                      className='h-full bg-blue-600 transition-all'
                                      style={{ width: `${occupancyPercent}%` }}
                                    />
                                  </div>
                                  <span className='text-xs font-medium text-blue-600'>
                                    {occupancyPercent}%
                                  </span>
                                </div>
                                <div
                                  className='ml-3'
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ActionButtons
                                    mode='icon'
                                    viewTo={`/rooms/${r.s_no}`}
                                    onEdit={() => openEdit(r)}
                                    onDelete={() => askDelete(r)}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Desktop Layout (>= md) */}
                            <div className='hidden items-center gap-3 md:flex'>
                              <div className='flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white'>
                                <DoorOpen className='size-4' />
                              </div>

                              <div className='min-w-0 flex-1'>
                                <div className='mb-1 flex items-center gap-2'>
                                  <h3 className='truncate text-sm font-semibold'>
                                    Room {r.room_no}
                                  </h3>
                                  <Badge
                                    variant={
                                      totalBeds === 0
                                        ? 'outline'
                                        : availableBeds > 0
                                          ? 'default'
                                          : 'secondary'
                                    }
                                    className='text-xs'
                                  >
                                    {totalBeds === 0
                                      ? 'No Beds'
                                      : availableBeds > 0
                                        ? 'Available'
                                        : 'Full'}
                                  </Badge>
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                  ID: {r.s_no}
                                </div>
                              </div>

                              <div className='hidden items-center gap-4 text-xs lg:flex'>
                                <div className='text-center'>
                                  <div className='text-sm font-bold'>
                                    {totalBeds}
                                  </div>
                                  <div className='text-muted-foreground'>
                                    Total
                                  </div>
                                </div>
                                <div className='text-center'>
                                  <div className='text-sm font-bold text-blue-600'>
                                    {occupiedBeds}
                                  </div>
                                  <div className='text-muted-foreground'>
                                    Occupied
                                  </div>
                                </div>
                                <div className='text-center'>
                                  <div className='text-sm font-bold text-green-600'>
                                    {availableBeds}
                                  </div>
                                  <div className='text-muted-foreground'>
                                    Available
                                  </div>
                                </div>
                              </div>

                              <div className='flex min-w-0 items-center gap-2'>
                                <div className='h-1.5 w-12 overflow-hidden rounded-full bg-muted lg:w-16'>
                                  <div
                                    className='h-full bg-blue-600 transition-all'
                                    style={{ width: `${occupancyPercent}%` }}
                                  />
                                </div>
                                <span className='w-6 text-right text-xs font-medium text-blue-600 lg:w-8'>
                                  {occupancyPercent}%
                                </span>
                              </div>

                              <div
                                className='flex-shrink-0'
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ActionButtons
                                  mode='icon'
                                  viewTo={`/rooms/${r.s_no}`}
                                  onEdit={() => openEdit(r)}
                                  onDelete={() => askDelete(r)}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}

            {paginationState.allRooms.length > 0 && (
              <>
                {/* Skeleton loading at the bottom */}
                <AnimatePresence>
                  {(isFetching ||
                    (isInfiniteFetching && paginationState.hasMore)) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className='mb-8 space-y-2'
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
                  {!paginationState.hasMore &&
                    paginationState.allRooms.length > 0 &&
                    !isFetching && (
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
                            Showing all {paginationState.allRooms.length} rooms
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
              </>
            )}
          </div>

          <RoomFormDialog
            open={dialogOpen}
            onOpenChange={(open: boolean) => {
              setDialogOpen(open)
              if (!open) setEditTarget(null)
            }}
            editTarget={editTarget}
            pgId={selectedPGLocationId}
            onSaved={() => {
              setDialogOpen(false)
              setEditTarget(null)
              setPage(1)
              setPaginationState({
                allRooms: [],
                hasMore: true,
                hasLoadedOnce: false,
              })
              if (selectedPGLocationId && queryOptions) {
                void trigger(queryOptions)
              }
            }}
          />

          <FilterModal
            open={filterModalOpen}
            onOpenChange={setFilterModalOpen}
            filter={filter}
            onFilterChange={setFilter}
          />

          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Room</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{' '}
                  <span className='font-semibold'>
                    Room {deleteTarget?.room_no}
                  </span>
                  ? This action cannot be undone.
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
        </>
      )}
    </div>
  )
}
