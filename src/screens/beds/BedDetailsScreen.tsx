import { useState } from 'react'
import { useGetBedByIdQuery, useDeleteBedMutation } from '@/services/roomsApi'
import { useAppSelector } from '@/store/hooks'
import { CircleAlert, Plus, User, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { BedFormDialog } from './BedFormDialog'

export function BedDetailsScreen() {
  const navigate = useNavigate()
  const params = useParams()
  const bedId = Number(params.id)

  const selectedPGLocationId = useAppSelector(
    (s) => s.pgLocations?.selectedPGLocationId
  ) as number | null

  const [bedDialogOpen, setBedDialogOpen] = useState(false)
  const [deleteBedOpen, setDeleteBedOpen] = useState(false)

  const {
    data: bedResponse,
    isLoading: bedLoading,
    error: bedError,
    refetch: refetchBed,
  } = useGetBedByIdQuery(Number.isFinite(bedId) ? bedId : 0, {
    skip: !Number.isFinite(bedId) || bedId <= 0,
  })

  const [deleteBed, { isLoading: deletingBed }] = useDeleteBedMutation()

  const bed = bedResponse?.data

  const fetchErrorMessage =
    (bedError as { data?: { message?: string }; message?: string })?.data
      ?.message || (bedError as { message?: string })?.message

  const tenant = bed?.tenants?.[0]
  const isOccupied = Boolean(bed?.is_occupied)

  const confirmDeleteBed = async () => {
    if (!bed) return
    try {
      await deleteBed(bed.s_no).unwrap()
      alert('Bed deleted successfully')
      navigate('/beds')
    } catch (_e: unknown) {
      alert('Failed to delete bed')
    }
  }

  const handleAddTenant = () => {
    navigate(`/tenants/new?bedId=${bed?.s_no}&roomId=${bed?.room_id}`)
  }

  const handleViewTenant = () => {
    if (tenant?.s_no) {
      navigate(`/tenants/${tenant.s_no}`)
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Compact Header */}
      <div className='sticky top-0 z-10 border-b bg-background px-3 py-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => navigate('/beds')}
              className='h-7 w-7'
            >
              <ArrowLeft className='size-4' />
            </Button>
            <div>
              <h1 className='text-sm font-semibold'>
                {bed?.bed_no ? `Bed ${bed.bed_no}` : 'Bed Details'}
              </h1>
              <p className='text-[10px] text-muted-foreground'>
                {bed?.rooms?.room_no ? `Room ${bed.rooms.room_no}` : ''}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-1'>
            {bed?.s_no ? (
              <Badge variant='outline' className='text-[10px] px-1.5 py-0'>
                #{bed.s_no}
              </Badge>
            ) : null}
            {bed && (
              <>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setBedDialogOpen(true)}
                  className='h-7 w-7'
                >
                  <Edit className='size-3.5' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setDeleteBedOpen(true)}
                  className='h-7 w-7 text-destructive'
                >
                  <Trash2 className='size-3.5' />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {fetchErrorMessage ? (
        <div className='px-3 py-2'>
          <Alert variant='destructive' className='py-2'>
            <CircleAlert className='size-3' />
            <AlertTitle className='text-xs'>Error</AlertTitle>
            <AlertDescription className='text-[10px]'>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <div className='px-3 py-8 text-center'>
          <div className='text-xs font-medium'>Select a PG Location</div>
          <div className='text-[10px] text-muted-foreground'>
            Choose a PG from the top bar to view bed details.
          </div>
        </div>
      ) : bedLoading ? (
        <div className='px-3 py-4 text-center text-[10px] text-muted-foreground'>
          Loading...
        </div>
      ) : !bed ? (
        <div className='px-3 py-8 text-center'>
          <div className='text-xs font-medium'>Bed not found</div>
          <div className='text-[10px] text-muted-foreground'>
            Please check the bed ID and try again.
          </div>
        </div>
      ) : (
        <div className='space-y-2 px-3 py-3'>
          {/* Compact Bed Info Card */}
          <Card>
            <CardContent className='p-3'>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <div className='flex size-8 items-center justify-center rounded-lg bg-black text-white'>
                    <User className='size-4' />
                  </div>
                  <div>
                    <h2 className='text-sm font-semibold'>Bed {bed.bed_no}</h2>
                    <p className='text-[10px] text-muted-foreground'>
                      Room {bed.rooms?.room_no || bed.room_id} • ID: {bed.s_no}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={isOccupied ? 'secondary' : 'outline'}
                  className='text-[10px] h-5'
                >
                  {isOccupied ? 'Occupied' : 'Available'}
                </Badge>
              </div>

              <div className='mt-3 grid grid-cols-2 gap-2'>
                <div className='rounded-md bg-muted/30 p-2'>
                  <div className='text-[10px] text-muted-foreground'>Price</div>
                  <div className='text-xs font-semibold'>
                    {bed.bed_price != null && String(bed.bed_price).length > 0
                      ? `₹${String(bed.bed_price)}`
                      : '—'}
                  </div>
                </div>
                <div className='rounded-md bg-muted/30 p-2'>
                  <div className='text-[10px] text-muted-foreground'>Room</div>
                  <div className='text-xs font-semibold'>
                    {bed.rooms?.room_no || '—'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compact Tenant Card */}
          <Card>
            <CardContent className='p-3'>
              <div className='mb-2 flex items-center justify-between'>
                <h3 className='text-xs font-semibold'>Tenant</h3>
                {!isOccupied ? (
                  <Button
                    size='sm'
                    onClick={handleAddTenant}
                    className='h-6 text-xs bg-black text-white hover:bg-black/90'
                  >
                    <Plus className='mr-1 size-3' />
                    Add
                  </Button>
                ) : (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleViewTenant}
                    className='h-6 text-[10px]'
                  >
                    View
                  </Button>
                )}
              </div>

              {isOccupied && tenant ? (
                <div className='flex items-center gap-2 rounded-md border bg-muted/30 p-2'>
                  <div className='flex size-6 items-center justify-center rounded-full bg-blue-600 text-white'>
                    <User className='size-3' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='text-xs font-medium truncate'>{tenant.name}</div>
                    <div className='text-[10px] text-muted-foreground'>
                      {tenant.phone_no ? tenant.phone_no : 'No phone'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className='rounded-md border border-dashed bg-muted/30 p-3 text-center'>
                  <User className='mx-auto size-4 text-muted-foreground' />
                  <div className='mt-1 text-[10px] font-medium'>No Tenant</div>
                  <div className='text-[9px] text-muted-foreground'>Available</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compact Images Card */}
          {bed.images && Array.isArray(bed.images) && bed.images.length > 0 && (
            <Card>
              <CardContent className='p-3'>
                <h3 className='mb-2 text-xs font-semibold'>Images</h3>
                <div className='grid grid-cols-3 gap-1'>
                  {bed.images.map((url: string, index: number) => (
                    <div
                      key={index}
                      className='aspect-square overflow-hidden rounded-md border bg-muted'
                    >
                      <img
                        src={url}
                        alt={`Bed ${bed.bed_no} - ${index + 1}`}
                        className='h-full w-full object-cover'
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* PG Location Card */}
          {bed.rooms?.pg_locations?.location_name && (
            <Card>
              <CardContent className='p-3'>
                <h3 className='mb-2 text-xs font-semibold'>PG Location</h3>
                <div className='text-[10px] text-muted-foreground'>
                  {bed.rooms.pg_locations.location_name}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Bed Dialog */}
      <BedFormDialog
        open={bedDialogOpen}
        onOpenChange={(open: boolean) => {
          setBedDialogOpen(open)
        }}
        editTarget={bed || null}
        rooms={
          bed?.rooms
            ? [
                {
                  s_no: bed.rooms.s_no,
                  room_no: bed.rooms.room_no,
                  pg_id: bed.pg_id || 0,
                  pg_locations: bed.rooms.pg_locations,
                },
              ]
            : []
        }
        defaultRoomId={bed?.room_id}
        pgId={selectedPGLocationId || 0}
        onSaved={() => {
          setBedDialogOpen(false)
          void refetchBed()
        }}
      />

      {/* Delete Bed Dialog */}
      <AlertDialog open={deleteBedOpen} onOpenChange={setDeleteBedOpen}>
        <AlertDialogContent className='max-w-sm'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-sm'>Delete Bed</AlertDialogTitle>
            <AlertDialogDescription className='text-xs'>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>Bed {bed?.bed_no}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteBedOpen(false)}
              className='text-xs'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBed}
              disabled={deletingBed}
              className='text-xs'
            >
              {deletingBed ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
