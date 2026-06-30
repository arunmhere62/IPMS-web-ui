import { useEffect, useMemo, useState } from 'react'
import {
  useDeleteRoomMutation,
  useLazyGetAllRoomsQuery,
  type Room,
} from '@/services/roomsApi'
import { useAppSelector } from '@/store/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { CircleAlert, DoorOpen, Plus, Filter, Search, BedDouble } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
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
      search: appliedSearch || undefined,
    }
  }, [page, limit, selectedPGLocationId, filter, appliedSearch])

  const [trigger, { data: roomsResponse, isLoading, isFetching, error }] =
    useLazyGetAllRoomsQuery()
  const [deleteRoom, { isLoading: deleting }] = useDeleteRoomMutation()

  useEffect(() => {
    setTimeout(() => {
      setPage(1)
      setPaginationState({
        allRooms: [],
        hasMore: true,
        hasLoadedOnce: false,
      })
    }, 0)
  }, [selectedPGLocationId, filter, appliedSearch])

  useEffect(() => {
    if (selectedPGLocationId && queryOptions) {
      void trigger(queryOptions)
    }
  }, [trigger, queryOptions, selectedPGLocationId])

  const { isFetching: isInfiniteFetching, checkScroll } = useInfiniteScroll({
    hasMore: paginationState.hasMore,
    isLoading: isFetching,
  })

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

      setTimeout(() => {
        checkScroll()
      }, 100)
    }
  }, [roomsResponse, page, checkScroll])

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

  const handleSearch = () => {
    if (!selectedPGLocationId) return
    setAppliedSearch(searchQuery)
  }

  const totalCount =
    roomsResponse?.pagination?.total ?? paginationState.allRooms.length

  return (
    <div className='container mx-auto max-w-6xl px-4 py-4'>
      <PageHeader
        title='Rooms'
        subtitle={`${totalCount} total`}
        showBack={true}
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
        <div className='mt-4 mb-3'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load rooms</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <EmptyState
          emoji='📍'
          title='Select a PG Location'
          description='Choose a PG from the top bar.'
        />
      ) : (
        <>
          {/* Search bar + filter */}
          <div className='mt-4 flex items-center gap-2'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search by room number...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className='h-10 w-full rounded-lg border border-border bg-muted pl-10 pr-4 text-sm outline-none focus:border-primary'
              />
            </div>
            <Button
              variant={filter !== 'all' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilterModalOpen(true)}
              className='h-10 px-4'
            >
              <Filter className='mr-2 size-4' />
              Filter
            </Button>
          </div>

          <div className='mt-4 mb-2 flex items-center gap-2 text-sm text-muted-foreground'>
            <DoorOpen className='size-4' />
            <span>
              {paginationState.allRooms.length} of {totalCount} Rooms
            </span>
            {filter !== 'all' && (
              <span className='ml-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground'>
                {filter === 'occupied' ? 'Occupied' : 'Available'}
              </span>
            )}
            {appliedSearch && (
              <span className='ml-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium'>
                "{appliedSearch}"
              </span>
            )}
          </div>

          <div className='pb-16'>
            {isLoading ? (
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {Array.from({ length: 8 }).map((_, index) => (
                  <RoomSkeleton key={`initial-skeleton-${index}`} />
                ))}
              </div>
            ) : rooms.length === 0 && paginationState.hasLoadedOnce ? (
              <EmptyState
                emoji='🏠'
                title='No Rooms Found'
                description={
                  appliedSearch
                    ? 'Try a different search term'
                    : 'Add your first room to get started'
                }
              />
            ) : (
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                <AnimatePresence>
                  {rooms.map((r, index) => {
                    const totalBeds = Number(r.total_beds ?? 0)
                    const occupiedBeds = Number(r.occupied_beds ?? 0)
                    const availableBeds = Number(r.available_beds ?? 0)

                    return (
                      <motion.div
                        key={`room-${r.s_no}-${r.room_no}-${filter}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          duration: 0.3,
                          delay: Math.min(index * 0.05, 0.3),
                          ease: 'easeOut',
                        }}
                      >
                        <Card
                          className='cursor-pointer py-0 transition-colors hover:border-blue-500/50'
                          onClick={() => navigate(`/rooms/${r.s_no}`)}
                        >
                          <CardContent className='p-3'>
                            {/* Top row: room icon + name + action buttons */}
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center gap-2'>
                                <div className='flex size-8 items-center justify-center rounded-full bg-blue-600/10'>
                                  <span className='text-base'>🏠</span>
                                </div>
                                <div>
                                  <h3 className='text-sm font-bold'>
                                    {r.room_no}
                                  </h3>
                                  <div className='text-xs text-muted-foreground'>
                                    ID: {r.s_no}
                                  </div>
                                </div>
                              </div>

                              <div
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

                            {/* Bed stat pills */}
                            <div className='mt-2.5 flex flex-wrap gap-2'>
                              <div className='flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1'>
                                <BedDouble className='size-3 text-gray-500' />
                                <span className='text-xs font-semibold text-gray-600'>
                                  {totalBeds} Total
                                </span>
                              </div>
                              <div className='flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1'>
                                <BedDouble className='size-3 text-green-600' />
                                <span className='text-xs font-semibold text-green-600'>
                                  {availableBeds} Free
                                </span>
                              </div>
                              <div className='flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1'>
                                <BedDouble className='size-3 text-red-600' />
                                <span className='text-xs font-semibold text-red-600'>
                                  {occupiedBeds} Taken
                                </span>
                              </div>
                            </div>

                            {/* PG location */}
                            {r.pg_locations && (
                              <div className='mt-2 border-t pt-2 text-xs text-muted-foreground'>
                                📍 {r.pg_locations.location_name}
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

            {paginationState.allRooms.length > 0 && (
              <>
                <AnimatePresence>
                  {(isFetching ||
                    (isInfiniteFetching && paginationState.hasMore)) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className='mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    >
                      {Array.from({ length: 4 }).map((_, index) => (
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
