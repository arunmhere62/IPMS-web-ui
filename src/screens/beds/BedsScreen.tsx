import { useEffect, useMemo, useReducer, useState } from 'react'
import {
  type Bed,
  type Room,
  useDeleteBedMutation,
  useLazyGetAllBedsQuery,
  useLazyGetAllRoomsQuery,
} from '@/services/roomsApi'
import { useAppSelector } from '@/store/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { Bed as BedIcon, CircleAlert, Filter, User } from 'lucide-react'
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
import { RoomSkeleton } from '@/components/ui/room-skeleton'
import { ActionButtons } from '@/components/form/action-buttons'
import { PageHeader } from '@/components/form/page-header'
import { RoomFilterModal } from '@/components/rooms/RoomFilterModal'
import { BedFormDialog } from './BedFormDialog'

type ErrorLike = {
  data?: { message?: string }
  message?: string
}

type BedsState = {
  page: number
  allBeds: Bed[]
  hasMore: boolean
  hasLoadedOnce: boolean
}

type BedsAction =
  | { type: 'RESET' }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'ADD_BEDS'; page: number; data: Bed[]; hasMore: boolean }

function bedsReducer(state: BedsState, action: BedsAction): BedsState {
  switch (action.type) {
    case 'RESET': {
      return {
        page: 1,
        allBeds: [],
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
    case 'ADD_BEDS': {
      const existingIds = new Set(state.allBeds.map((b) => b.s_no))
      const newBeds = action.data.filter((b) => !existingIds.has(b.s_no))
      return {
        ...state,
        allBeds:
          action.page === 1 ? action.data : [...state.allBeds, ...newBeds],
        hasMore: action.hasMore,
        hasLoadedOnce: true,
      }
    }
    default:
      return state
  }
}

export function BedsScreen() {
  const navigate = useNavigate()
  const selectedPGLocationId =
    useAppSelector((s) => s.pgLocations.selectedPGLocationId) ?? null

  const limit = 20
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [state, dispatch] = useReducer(bedsReducer, {
    page: 1,
    allBeds: [],
    hasMore: true,
    hasLoadedOnce: false,
  })

  const [editTarget, setEditTarget] = useState<Bed | null>(null)
  const [filterModalOpen, setFilterModalOpen] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Bed | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const queryOptions = useMemo(() => {
    if (!selectedPGLocationId) return undefined

    return {
      page: state.page,
      limit,
      room_id: selectedRoomId ?? undefined,
    }
  }, [state.page, limit, selectedPGLocationId, selectedRoomId])

  const [trigger, { data: bedsResponse, isLoading, isFetching, error }] =
    useLazyGetAllBedsQuery()
  const [deleteBed, { isLoading: deleting }] = useDeleteBedMutation()
  const [triggerRooms, { data: roomsResponse }] = useLazyGetAllRoomsQuery()

  const rooms: Room[] = useMemo(() => {
    return Array.isArray(roomsResponse?.data) ? roomsResponse.data : []
  }, [roomsResponse])

  // Load rooms for the form dialog
  useEffect(() => {
    if (selectedPGLocationId) {
      triggerRooms({ limit: 200 })
    }
  }, [selectedPGLocationId, triggerRooms])

  // Reset state when location or room filter changes
  useEffect(() => {
    dispatch({ type: 'RESET' })
  }, [selectedPGLocationId, selectedRoomId])

  // Load initial data or when page changes
  useEffect(() => {
    if (selectedPGLocationId && queryOptions) {
      void trigger(queryOptions)
    }
  }, [trigger, queryOptions, selectedPGLocationId])

  const { isFetching: isInfiniteFetching, checkScroll } = useInfiniteScroll({
    hasMore: state.hasMore,
    isLoading: isFetching,
  })

  // Accumulate beds data when response changes
  useEffect(() => {
    if (bedsResponse?.data) {
      dispatch({
        type: 'ADD_BEDS',
        page: state.page,
        data: bedsResponse.data,
        hasMore: bedsResponse.pagination?.hasMore ?? false,
      })

      // Check if we need to load more immediately after data loads
      setTimeout(() => {
        checkScroll()
      }, 100)
    }
  }, [bedsResponse, state.page, checkScroll])

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
        ...queryOptions!,
        page: nextPage,
      })
    }
  }, [
    isInfiniteFetching,
    state.hasMore,
    isFetching,
    state.page,
    trigger,
    queryOptions,
    selectedPGLocationId,
  ])

  const beds = state.allBeds

  const fetchErrorMessage =
    (error as ErrorLike | undefined)?.data?.message ||
    (error as ErrorLike | undefined)?.message

  const openEdit = (b: Bed) => {
    setEditTarget(b)
  }

  const askDelete = (b: Bed) => {
    setDeleteTarget(b)
    setDeleteDialogOpen(true)
  }

  const handleBedClick = (b: Bed) => {
    const tenant = b.tenants?.[0]
    if (tenant?.s_no) {
      navigate(`/tenants/${tenant.s_no}`)
    } else {
      navigate(`/tenants/new?bedId=${b.s_no}&roomId=${b.room_id}`)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteBed(deleteTarget.s_no).unwrap()
      showSuccessAlert('Bed deleted successfully')
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      dispatch({ type: 'RESET' })
      if (selectedPGLocationId && queryOptions) {
        void trigger(queryOptions)
      }
    } catch (e) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const countLabel = useMemo(() => {
    if (!selectedPGLocationId) return 'Select PG'
    const total = bedsResponse?.pagination?.total ?? state.allBeds.length
    const roomLabel = selectedRoomId
      ? ` • Room ${rooms.find((r) => r.s_no === selectedRoomId)?.room_no}`
      : ''
    return `${state.allBeds.length} of ${total} Beds${roomLabel}`
  }, [
    state.allBeds.length,
    selectedPGLocationId,
    bedsResponse,
    selectedRoomId,
    rooms,
  ])

  return (
    <div className='container mx-auto max-w-7xl px-4 py-4'>
      <PageHeader title='Beds' showBack={true} />

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
          <div className='mb-3 flex items-center justify-between gap-2'>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <BedIcon className='size-3.5' />
              <span>{countLabel}</span>
              {selectedRoomId && (
                <span className='ml-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground'>
                  Room {rooms.find((r) => r.s_no === selectedRoomId)?.room_no}
                </span>
              )}
            </div>
            <Button
              variant={selectedRoomId !== null ? 'default' : 'outline'}
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
            ) : beds.length === 0 && state.hasLoadedOnce ? (
              <EmptyState
                icon={BedIcon}
                title='No Beds Found'
                description='Add your first bed.'
              />
            ) : (
              <div className='space-y-2'>
                <AnimatePresence>
                  {beds.map((b, index) => {
                    const isOccupied = Boolean(b.is_occupied)
                    const tenant = b.tenants?.[0]

                    return (
                      <motion.div
                        key={`bed-${b.s_no}-${b.bed_no}-${selectedRoomId}`}
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
                          className='py-0 transition-colors hover:border-green-500/50'
                          onClick={() => handleBedClick(b)}
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
                                  <div className='text-muted-foreground'>
                                    Price
                                  </div>
                                  <div className='font-medium'>
                                    {b.bed_price != null &&
                                    String(b.bed_price).length > 0
                                      ? `₹${String(b.bed_price)}`
                                      : '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className='text-muted-foreground'>
                                    ID
                                  </div>
                                  <div className='font-medium'>{b.s_no}</div>
                                </div>
                              </div>

                              {tenant?.name && (
                                <div className='flex items-center gap-2 rounded border bg-muted/30 p-2'>
                                  <User className='size-3.5 text-muted-foreground' />
                                  <span className='truncate text-xs'>
                                    {tenant.name}
                                    {tenant.phone_no
                                      ? ` • ${tenant.phone_no}`
                                      : ''}
                                  </span>
                                </div>
                              )}

                              <div
                                className='flex justify-end gap-2 border-t pt-2'
                                onClick={(e) => e.stopPropagation()}
                              >
                                {!isOccupied && (
                                  <Button
                                    asChild
                                    variant='outline'
                                    size='sm'
                                    className='text-xs'
                                  >
                                    <Link
                                      to={`/tenants/new?bedId=${b.s_no}&roomId=${b.room_id}`}
                                    >
                                      Add Tenant
                                    </Link>
                                  </Button>
                                )}
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
                                    variant={
                                      isOccupied ? 'secondary' : 'default'
                                    }
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
                                  <div className='text-muted-foreground'>
                                    Price
                                  </div>
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
                                className='flex flex-shrink-0 items-center gap-2'
                                onClick={(e) => e.stopPropagation()}
                              >
                                {!isOccupied && (
                                  <Button
                                    asChild
                                    variant='outline'
                                    size='sm'
                                    className='text-xs'
                                  >
                                    <Link
                                      to={`/tenants/new?bedId=${b.s_no}&roomId=${b.room_id}`}
                                    >
                                      Add Tenant
                                    </Link>
                                  </Button>
                                )}
                                <ActionButtons
                                  mode='icon'
                                  onEdit={() => openEdit(b)}
                                  onDelete={() => askDelete(b)}
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

            {state.allBeds.length > 0 && (
              <>
                {/* Skeleton loading at the bottom */}
                <AnimatePresence>
                  {(isFetching || (isInfiniteFetching && state.hasMore)) && (
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
                  {!state.hasMore &&
                    state.allBeds.length > 0 &&
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
                            Showing all {state.allBeds.length} beds
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

          <BedFormDialog
            open={editTarget !== null}
            onOpenChange={(open: boolean) => {
              if (!open) setEditTarget(null)
            }}
            editTarget={editTarget}
            rooms={rooms}
            defaultRoomId={undefined}
            pgId={selectedPGLocationId}
            onSaved={() => {
              setEditTarget(null)
              dispatch({ type: 'RESET' })
              if (selectedPGLocationId && queryOptions) {
                void trigger(queryOptions)
              }
            }}
          />

          <RoomFilterModal
            open={filterModalOpen}
            onOpenChange={setFilterModalOpen}
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onSelectRoom={setSelectedRoomId}
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
                  <span className='font-semibold'>
                    Bed {deleteTarget?.bed_no}
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
