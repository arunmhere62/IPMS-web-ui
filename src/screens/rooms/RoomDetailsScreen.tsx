import { useState } from 'react'
import { RoomFormDialog } from '@/screens/rooms/RoomFormDialog'
import { BedFormDialog } from '@/screens/rooms/BedFormDialog'
import { BulkAddBedsDialog } from '@/screens/rooms/BulkAddBedsDialog'
import {
  type Room,
  type Bed,
  useDeleteRoomMutation,
  useGetRoomByIdQuery,
  useGetBedsByRoomIdQuery,
  useDeleteBedMutation,
} from '@/services/roomsApi'
import { useAppSelector } from '@/store/hooks'
import {
  CircleAlert,
  Zap,
  ChevronRight,
  Bed as BedIcon,
  Plus,
  Layers,
  User,
  Pencil,
  Trash2,
} from 'lucide-react'
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
import { Card, CardContent } from '@/components/ui/card'
import { ActionButtons } from '@/components/form/action-buttons'
import { PageHeader } from '@/components/form/page-header'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/config/rbac.config'
import { Button } from '@/components/ui/button'

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


export function RoomDetailsScreen() {
  const navigate = useNavigate()
  const params = useParams()
  const roomId = Number(params.id)

  const { can } = usePermissions()
  const canEditRoom = can(Permission.EDIT_ROOM)
  const canDeleteRoom = can(Permission.DELETE_ROOM)
  const canCreateBed = can(Permission.CREATE_BED)
  const canEditBed = can(Permission.EDIT_BED)
  const canDeleteBed = can(Permission.DELETE_BED)

  const selectedPGLocationId = useAppSelector(
    (s: RootState) => s.pgLocations?.selectedPGLocationId
  )

  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [deleteRoomOpen, setDeleteRoomOpen] = useState(false)
  const [deleteBedOpen, setDeleteBedOpen] = useState(false)
  const [bedToDelete, setBedToDelete] = useState<Bed | null>(null)
  const [bedFormOpen, setBedFormOpen] = useState(false)
  const [bedToEdit, setBedToEdit] = useState<Bed | null>(null)
  const [bulkAddOpen, setBulkAddOpen] = useState(false)

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
    refetch: refetchBeds,
  } = useGetBedsByRoomIdQuery(Number.isFinite(roomId) ? roomId : 0, {
    skip: !Number.isFinite(roomId) || roomId <= 0,
  })

  const [deleteRoom, { isLoading: deletingRoom }] = useDeleteRoomMutation()
  const [deleteBed, { isLoading: deletingBed }] = useDeleteBedMutation()

  const room = unwrapRoom(roomResponse)
  const beds = bedsResponse?.data || []
  const existingBedNumbers = beds.map((b) => b.bed_no)

  const extendedRoom = room as ExtendedRoom

  const fetchErrorMessage =
    (roomError as ApiError)?.data?.message ||
    (roomError as ApiError)?.message

  const images: string[] = Array.isArray(extendedRoom?.images)
    ? (extendedRoom.images ?? [])
    : []

  const total = Number(extendedRoom?.total_beds ?? 0)
  const occupied = Number(extendedRoom?.occupied_beds ?? 0)
  const available = Number(extendedRoom?.available_beds ?? Math.max(0, total - occupied))

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

  const handleDeleteBed = async () => {
    if (!bedToDelete) return
    try {
      await deleteBed(bedToDelete.s_no).unwrap()
      showSuccessAlert('Bed deleted successfully')
      setDeleteBedOpen(false)
      setBedToDelete(null)
      void refetchBeds()
      void refetchRoom()
    } catch (e: unknown) {
      showErrorAlert(e as Error, 'Delete Error')
    }
  }

  const formatCurrency = (amount?: number | string) => {
    const n = Number(amount ?? 0)
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n)
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
              editDisabled={!canEditRoom}
              deleteDisabled={!canDeleteRoom}
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

          {/* Electricity Bills */}
          <Card className='py-0 shadow-sm'>
            <CardContent className='p-4'>
              <Link
                to={`/rooms/${roomId}/electricity-bills`}
                className='flex items-center justify-between transition-colors hover:text-primary'
              >
                <div className='flex items-center gap-3'>
                  <div className='flex size-11 items-center justify-center rounded-xl bg-amber-500/10'>
                    <Zap className='size-5 text-amber-500' />
                  </div>
                  <div>
                    <h3 className='text-sm font-semibold'>Electricity Bills</h3>
                    <p className='text-xs text-muted-foreground'>
                      View & manage room bills
                    </p>
                  </div>
                </div>
                <ChevronRight className='size-5 text-muted-foreground' />
              </Link>

            </CardContent>
          </Card>

          {/* Beds List */}
          <Card className='py-0 shadow-sm'>
            <CardContent className='p-4'>
              <div className='mb-3 flex items-center justify-between'>
                <h3 className='text-base font-semibold'>
                  🛏️ Beds ({beds.length})
                </h3>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    disabled={!canCreateBed}
                    className='gap-1.5'
                    onClick={() => {
                      setBedToEdit(null)
                      setBedFormOpen(true)
                    }}
                  >
                    <Plus className='size-4' />
                    Add Bed
                  </Button>
                  <Button
                    size='sm'
                    variant='secondary'
                    disabled={!canCreateBed}
                    className='gap-1.5'
                    onClick={() => setBulkAddOpen(true)}
                  >
                    <Layers className='size-4' />
                    Bulk Add
                  </Button>
                </div>
              </div>

              {beds.length > 0 ? (
                <div className='grid grid-cols-2 gap-3'>
                  {beds.map((bed) => {
                    const occupied = bed.is_occupied
                    const tenant = bed.tenants?.[0]
                    return (
                      <div
                        key={bed.s_no}
                        className={`w-full rounded-xl p-4 ${
                          occupied ? 'bg-red-50' : 'bg-green-50'
                        }`}
                      >
                        <div className='mb-3 flex items-center gap-3'>
                          <div className='flex size-9 items-center justify-center rounded-lg bg-white'>
                            <BedIcon
                              className='size-5'
                              style={{ color: occupied ? '#DC2626' : '#16A34A' }}
                            />
                          </div>
                          <div>
                            <div className='text-sm font-semibold'>{bed.bed_no}</div>
                            <div
                              className={`text-xs ${
                                occupied ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {occupied ? 'Occupied' : 'Available'}
                            </div>
                          </div>
                        </div>

                        <div className='mb-3'>
                          {occupied && tenant ? (
                            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                              <User className='size-3' />
                              <span className='font-medium'>{tenant.name}</span>
                            </div>
                          ) : (
                            <div className='text-sm font-semibold text-primary'>
                              {bed.bed_price
                                ? formatCurrency(bed.bed_price) + '/mo'
                                : '—'}
                            </div>
                          )}
                        </div>

                        {!occupied ? (
                          <Button
                            size='sm'
                            className='w-full bg-green-600 hover:bg-green-700'
                          >
                            + Add Tenant
                          </Button>
                        ) : tenant?.s_no ? (
                          <Button
                            size='sm'
                            variant='destructive'
                            className='w-full'
                            onClick={() => navigate(`/tenants/${tenant.s_no}`)}
                          >
                            View Tenant
                          </Button>
                        ) : null}

                        <div className='mt-3 flex gap-2'>
                          {canEditBed && (
                            <Button
                              size='sm'
                              variant='outline'
                              className='flex-1 gap-1.5 text-xs'
                              onClick={() => {
                                setBedToEdit(bed)
                                setBedFormOpen(true)
                              }}
                            >
                              <Pencil className='size-3' />
                              Edit
                            </Button>
                          )}
                          {canDeleteBed && (
                            <Button
                              size='sm'
                              variant='outline'
                              className='flex-1 gap-1.5 text-xs'
                              onClick={() => {
                                setBedToDelete(bed)
                                setDeleteBedOpen(true)
                              }}
                            >
                              <Trash2 className='size-3' />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className='flex flex-col items-center py-8'>
                  <span className='text-4xl'>🛏️</span>
                  <p className='mt-2 text-sm text-muted-foreground'>
                    No beds in this room
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <RoomFormDialog
            open={roomDialogOpen}
            onOpenChange={setRoomDialogOpen}
            editTarget={room}
            pgId={selectedPGLocationId}
            onSaved={() => {
              setRoomDialogOpen(false)
              void refetchRoom()
            }}
          />

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

          <AlertDialog open={deleteBedOpen} onOpenChange={setDeleteBedOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Bed</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{' '}
                  <span className='font-semibold'>Bed {bedToDelete?.bed_no}</span>?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteBedOpen(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteBed}
                  disabled={deletingBed}
                >
                  {deletingBed ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <BedFormDialog
            open={bedFormOpen}
            onOpenChange={setBedFormOpen}
            roomId={roomId}
            roomNo={room?.room_no || ''}
            pgId={selectedPGLocationId || 0}
            editTarget={bedToEdit}
            defaultPrice={bedToEdit ? undefined : beds[0]?.bed_price?.toString() || ''}
            existingBedNumbers={existingBedNumbers}
            onSaved={() => {
              void refetchBeds()
              void refetchRoom()
            }}
          />

          <BulkAddBedsDialog
            open={bulkAddOpen}
            onOpenChange={setBulkAddOpen}
            roomId={roomId}
            roomNo={room?.room_no || ''}
            pgId={selectedPGLocationId || 0}
            existingBedCount={beds.length}
            defaultPrice={beds[0]?.bed_price?.toString() || ''}
            existingBedNumbers={existingBedNumbers}
            onSaved={() => {
              void refetchBeds()
              void refetchRoom()
            }}
          />
        </div>
      )}
    </div>
  )
}
