import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, CircleAlert, Pencil, RefreshCw, Trash2 } from 'lucide-react'

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

import { useAppSelector } from '@/store/hooks'
import { useDeleteVisitorMutation, useGetVisitorByIdQuery, type Visitor } from '@/services/visitorsApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

type ErrorLike = {
  data?: {
    message?: string
  }
  message?: string
}

const toDateOnly = (value?: string) => {
  const s = String(value ?? '')
  if (!s) return ''
  return s.includes('T') ? s.split('T')[0] : s
}

const DetailRow = ({ label, value }: { label: string; value?: string | number | null }) => {
  return (
    <div className='flex items-start justify-between gap-4 border-b py-2 last:border-b-0'>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='text-sm font-semibold text-right'>{value == null || value === '' ? '—' : String(value)}</div>
    </div>
  )
}

export function VisitorDetailsScreen() {
  const navigate = useNavigate()
  const params = useParams()
  const visitorId = Number(params.id)

  const selectedPGLocationId = useAppSelector((s) => s.pgLocations.selectedPGLocationId)

  const {
    data: visitorResponse,
    isLoading,
    error: visitorError,
    refetch,
  } = useGetVisitorByIdQuery(Number.isFinite(visitorId) ? visitorId : 0, {
    skip: !Number.isFinite(visitorId) || visitorId <= 0,
  })

  const visitor = (visitorResponse as unknown as Visitor | null) ?? null

  const [deleteVisitor, { isLoading: deleting }] = useDeleteVisitorMutation()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const fetchErrorMessage =
    (visitorError as ErrorLike | undefined)?.data?.message || (visitorError as ErrorLike | undefined)?.message

  const confirmDelete = async () => {
    if (!visitor) return
    try {
      await deleteVisitor(visitor.s_no).unwrap()
      showSuccessAlert('Visitor deleted successfully')
      setDeleteDialogOpen(false)
      navigate('/visitors')
    } catch (e: unknown) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  return (
    <div className='container mx-auto max-w-5xl px-3 py-6'>
      <PageHeader
        title={visitor?.visitor_name ? visitor.visitor_name : 'Visitor Details'}
        subtitle={visitor?.phone_no ? visitor.phone_no : ''}
        right={
          <>
            <Button asChild variant='outline' size='sm'>
              <Link to='/visitors'>
                <ChevronLeft className='me-1 size-4' />
                Back
              </Link>
            </Button>
            {Number.isFinite(visitorId) ? <Badge variant='outline'>#{visitorId}</Badge> : null}
            <Button variant='outline' size='sm' onClick={() => void refetch()} disabled={!selectedPGLocationId}>
              <RefreshCw className='me-2 size-4' />
              Refresh
            </Button>
          </>
        }
      />

      {fetchErrorMessage ? (
        <div className='mt-4'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load visitor</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>Select a PG Location</div>
          <div className='mt-1 text-xs text-muted-foreground'>Choose a PG from the top bar to manage visitors.</div>
        </div>
      ) : isLoading ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>Loading...</div>
      ) : !visitor ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>Visitor not found</div>
          <div className='mt-1 text-xs text-muted-foreground'>Please check the visitor id and try again.</div>
        </div>
      ) : (
        <div className='mt-4 grid gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div className='min-w-0'>
                  <div className='text-sm font-semibold'>{visitor.visitor_name}</div>
                  <div className='mt-1 text-xs text-muted-foreground'>
                    {visitor.phone_no ? visitor.phone_no : 'Phone —'}
                    {visitor.purpose ? ` • ${visitor.purpose}` : ''}
                    {visitor.visited_date ? ` • ${toDateOnly(visitor.visited_date)}` : ''}
                  </div>
                </div>

                <div className='flex flex-wrap items-center justify-end gap-2'>
                  <Button asChild size='sm'>
                    <Link to={`/visitors/${visitor.s_no}/edit`}>
                      <Pencil className='me-2 size-4' />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant='destructive'
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={deleting}
                  >
                    <Trash2 className='me-2 size-4' />
                    Delete
                  </Button>
                </div>
              </div>

              <div className='mt-4 grid gap-2'>
                <DetailRow label='Converted to Tenant' value={visitor.convertedTo_tenant ? 'Yes' : 'No'} />
                <DetailRow label='Remarks' value={visitor.remarks ?? '—'} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='text-sm font-semibold'>Location</div>
              <div className='mt-3 grid gap-2'>
                <DetailRow label='PG' value={visitor.pg_locations?.location_name ?? visitor.pg_id ?? '—'} />
                <DetailRow label='State' value={visitor.state?.name ?? visitor.state_id ?? '—'} />
                <DetailRow label='City' value={visitor.city?.name ?? visitor.city_id ?? '—'} />
                <DetailRow label='Address' value={visitor.address ?? '—'} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='text-sm font-semibold'>Room / Bed</div>
              <div className='mt-3 grid gap-2'>
                <DetailRow label='Room' value={visitor.rooms?.room_no ?? visitor.visited_room_id ?? '—'} />
                <DetailRow label='Bed' value={visitor.beds?.bed_no ?? visitor.visited_bed_id ?? '—'} />
                <DetailRow label='Bed Price' value={visitor.beds?.bed_price ?? '—'} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visitor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className='font-semibold'>{visitor?.visitor_name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
