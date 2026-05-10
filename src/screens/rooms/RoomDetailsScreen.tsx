import { useState } from 'react'
import { BedFormDialog } from '@/screens/beds/BedFormDialog'
import { RoomFormDialog } from '@/screens/rooms/RoomFormDialog'
import {
  type Bed,
  type Room,
  useDeleteBedMutation,
  useDeleteRoomMutation,
  useGetBedsByRoomIdQuery,
  useGetRoomByIdQuery,
} from '@/services/roomsApi'
import { useAppSelector } from '@/store/hooks'
import { Bed as BedIcon, CircleAlert, DoorOpen, Plus } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
import { ActionButtons } from '@/components/form/action-buttons'

interface ApiResponse<T> {
  data: T
}

interface NestedApiResponse<T> {
  data: ApiResponse<T>
}

interface ApiError {
  data?: {
    message?: string
  }
  message?: string
}

interface RootState {
  pgLocations: {
    selectedPGLocationId: number | null
  }
}

interface ExtendedBed {
  s_no: number
  bed_no: string
  bed_price?: number | string
  is_occupied?: boolean
  tenants?: Array<{
    s_no?: number
    name?: string
    phone_no?: string
    status?: string
  }>
}

interface ExtendedRoom {
  s_no: number
  room_no: string
  images?: string[]
  total_beds?: number
  occupied_beds?: number
  available_beds?: number
  pg_locations?: {
    s_no?: number
    location_name?: string
  }
}

const unwrapRoom = (
  response:
    | ApiResponse<Room>
    | NestedApiResponse<Room>
    | Room
    | null
    | undefined
): Room | null => {
  if (!response) return null
  const root =
    'data' in response ? (response as ApiResponse<Room>).data : response
  const nested = 'data' in root ? (root as ApiResponse<Room>).data : root
  return nested as Room | null
}

const unwrapBeds = (
  response:
    | ApiResponse<Bed[]>
    | NestedApiResponse<Bed[]>
    | Bed[]
    | null
    | undefined
): Bed[] => {
  if (!response) return []
  const root =
    'data' in response ? (response as ApiResponse<Bed[]>).data : response
  const nested = 'data' in root ? (root as ApiResponse<Bed[]>).data : root
  const data = Array.isArray(nested)
    ? nested
    : Array.isArray((nested as ApiResponse<Bed[]>)?.data)
      ? (nested as ApiResponse<Bed[]>).data
      : []
  return Array.isArray(data) ? data : []
}

