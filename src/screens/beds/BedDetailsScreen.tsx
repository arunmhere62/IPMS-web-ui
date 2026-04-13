import { useState } from 'react'
import { useGetBedByIdQuery, useDeleteBedMutation } from '@/services/roomsApi'
import { useAppSelector } from '@/store/hooks'
import { CircleAlert, Plus, User, Edit, Trash2 } from 'lucide-react'
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
    // Navigate to tenant creation with bed context
    navigate(`/tenants/new?bedId=${bed?.s_no}&roomId=${bed?.room_id}`)
  }

  const handleViewTenant = () => {
    if (tenant?.s_no) {
      navigate(`/tenants/${tenant.s_no}`)
    }
  }

  return (
    <div className='container mx-auto max-w-6xl px-4 py-6'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between border-b pb-4'>
        <div>
          <h1 className='text-2xl font-bold'>
            {bed?.bed_no ? `Bed ${bed.bed_no}` : 'Bed Details'}
          </h1>
          <p className='text-sm text-muted-foreground'>
            {bed?.rooms?.room_no ? `Room ${bed.rooms.room_no}` : ''}
            {bed?.rooms?.pg_locations?.location_name
              ? ` • ${bed.rooms.pg_locations.location_name}`
              : ''}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {bed?.s_no ? <Badge variant='outline'>#{bed.s_no}</Badge> : null}
          {bed && (
            <div className='ml-2 flex items-center gap-1'>
              <Button
                size='icon'
                onClick={() => setBedDialogOpen(true)}
                className='h-8 w-8 bg-black text-white hover:bg-black/90'
                title='Edit Bed'
                aria-label='Edit Bed'
              >
                <Edit className='size-4' />
              </Button>
              <Button
                variant='destructive'
                size='icon'
                onClick={() => setDeleteBedOpen(true)}
                className='h-8 w-8'
                title='Delete Bed'
                aria-label='Delete Bed'
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
          )}
        </div>
      </div>

      {fetchErrorMessage ? (
        <div className='mb-4'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load bed details</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <div className='rounded-md border bg-card px-4 py-8 text-center'>
          <div className='text-base font-semibold'>Select a PG Location</div>
          <div className='mt-1 text-xs text-muted-foreground'>
            Choose a PG from the top bar to view bed details.
          </div>
        </div>
      ) : bedLoading ? (
        <div className='rounded-md border bg-card px-4 py-4 text-sm text-muted-foreground'>
          Loading...
        </div>
      ) : !bed ? (
        <div className='rounded-md border bg-card px-4 py-8 text-center'>
          <div className='text-base font-semibold'>Bed not found</div>
          <div className='mt-1 text-xs text-muted-foreground'>
            Please check the bed ID and try again.
          </div>
        </div>
      ) : (
        <div className='grid gap-6'>
          {/* Bed Information Card */}
          <Card>
            <CardContent className='p-6'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='flex size-12 items-center justify-center rounded-lg bg-black text-white'>
                    <User className='size-6' />
                  </div>
                  <div>
                    <h2 className='text-xl font-semibold'>Bed {bed.bed_no}</h2>
                    <p className='text-sm text-muted-foreground'>
                      Room {bed.rooms?.room_no || bed.room_id} • ID: {bed.s_no}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <Badge
                    variant={isOccupied ? 'secondary' : 'outline'}
                    className='text-sm'
                  >
                    {isOccupied ? 'Occupied' : 'Available'}
                  </Badge>
                </div>
              </div>

              <div className='mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4'>
                <div>
                  <div className='text-sm text-muted-foreground'>Price</div>
                  <div className='text-lg font-semibold'>
                    {bed.bed_price != null && String(bed.bed_price).length > 0
                      ? `₹${String(bed.bed_price)}`
                      : 'Not set'}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Status</div>
                  <div className='text-lg font-semibold'>
                    {isOccupied ? 'Occupied' : 'Available'}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Room</div>
                  <div className='text-lg font-semibold'>
                    {bed.rooms?.room_no || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>
                    PG Location
                  </div>
                  <div className='text-lg font-semibold'>
                    {bed.rooms?.pg_locations?.location_name || 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tenant Information Card */}
          <Card>
            <CardContent className='p-6'>
              <div className='mb-4 flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-semibold'>Tenant Information</h3>
                  <p className='text-sm text-muted-foreground'>
                    {isOccupied
                      ? 'Current tenant details'
                      : 'No tenant assigned'}
                  </p>
                </div>

                {!isOccupied ? (
                  <Button
                    onClick={handleAddTenant}
                    className='bg-black text-white hover:bg-black/90'
                  >
                    <Plus className='mr-1 size-4' />
                    Add Tenant
                  </Button>
                ) : (
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleViewTenant}
                    >
                      View Details
                    </Button>
                  </div>
                )}
              </div>

              {isOccupied && tenant ? (
                <div className='rounded-lg border bg-muted/30 p-4'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-10 items-center justify-center rounded-full bg-blue-600 text-white'>
                      <User className='size-5' />
                    </div>
                    <div className='flex-1'>
                      <h4 className='font-semibold'>{tenant.name}</h4>
                      <p className='text-sm text-muted-foreground'>
                        {tenant.phone_no
                          ? `Phone: ${tenant.phone_no}`
                          : 'No phone number'}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        Status:{' '}
                        <span className='capitalize'>
                          {tenant.status || 'Active'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='rounded-lg border border-dashed bg-muted/30 p-8 text-center'>
                  <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-muted'>
                    <User className='size-6 text-muted-foreground' />
                  </div>
                  <div className='mt-3 text-sm font-medium'>
                    No Tenant Assigned
                  </div>
                  <div className='mt-1 text-xs text-muted-foreground'>
                    This bed is available for a new tenant.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bed Images Card */}
          {bed.images && (
            <Card>
              <CardContent className='p-6'>
                <h3 className='mb-4 text-lg font-semibold'>Bed Images</h3>
                {Array.isArray(bed.images) && bed.images.length > 0 ? (
                  <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
                    {bed.images.map((url: string, index: number) => (
                      <div
                        key={index}
                        className='aspect-square overflow-hidden rounded-lg border bg-muted'
                      >
                        <img
                          src={url}
                          alt={`Bed ${bed.bed_no} - Image ${index + 1}`}
                          className='h-full w-full object-cover'
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-sm text-muted-foreground'>
                    No images available
                  </div>
                )}
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bed</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>Bed {bed?.bed_no}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteBedOpen(false)}>
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
    </div>
  )
}
