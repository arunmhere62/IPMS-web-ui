import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useDeleteRoomMutation,
  useGetAllRoomsQuery,
  type Room,
} from '@/services/roomsApi'
import { useAppSelector } from '@/store/hooks'
import { CircleAlert, DoorOpen, Plus, Search } from 'lucide-react'
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
import { RoomFormDialog } from './RoomFormDialog'

type ErrorLike = {
  data?: { message?: string }
  message?: string
}

export function RoomsScreen() {
  const selectedPGLocationId =
    useAppSelector((s) => s.pgLocations.selectedPGLocationId) ?? null

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20
  const [allRooms, setAllRooms] = useState<Room[]>([])
  const [hasMore, setHasMore] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Room | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const {
    data: roomsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetAllRoomsQuery(
    selectedPGLocationId
      ? {
          page,
          limit,
          pg_id: selectedPGLocationId,
          search: query.trim() ? query.trim() : undefined,
        }
      : undefined,
    { skip: !selectedPGLocationId }
  )

  const [deleteRoom, { isLoading: deleting }] = useDeleteRoomMutation()

  const sentinelRef = useRef<HTMLDivElement>(null)

  // Update all rooms when new data is fetched
  useEffect(() => {
    if (roomsResponse?.data) {
      const newRooms = roomsResponse.data as Room[]
      if (page === 1) {
        setAllRooms(newRooms)
      } else {
        setAllRooms((prev) => [...prev, ...newRooms])
      }
      const totalPages = roomsResponse.pagination?.totalPages ?? 1
      setHasMore(page < totalPages)
    }
  }, [roomsResponse, page])

  // Reset when query or location changes
  useEffect(() => {
    setAllRooms([])
    setPage(1)
    setHasMore(true)
  }, [query, selectedPGLocationId])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching && !isLoading) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isFetching, isLoading])

  const rooms = allRooms

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
      setAllRooms([])
      setPage(1)
      void refetch()
    } catch (e) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const countLabel = useMemo(() => {
    if (!selectedPGLocationId) return 'Select PG'
    return `${rooms.length} Rooms`
  }, [rooms.length, selectedPGLocationId])

  return (
    <div className='container mx-auto max-w-7xl px-4 py-4'>
      <div className='mb-4 flex items-center justify-between border-b pb-3'>
        <div>
          <h1 className='text-2xl font-bold'>Rooms</h1>
          <p className='text-xs text-muted-foreground'>
            Manage rooms in your PG
          </p>
        </div>
        <Button
          size='sm'
          onClick={openCreate}
          disabled={!selectedPGLocationId}
          className='bg-black text-white hover:bg-black/90'
        >
          <Plus className='mr-1 size-3.5' />
          Add Room
        </Button>
      </div>

      {fetchErrorMessage ? (
        <div className='mb-3'>
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
          <div className='mb-3 flex items-center justify-between gap-3'>
            <div className='relative max-w-sm flex-1'>
              <Search className='pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder='Search rooms...'
                className='h-8 pl-8 text-sm'
              />
            </div>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <DoorOpen className='size-3.5' />
              <span>{countLabel}</span>
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className='rounded-lg border bg-card px-4 py-8 text-center'>
                <div className='mx-auto size-6 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
                <p className='mt-2 text-xs text-muted-foreground'>Loading...</p>
              </div>
            ) : rooms.length === 0 ? (
              <EmptyState
                icon={DoorOpen}
                title='No Rooms Found'
                description={
                  query ? 'Try adjusting your search.' : 'Add your first room.'
                }
              />
            ) : (
              <div className='space-y-2'>
                {rooms.map((r) => {
                  const totalBeds = Number(r.total_beds ?? 0)
                  const occupiedBeds = Number(r.occupied_beds ?? 0)
                  const availableBeds = Number(r.available_beds ?? 0)
                  const occupancyPercent =
                    totalBeds > 0
                      ? Math.round((occupiedBeds / totalBeds) * 100)
                      : 0

                  return (
                    <Card
                      key={r.s_no}
                      className='py-0 transition-colors hover:border-blue-500/50'
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
                                availableBeds > 0 ? 'default' : 'secondary'
                              }
                              className='text-xs'
                            >
                              {availableBeds > 0 ? 'Available' : 'Full'}
                            </Badge>
                          </div>

                          <div className='grid grid-cols-3 gap-2 text-center text-xs'>
                            <div>
                              <div className='text-sm font-bold'>
                                {totalBeds}
                              </div>
                              <div className='text-muted-foreground'>Total</div>
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
                            <div className='ml-3'>
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
                                  availableBeds > 0 ? 'default' : 'secondary'
                                }
                                className='text-xs'
                              >
                                {availableBeds > 0 ? 'Available' : 'Full'}
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
                              <div className='text-muted-foreground'>Total</div>
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

                          <div className='flex-shrink-0'>
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
                  )
                })}
              </div>
            )}

            {rooms.length > 0 && (
              <>
                {/* Sentinel element for infinite scroll */}
                <div ref={sentinelRef} className='h-4' />

                {/* Loading indicator at the bottom */}
                {isFetching && hasMore && (
                  <div className='mt-3 flex items-center justify-center py-4'>
                    <div className='size-5 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
                    <span className='ml-2 text-xs text-muted-foreground'>
                      Loading more...
                    </span>
                  </div>
                )}

                {/* End of list indicator */}
                {!hasMore && rooms.length > 0 && (
                  <div className='mt-3 py-4 text-center text-xs text-muted-foreground'>
                    No more rooms to load
                  </div>
                )}
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
              setAllRooms([])
              setPage(1)
              void refetch()
            }}
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
