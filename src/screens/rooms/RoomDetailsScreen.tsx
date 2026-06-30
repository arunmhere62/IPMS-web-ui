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
import { Bed as BedIcon, CircleAlert, Plus, User, Pencil, Trash2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ActionButtons } from '@/components/form/action-buttons'
import { PageHeader } from '@/components/form/page-header'

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
    <div className='container mx-auto max-w-4xl px-4 py-4'>
      <PageHeader
        title={room?.room_no ? `Room ${room.room_no}` : 'Room Details'}
        showBack={true}
        subtitle={
          room?.pg_locations?.location_name
            ? String(room.pg_locations.location_name)
            : 'View and manage room information'
        }
        right={
          room ? (
            <ActionButtons
              onEdit={() => setRoomDialogOpen(true)}
              onDelete={() => setDeleteRoomOpen(true)}
            />
          ) : null
        }
      />

      {fetchErrorMessage ? (
        <div className='mt-4'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load room details</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <div className='mt-4 flex flex-col items-center justify-center py-20'>
          <span className='text-5xl'>🏠</span>
          <p className='mt-4 text-lg font-semibold'>Select a PG Location</p>
          <p className='mt-1 text-sm text-muted-foreground'>
            Choose a PG from the top bar.
          </p>
        </div>
      ) : roomLoading ? (
        <div className='mt-4 flex flex-col items-center justify-center py-20'>
          <div className='size-8 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
          <p className='mt-3 text-sm text-muted-foreground'>Loading...</p>
        </div>
      ) : !room ? (
        <div className='mt-4 flex flex-col items-center justify-center py-20'>
          <span className='text-5xl'>🏠</span>
          <p className='mt-4 text-lg font-semibold'>Room Not Found</p>
        </div>
      ) : (
        <div className='mt-4 space-y-4'>
          {/* Header Card */}
          <Card className='py-0 shadow-sm'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex size-11 items-center justify-center rounded-2xl bg-blue-600/10'>
                    <span className='text-xl'>🏠</span>
                  </div>
                  <div>
                    <h2 className='text-lg font-bold'>Room {room.room_no}</h2>
                    <p className='text-xs text-muted-foreground'>ID: {room.s_no}</p>
                  </div>
                </div>
                <ActionButtons
                  onEdit={() => setRoomDialogOpen(true)}
                  onDelete={() => setDeleteRoomOpen(true)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Room Images */}
          <Card className='py-0 shadow-sm'>
            <CardContent className='p-4'>
              <h3 className='mb-3 text-base font-semibold'>
                📷 Room Images{images.length > 0 ? ` (${images.length})` : ''}
              </h3>
              {images.length > 0 ? (
                <div className='flex gap-3 overflow-x-auto pb-2'>
                  {images.map((url, index) => (
                    <div
                      key={index}
                      className='relative h-36 w-52 shrink-0 overflow-hidden rounded-xl shadow-sm'
                    >
                      <img
                        src={url}
                        alt={`Room ${index + 1}`}
                        className='h-full w-full object-cover'
                      />
                      <div className='absolute bottom-2 left-2 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-semibold text-white'>
                        {index + 1} / {images.length}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center py-8'>
                  <span className='text-4xl'>📷</span>
                  <p className='mt-2 text-sm text-muted-foreground'>
                    No images present for this room
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Room Stats */}
          <Card className='py-0 shadow-sm'>
            <CardContent className='px-4 py-3'>
              <div className='flex items-center justify-between'>
                <div className='flex flex-1 flex-col items-center'>
                  <span className='text-xs font-semibold text-muted-foreground'>TOTAL</span>
                  <span className='mt-1 text-base font-bold'>{total}</span>
                </div>
                <div className='h-7 w-px bg-border' />
                <div className='flex flex-1 flex-col items-center'>
                  <span className='text-xs font-semibold text-green-600'>AVAILABLE</span>
                  <span className='mt-1 text-base font-bold text-green-600'>{available}</span>
                </div>
                <div className='h-7 w-px bg-border' />
                <div className='flex flex-1 flex-col items-center'>
                  <span className='text-xs font-semibold text-red-600'>OCCUPIED</span>
                  <span className='mt-1 text-base font-bold text-red-600'>{occupied}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PG Location Info */}
          {extendedRoom?.pg_locations && (
            <Card className='py-0 shadow-sm'>
              <CardContent className='p-4'>
                <h3 className='mb-3 text-sm font-semibold'>📍 PG Location</h3>
                <p className='text-base font-semibold'>
                  {extendedRoom.pg_locations.location_name}
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Location ID: {extendedRoom.pg_locations.s_no}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Beds List */}
          <Card className='py-0 shadow-sm'>
            <CardContent className='p-4'>
              <div className='mb-3 flex items-center justify-between'>
                <h3 className='text-base font-bold'>
                  🛏️ Beds ({beds.length})
                </h3>
                <Button
                  size='sm'
                  onClick={openAddBed}
                  disabled={!selectedPGLocationId}
                  className='bg-blue-600 text-xs text-white hover:bg-blue-700'
                >
                  <Plus className='mr-1 size-3.5' />
                  Add Bed
                </Button>
              </div>

              {bedsLoading ? (
                <div className='flex flex-col items-center py-8'>
                  <div className='size-6 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
                  <p className='mt-2 text-xs text-muted-foreground'>Loading beds...</p>
                </div>
              ) : beds.length === 0 ? (
                <div className='flex flex-col items-center py-8'>
                  <BedIcon className='size-10 text-gray-300' />
                  <p className='mt-3 text-sm font-semibold'>No Beds Yet</p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    Tap "Add Bed" to get started.
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                  {beds.map((b) => {
                    const eb = b as ExtendedBed
                    const isOccupied = Boolean(eb.is_occupied)
                    const tenant = eb.tenants?.[0]
                    return (
                      <div
                        key={b.s_no}
                        className={`rounded-2xl p-4 ${
                          isOccupied ? 'bg-red-50' : 'bg-green-50'
                        }`}
                      >
                        {/* Bed icon + number + status */}
                        <div className='mb-2.5 flex items-center gap-2.5'>
                          <div className='flex size-10 items-center justify-center rounded-xl bg-white'>
                            <BedIcon
                              className={`size-5 ${isOccupied ? 'text-red-600' : 'text-green-600'}`}
                            />
                          </div>
                          <div>
                            <p className='text-sm font-bold'>{b.bed_no}</p>
                            <p
                              className={`text-xs font-medium ${
                                isOccupied ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {isOccupied ? 'Occupied' : 'Available'}
                            </p>
                          </div>
                        </div>

                        {/* Tenant name or price */}
                        <div className='mb-3'>
                          {isOccupied && tenant ? (
                            <div className='flex items-center gap-1'>
                              <User className='size-3 shrink-0 text-amber-500' />
                              <span className='truncate text-xs font-medium text-muted-foreground'>
                                {tenant.name}
                              </span>
                            </div>
                          ) : (
                            <p className='text-sm font-bold text-blue-600'>
                              {b.bed_price
                                ? `₹${Number(b.bed_price).toLocaleString('en-IN')}/mo`
                                : '—'}
                            </p>
                          )}
                        </div>

                        {/* Add / View tenant button */}
                        {!isOccupied ? (
                          <Link
                            to={`/tenants/new?bedId=${b.s_no}&roomId=${room.s_no}`}
                            className='mb-2 flex items-center justify-center rounded-lg bg-green-600 py-2 text-xs font-bold text-white transition-colors hover:bg-green-700'
                          >
                            + Add Tenant
                          </Link>
                        ) : tenant?.s_no ? (
                          <Link
                            to={`/tenants/${tenant.s_no}`}
                            className='mb-2 flex items-center justify-center rounded-lg bg-red-600 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700'
                          >
                            View Tenant
                          </Link>
                        ) : (
                          <div className='mb-2' />
                        )}

                        {/* Edit + Delete buttons */}
                        <div className='flex gap-1.5'>
                          <button
                            onClick={() => openEditBed(b)}
                            className='flex flex-1 items-center justify-center gap-1 rounded-md border border-gray-300 bg-gray-100 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200'
                          >
                            <Pencil className='size-3' />
                            Edit
                          </button>
                          <button
                            onClick={() => askDeleteBed(b)}
                            className='flex flex-1 items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100'
                          >
                            <Trash2 className='size-3' />
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
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
