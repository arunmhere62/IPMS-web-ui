import { useMemo, useState } from 'react'
import { CircleAlert, MapPin, Plus, Search } from 'lucide-react'

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
import { Input } from '@/components/ui/input'
import { ActionButtons } from '@/components/action-buttons'
import { PageHeader } from '@/components/page-header'
import { PGLocationFormDialog } from '@/screens/pg-locations/PGLocationFormDialog'
import {
  useDeletePGLocationMutation,
  useGetPGLocationsQuery,
} from '@/services/pgLocationsApi'
import type { PGLocation } from '@/types'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

export function PGLocationsScreen() {
  const [query, setQuery] = useState('')
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

  const [deletePGLocation, { isLoading: deleting }] = useDeletePGLocationMutation()

  const locations: PGLocation[] = Array.isArray((pgLocationsResponse as any)?.data)
    ? ((pgLocationsResponse as any).data as PGLocation[])
    : Array.isArray(pgLocationsResponse)
      ? (pgLocationsResponse as any as PGLocation[])
      : []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return locations
    return locations.filter((l) => {
      return (
        String(l.location_name || '').toLowerCase().includes(q) ||
        String(l.address || '').toLowerCase().includes(q) ||
        String(l.pincode || '').toLowerCase().includes(q)
      )
    })
  }, [locations, query])

  const fetchErrorMessage = (error as any)?.data?.message || (error as any)?.message

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
    } catch (e: any) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  return (
    <div className='container mx-auto max-w-6xl px-3 py-6'>
      <PageHeader
        title='PG Locations'
        subtitle='Manage your PG locations'
        right={
          <>
            <Button type='button' size='icon' onClick={openCreate} aria-label='Add location' title='Add location'>
              <Plus className='size-4' />
            </Button>
            <Button variant='outline' size='sm' onClick={() => refetch()}>
              Refresh
            </Button>
          </>
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

      <div className='mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div className='relative w-full sm:max-w-xs'>
          <Search className='pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground' />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search by name, address, pincode'
            className='h-8 pl-8 text-sm'
          />
        </div>

        <Badge variant='secondary' className='h-7 px-2 text-xs'>
          {filtered.length} Locations
        </Badge>
      </div>

      <div className='mt-4'>
        {isLoading ? (
          <div className='rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className='rounded-md border bg-card px-3 py-8 text-center'>
            <div className='text-base font-semibold'>No PG Locations</div>
            <div className='mt-1 text-xs text-muted-foreground'>Add your first PG location to get started.</div>
          </div>
        ) : (
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {filtered.map((l) => (
              <Card key={l.s_no} className='h-full'>
                <CardContent className='flex h-full flex-col gap-2 p-3'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='truncate text-sm font-semibold'>{l.location_name}</div>
                      <div className='mt-0.5 line-clamp-2 text-xs text-muted-foreground'>{l.address}</div>
                    </div>
                    <Badge variant='outline' className='shrink-0 px-2 text-xs'>
                      #{l.s_no}
                    </Badge>
                  </div>

                  {l.pincode ? (
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <MapPin className='size-4' />
                      <span>{l.pincode}</span>
                    </div>
                  ) : null}

                  <div className='mt-auto pt-1'>
                    <ActionButtons
                      mode='icon'
                      viewTo={`/pg-locations/${l.s_no}`}
                      onEdit={() => openEdit(l)}
                      onDelete={() => askDelete(l)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
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
              <span className='font-semibold'>{deleteTarget?.location_name}</span>? This action cannot be undone.
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
