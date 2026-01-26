import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, CircleAlert, Plus } from 'lucide-react'

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
import { PageHeader } from '@/components/form/page-header'
import { ActionButtons } from '@/components/form/action-buttons'

import { BedFormDialog } from '@/screens/beds/BedFormDialog'
import { RoomFormDialog } from '@/screens/rooms/RoomFormDialog'
import { useAppSelector } from '@/store/hooks'
import {
  type Bed,
  type Room,
  useDeleteBedMutation,
  useDeleteRoomMutation,
  useGetBedsByRoomIdQuery,
  useGetRoomByIdQuery,
} from '@/services/roomsApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

const unwrapRoom = (response: any): Room | null => {
  if (!response) return null
  const root = (response as any)?.data ?? response
  const nested = (root as any)?.data ?? root
  return (nested as any) ?? null
}

const unwrapBeds = (response: any): Bed[] => {
  if (!response) return []
  const root = (response as any)?.data ?? response
  const nested = (root as any)?.data ?? root
  const data = Array.isArray(nested) ? nested : Array.isArray((nested as any)?.data) ? (nested as any).data : []
  return Array.isArray(data) ? (data as Bed[]) : []
}

export function RoomDetailsScreen() {
  const navigate = useNavigate()
  const params = useParams()
  const roomId = Number(params.id)

  const selectedPGLocationId = useAppSelector((s) => (s as any).pgLocations?.selectedPGLocationId) as number | null

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
  } = useGetRoomByIdQuery(Number.isFinite(roomId) ? roomId : (0 as any), {
    skip: !Number.isFinite(roomId) || roomId <= 0,
  } as any)

  const {
    data: bedsResponse,
    isLoading: bedsLoading,
    error: bedsError,
    refetch: refetchBeds,
  } = useGetBedsByRoomIdQuery(Number.isFinite(roomId) ? roomId : (0 as any), {
    skip: !Number.isFinite(roomId) || roomId <= 0,
  } as any)

  const [deleteRoom, { isLoading: deletingRoom }] = useDeleteRoomMutation()
  const [deleteBed, { isLoading: deletingBed }] = useDeleteBedMutation()

  const room = unwrapRoom(roomResponse)
  const beds = unwrapBeds(bedsResponse)

  const fetchErrorMessage =
    (roomError as any)?.data?.message || (roomError as any)?.message || (bedsError as any)?.data?.message || (bedsError as any)?.message

  const images: string[] = Array.isArray((room as any)?.images) ? ((room as any).images as any) : []

  const stats = useMemo(() => {
    const total = Number((room as any)?.total_beds ?? beds.length)
    const occupied = Number((room as any)?.occupied_beds ?? beds.filter((b) => Boolean((b as any)?.is_occupied)).length)
    const available = Number((room as any)?.available_beds ?? Math.max(0, total - occupied))
    return { total, occupied, available }
  }, [beds, room])

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
    } catch (e: any) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const confirmDeleteRoom = async () => {
    if (!Number.isFinite(roomId) || roomId <= 0) return
    try {
      await deleteRoom(roomId).unwrap()
      showSuccessAlert('Room deleted successfully')
      navigate('/rooms')
    } catch (e: any) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  return (
    <div className='container mx-auto max-w-6xl px-3 py-6'>
      <PageHeader
        title={room?.room_no ? `Room ${room.room_no}` : 'Room Details'}
        subtitle={room?.pg_locations?.location_name ? String(room.pg_locations.location_name) : ''}
        right={
          <>
            <Button asChild variant='outline' size='sm'>
              <Link to='/rooms'>
                <ChevronLeft className='me-1 size-4' />
                Back
              </Link>
            </Button>
            {room?.s_no ? <Badge variant='outline'>#{room.s_no}</Badge> : null}
            <Button variant='outline' size='sm' onClick={() => {
              void refetchRoom()
              void refetchBeds()
            }}>
              Refresh
            </Button>
          </>
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
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>Select a PG Location</div>
          <div className='mt-1 text-xs text-muted-foreground'>Choose a PG from the top bar to manage rooms.</div>
        </div>
      ) : roomLoading ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>Loading...</div>
      ) : !room ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>Room not found</div>
          <div className='mt-1 text-xs text-muted-foreground'>Please check the room id and try again.</div>
        </div>
      ) : (
        <div className='mt-4 grid gap-4'>
          <Card>
            <CardContent className='p-3'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div className='min-w-0'>
                  <div className='text-sm font-semibold'>Room {room.room_no}</div>
                  <div className='mt-1 text-xs text-muted-foreground'>PG ID: {room.pg_id}</div>
                </div>

                <div className='flex flex-wrap items-center justify-end gap-2'>
                  <Button size='sm' onClick={() => setRoomDialogOpen(true)}>
                    Edit Room
                  </Button>
                  <Button variant='destructive' size='sm' onClick={() => setDeleteRoomOpen(true)}>
                    Delete Room
                  </Button>
                </div>
              </div>

              <div className='mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground'>
                <div>
                  <div className='font-semibold text-foreground'>{stats.total}</div>
                  <div>Total Beds</div>
                </div>
                <div>
                  <div className='font-semibold text-foreground'>{stats.occupied}</div>
                  <div>Occupied</div>
                </div>
                <div>
                  <div className='font-semibold text-foreground'>{stats.available}</div>
                  <div>Available</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-3'>
              <div className='text-sm font-semibold'>Room Images</div>
              {images.length === 0 ? (
                <div className='mt-2 text-xs text-muted-foreground'>No images</div>
              ) : (
                <div className='mt-2 flex flex-wrap gap-3'>
                  {images.map((url) => (
                    <div key={url} className='h-24 w-24 overflow-hidden rounded-md border bg-muted'>
                      <img src={url} alt='' className='h-full w-full object-cover' />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-3'>
              <div className='flex items-center justify-between gap-2'>
                <div>
                  <div className='text-sm font-semibold'>Beds</div>
                  <div className='text-xs text-muted-foreground'>Manage beds in this room</div>
                </div>

                <Button size='sm' onClick={openAddBed} disabled={!selectedPGLocationId}>
                  <Plus className='me-2 size-4' />
                  Add Bed
                </Button>
              </div>

              {bedsLoading ? (
                <div className='mt-3 rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>Loading...</div>
              ) : beds.length === 0 ? (
                <div className='mt-3 rounded-md border bg-card px-3 py-6 text-center'>
                  <div className='text-base font-semibold'>No Beds</div>
                  <div className='mt-1 text-xs text-muted-foreground'>Add your first bed to this room.</div>
                </div>
              ) : (
                <div className='mt-3 grid gap-2'>
                  {beds.map((b) => (
                    <div key={b.s_no} className='rounded-md border p-3'>
                      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='min-w-0'>
                          <div className='text-sm font-semibold'>{b.bed_no}</div>
                          <div className='mt-0.5 text-xs text-muted-foreground'>
                            {String((b as any).is_occupied ? 'Occupied' : 'Available')}
                            {String(b.bed_price ?? '').length > 0 ? ` • ₹${String(b.bed_price)}` : ''}
                            {(b as any).tenants?.[0]?.name ? ` • ${(b as any).tenants[0].name}` : ''}
                            {(b as any).tenants?.[0]?.phone_no ? ` • ${(b as any).tenants[0].phone_no}` : ''}
                          </div>
                        </div>

                        <ActionButtons
                          mode='icon'
                          onEdit={() => openEditBed(b)}
                          onDelete={() => askDeleteBed(b)}
                        />
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
                  Are you sure you want to delete <span className='font-semibold'>{deleteBedTarget?.bed_no}</span>? This action cannot be undone.
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
                <AlertDialogAction onClick={confirmDeleteBed} disabled={deletingBed}>
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
                  Are you sure you want to delete <span className='font-semibold'>{room.room_no}</span>? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteRoomOpen(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteRoom} disabled={deletingRoom}>
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
