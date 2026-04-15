import { useState } from 'react'
import { PGLocationFormDialog } from '@/screens/pg-locations/PGLocationFormDialog'
import {
  useDeletePGLocationMutation,
  useGetPGLocationsQuery,
} from '@/services/pgLocationsApi'
import type { PGLocation } from '@/types'
import {
  CircleAlert,
  MapPin,
  Plus,
  Building2,
  Calendar,
  Users,
} from 'lucide-react'
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
import { ActionButtons } from '@/components/form/action-buttons'
import { PageHeader } from '@/components/form/page-header'

export function PGLocationsScreen() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PGLocation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PGLocation | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const {
    data: pgLocationsResponse,
    isLoading,
    error,
    refetch,
  } = useGetPGLocationsQuery(undefined)

  const [deletePGLocation, { isLoading: deleting }] =
    useDeletePGLocationMutation()

  const locations: PGLocation[] = Array.isArray(
    (pgLocationsResponse as { data?: PGLocation[] })?.data
  )
    ? (pgLocationsResponse as { data: PGLocation[] }).data
    : Array.isArray(pgLocationsResponse)
      ? (pgLocationsResponse as PGLocation[])
      : []

  const fetchErrorMessage =
    (error as { data?: { message?: string }; message?: string })?.data
      ?.message || (error as { message?: string })?.message

  const openCreate = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  const openEdit = (loc: PGLocation) => {
    setEditTarget(loc)
    setDialogOpen(true)
  }

  const askDelete = (loc: PGLocation) => {
    setDeleteTarget(loc)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deletePGLocation(deleteTarget.s_no).unwrap()
      showSuccessAlert('PG location deleted successfully')
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      void refetch()
    } catch (e) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  return (
    <div className='container mx-auto max-w-6xl px-3 py-6'>
      <PageHeader
        title='PG Locations'
        right={
          <Button
            type='button'
            size='sm'
            onClick={openCreate}
            aria-label='Add location'
            title='Add location'
            className='bg-black text-white hover:bg-black/90'
          >
            <Plus className='mr-1 size-3.5' />
            Add Location
          </Button>
        }
      />

      {fetchErrorMessage ? (
        <div className='mt-6'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load PG locations</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      <div className='mt-4'>
        {isLoading ? (
          <div className='rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>
            Loading...
          </div>
        ) : locations.length === 0 ? (
          <EmptyState
            icon={Building2}
            title='No PG Locations'
            description='Add your first PG location to get started.'
          />
        ) : (
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {locations.map((l) => {
              const hasImage = Array.isArray(l.images) && l.images.length > 0
              const imageUrl = hasImage ? l.images?.[0] : null

              return (
                <Card
                  key={l.s_no}
                  className='group h-full overflow-hidden border border-gray-200 py-0 shadow-none transition-all duration-300 hover:border-gray-300'
                >
                  <CardContent className='p-0'>
                    {/* Image Section */}
                    <div className='relative h-48 overflow-hidden bg-gradient-to-br from-black to-gray-800'>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={l.location_name}
                          className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                        />
                      ) : (
                        <div className='flex h-full items-center justify-center'>
                          <Building2 className='size-16 text-white/60' />
                        </div>
                      )}

                      {/* Status Badge Overlay */}
                      <div className='absolute top-3 right-3'>
                        <Badge
                          variant={
                            l.status === 'ACTIVE' ? 'default' : 'secondary'
                          }
                          className={`${l.status === 'ACTIVE' ? 'bg-black hover:bg-black/90' : 'bg-gray-600'} border-0 text-white`}
                        >
                          {l.status}
                        </Badge>
                      </div>

                      {/* ID Badge */}
                      <div className='absolute top-3 left-3'>
                        <Badge
                          variant='outline'
                          className='border-0 bg-white/90 text-black'
                        >
                          #{l.s_no}
                        </Badge>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className='p-6'>
                      {/* Title and Location */}
                      <div className='mb-4'>
                        <h3 className='mb-2 line-clamp-1 text-lg font-bold text-gray-900'>
                          {l.location_name}
                        </h3>
                        <div className='flex items-start gap-2 text-sm text-gray-600'>
                          <MapPin className='mt-0.5 size-4 shrink-0' />
                          <span className='line-clamp-2'>{l.address}</span>
                        </div>
                      </div>

                      {/* Location Details */}
                      <div className='mb-6 space-y-3'>
                        {/* City & State */}
                        <div className='flex items-center gap-2 text-sm'>
                          <div className='flex items-center gap-1'>
                            <span className='font-medium text-gray-700'>
                              📍
                            </span>
                            <span className='text-gray-600'>
                              {
                                (
                                  l as PGLocation & {
                                    city?: { name?: string }
                                    state?: { name?: string }
                                  }
                                ).city?.name
                              }
                              ,{' '}
                              {
                                (
                                  l as PGLocation & {
                                    city?: { name?: string }
                                    state?: { name?: string }
                                  }
                                ).state?.name
                              }
                            </span>
                          </div>
                        </div>

                        {/* PG Type */}
                        <div className='flex items-center gap-2 text-sm'>
                          <Users className='size-4 text-gray-500' />
                          <span className='text-gray-600 capitalize'>
                            {l.pg_type?.toLowerCase().replace('_', ' ') ||
                              'Mixed'}
                          </span>
                        </div>

                        {/* Rent Cycle */}
                        <div className='flex items-center gap-2 text-sm'>
                          <Calendar className='size-4 text-gray-500' />
                          <span className='text-gray-600'>
                            {l.rent_cycle_type === 'CALENDAR'
                              ? 'Monthly'
                              : 'Custom'}{' '}
                            Cycle
                            {l.rent_cycle_start &&
                              l.rent_cycle_end &&
                              ` (${l.rent_cycle_start}-${l.rent_cycle_end})`}
                          </span>
                        </div>

                        {/* Pincode */}
                        {l.pincode && (
                          <div className='flex items-center gap-2 text-sm'>
                            <span className='font-medium text-gray-700'>
                              📮
                            </span>
                            <span className='text-gray-600'>{l.pincode}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className='border-t border-gray-100 pt-4'>
                        <ActionButtons
                          mode='icon'
                          viewTo={`/pg-locations/${l.s_no}`}
                          onEdit={() => openEdit(l)}
                          onDelete={() => askDelete(l)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <PGLocationFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditTarget(null)
        }}
        editTarget={editTarget}
        onSaved={() => {
          setDialogOpen(false)
          setEditTarget(null)
          void refetch()
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete PG Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>
                {deleteTarget?.location_name}
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
    </div>
  )
}