export function RoomDetailsScreen() {
  const navigate = useNavigate()
  const params = useParams()
  const roomId = Number(params.id)

  const selectedPGLocationId = useAppSelector(
    (s: RootState) => s.pgLocations?.selectedPGLocationId
  )

  const [bedDialogOpen, setBedDialogOpen] = useState(false)
  const [editBed, setEditBed] = useState<Bed | null>(null)

  const [roomDialogOpen, setRoomDialogOpen] = useState(false)

  const [deleteRoomOpen, setDeleteRoomOpen] = useState(false)
  const [deleteBedOpen, setDeleteBedOpen] = useState(false)
  const [deleteBedTarget, setDeleteBedTarget] = useState<Bed | null>(null)

  const {
    data: roomResponse,
    isLoading: roomLoading,
    error: roomError,
    refetch: refetchRoom,
  } = useGetRoomByIdQuery(Number.isFinite(roomId) ? roomId : 0, {
    skip: !Number.isFinite(roomId) || roomId <= 0,
  })

  const {
    data: bedsResponse,
    isLoading: bedsLoading,
    error: bedsError,
    refetch: refetchBeds,
  } = useGetBedsByRoomIdQuery(Number.isFinite(roomId) ? roomId : 0, {
    skip: !Number.isFinite(roomId) || roomId <= 0,
  })

  const [deleteRoom, { isLoading: deletingRoom }] = useDeleteRoomMutation()
  const [deleteBed, { isLoading: deletingBed }] = useDeleteBedMutation()

  const room = unwrapRoom(roomResponse)
  const beds = unwrapBeds(bedsResponse)

  const extendedRoom = room as ExtendedRoom

  const fetchErrorMessage =
    (roomError as ApiError)?.data?.message ||
    (roomError as ApiError)?.message ||
    (bedsError as ApiError)?.data?.message ||
    (bedsError as ApiError)?.message

  const images: string[] = Array.isArray(extendedRoom?.images)
    ? (extendedRoom.images ?? [])
    : []

  const total = Number(extendedRoom?.total_beds ?? beds.length)
  const occupied = Number(
    extendedRoom?.occupied_beds ??
      beds.filter((b) => Boolean((b as ExtendedBed)?.is_occupied)).length
  )
  const available = Number(
    extendedRoom?.available_beds ?? Math.max(0, total - occupied)
  )
  const stats = { total, occupied, available }

  const openAddBed = () => {
    setEditBed(null)
    setBedDialogOpen(true)
  }

  const openEditBed = (b: Bed) => {
    setEditBed(b)
    setBedDialogOpen(true)
  }

  const askDeleteBed = (b: Bed) => {
    setDeleteBedTarget(b)
    setDeleteBedOpen(true)
  }

  const confirmDeleteBed = async () => {
    if (!deleteBedTarget) return
    try {
      await deleteBed(deleteBedTarget.s_no).unwrap()
      showSuccessAlert('Bed deleted successfully')
      setDeleteBedOpen(false)
      setDeleteBedTarget(null)
      void refetchBeds()
      void refetchRoom()
    } catch (e: unknown) {
      showErrorAlert(e as Error, 'Delete Error')
    }
  }

  const confirmDeleteRoom = async () => {
    if (!Number.isFinite(roomId) || roomId <= 0) return
    try {
      await deleteRoom(roomId).unwrap()
      showSuccessAlert('Room deleted successfully')
      navigate('/rooms')
    } catch (e: unknown) {
      showErrorAlert(e as Error, 'Delete Error')
    }
  }

  return (
    <div className='container mx-auto max-w-5xl px-3 py-3'>
      <div className='mb-3 flex items-center justify-between border-b pb-2'>
        <div>
          <h1 className='text-lg font-bold'>
            {room?.room_no ? `Room ${room.room_no}` : 'Room Details'}
          </h1>
          <p className='text-[10px] text-muted-foreground'>
            {room?.pg_locations?.location_name
              ? String(room.pg_locations.location_name)
              : 'View and manage room information'}
          </p>
        </div>
        <div className='flex items-center gap-1.5'>
          {room && (
            <ActionButtons
              onEdit={() => setRoomDialogOpen(true)}
              onDelete={() => setDeleteRoomOpen(true)}
            />
          )}
        </div>
      </div>

      {fetchErrorMessage ? (
        <div className='mb-2'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load room details</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <div className='rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center'>
          <div className='mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10'>
            <DoorOpen className='size-5 text-primary' />
          </div>
          <div className='mt-2 text-xs font-semibold'>Select a PG Location</div>
          <div className='mt-1 text-[10px] text-muted-foreground'>
            Choose a PG from the top bar.
          </div>
        </div>
      ) : roomLoading ? (
        <div className='rounded-lg border bg-card px-3 py-6 text-center'>
          <div className='mx-auto size-5 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
          <p className='mt-2 text-[10px] text-muted-foreground'>Loading...</p>
        </div>
      ) : !room ? (
        <div className='rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center'>
          <div className='mx-auto flex size-10 items-center justify-center rounded-full bg-destructive/10'>
            <DoorOpen className='size-5 text-destructive' />
          </div>
          <div className='mt-2 text-xs font-semibold'>Room not found</div>
          <div className='mt-1 text-[10px] text-muted-foreground'>
            Please check the room ID.
          </div>
        </div>
      ) : (
        <div className='space-y-2'>
          <Card className='border'>
            <CardContent className='p-3'>
              <div className='mb-2 flex items-center justify-between border-b pb-2'>
                <div className='flex items-center gap-2'>
                  <div className='flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white'>
                    <DoorOpen className='size-4.5' />
                  </div>
                  <div>
                    <div className='text-sm font-bold'>Room {room.room_no}</div>
                    <div className='text-[10px] text-muted-foreground'>
                      ID: {room.s_no}
                    </div>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-3 gap-2'>
                <div className='rounded-lg border p-1.5 text-center'>
                  <div className='text-lg font-bold'>{stats.total}</div>
                  <div className='text-[10px] text-muted-foreground'>
                    Total Beds
                  </div>
                </div>
                <div className='rounded-lg border p-1.5 text-center'>
                  <div className='text-lg font-bold text-blue-600'>
                    {stats.occupied}
                  </div>
                  <div className='text-[10px] text-muted-foreground'>
                    Occupied
                  </div>
                </div>
                <div className='rounded-lg border p-1.5 text-center'>
                  <div className='text-lg font-bold text-green-600'>
                    {stats.available}
                  </div>
                  <div className='text-[10px] text-muted-foreground'>
                    Available
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {images.length > 0 && (
            <Card className='border'>
              <CardContent className='p-3'>
                <div className='mb-2 border-b pb-2 text-xs font-semibold'>
                  Room Images
                </div>
                <div className='flex flex-wrap gap-1.5'>
                  {images.map((url) => (
                    <div
                      key={url}
                      className='h-16 w-16 overflow-hidden rounded-lg border'
                    >
                      <img
                        src={url}
                        alt=''
                        className='h-full w-full object-cover'
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className='border'>
            <CardContent className='p-3'>
              <div className='mb-2 flex items-center justify-between border-b pb-2'>
                <div>
                  <div className='text-xs font-semibold'>Beds in this Room</div>
                  <div className='text-[10px] text-muted-foreground'>
                    {beds.length} bed{beds.length !== 1 ? 's' : ''} total
                  </div>
                </div>
                <Button
                  size='sm'
                  onClick={openAddBed}
                  disabled={!selectedPGLocationId}
                  className='bg-black text-xs text-white hover:bg-black/90'
                >
                  <Plus className='me-1 size-3' />
                  Add Bed
                </Button>
              </div>

              {bedsLoading ? (
                <div className='rounded-lg border bg-card px-3 py-5 text-center'>
                  <div className='mx-auto size-5 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
                  <p className='mt-2 text-[10px] text-muted-foreground'>
                    Loading beds...
                  </p>
                </div>
              ) : beds.length === 0 ? (
                <div className='rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center'>
                  <div className='mx-auto flex size-8 items-center justify-center rounded-full bg-primary/10'>
                    <BedIcon className='size-4 text-primary' />
                  </div>
                  <div className='mt-2 text-xs font-semibold'>No Beds</div>
                  <div className='mt-1 text-[10px] text-muted-foreground'>
                    Add your first bed to this room.
                  </div>
                </div>
              ) : (
                <div className='space-y-1.5'>
                  {beds.map((b) => (
                    <div
                      key={b.s_no}
                      className='rounded-lg border p-2 hover:border-blue-500/50'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex min-w-0 flex-1 items-center gap-2'>
                          <div className='flex size-7 items-center justify-center rounded-lg bg-black text-white'>
                            <BedIcon className='size-3.5' />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='text-xs font-semibold'>
                              {b.bed_no}
                            </div>
                            <div className='truncate text-[10px] text-muted-foreground'>
                              <Badge
                                variant={
                                  (b as ExtendedBed).is_occupied
                                    ? 'secondary'
                                    : 'default'
                                }
                                className='mr-1 text-[10px]'
                              >
                                {String(
                                  (b as ExtendedBed).is_occupied
                                    ? 'Occupied'
                                    : 'Available'
                                )}
                              </Badge>
                              {String(b.bed_price ?? '').length > 0
                                ? `₹${String(b.bed_price)}`
                                : ''}
                              {(b as ExtendedBed).tenants?.[0]?.name
                                ? ` • ${(b as ExtendedBed).tenants?.[0]?.name ?? ''}`
                                : ''}
                              {(b as ExtendedBed).tenants?.[0]?.phone_no
                                ? ` • ${(b as ExtendedBed).tenants?.[0]?.phone_no ?? ''}`
                                : ''}
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-1'>
                          {!(b as ExtendedBed).is_occupied && (
                            <Button
                              asChild
                              variant='outline'
                              size='sm'
                              className='text-xs'
                            >
                              <Link
                                to={`/tenants/new?bedId=${b.s_no}&roomId=${room.s_no}`}
                              >
                                Add Tenant
                              </Link>
                            </Button>
                          )}
                          <ActionButtons
                            mode='icon'
                            onEdit={() => openEditBed(b)}
                            onDelete={() => askDeleteBed(b)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <BedFormDialog
            open={bedDialogOpen}
            onOpenChange={(open: boolean) => {
              setBedDialogOpen(open)
              if (!open) setEditBed(null)
            }}
            editTarget={editBed}
            rooms={[room]}
            defaultRoomId={room.s_no}
            pgId={selectedPGLocationId}
            onSaved={() => {
              setBedDialogOpen(false)
              setEditBed(null)
              void refetchBeds()
              void refetchRoom()
            }}
          />

          <RoomFormDialog
            open={roomDialogOpen}
            onOpenChange={setRoomDialogOpen}
            editTarget={room}
            pgId={selectedPGLocationId}
            onSaved={() => {
              setRoomDialogOpen(false)
              void refetchRoom()
              void refetchBeds()
            }}
          />

          <AlertDialog open={deleteBedOpen} onOpenChange={setDeleteBedOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Bed</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{' '}
                  <span className='font-semibold'>
                    {deleteBedTarget?.bed_no}
                  </span>
                  ? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setDeleteBedOpen(false)
                    setDeleteBedTarget(null)
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteBed}
                  disabled={deletingBed}
                >
                  {deletingBed ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={deleteRoomOpen} onOpenChange={setDeleteRoomOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Room</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{' '}
                  <span className='font-semibold'>Room {room.room_no}</span>?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteRoomOpen(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteRoom}
                  disabled={deletingRoom}
                >
                  {deletingRoom ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}
