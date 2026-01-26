import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleAlert, Plus, Search, Users } from 'lucide-react'

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
import { ActionButtons } from '@/components/form/action-buttons'
import { PageHeader } from '@/components/form/page-header'

import { useAppSelector } from '@/store/hooks'
import { useDeleteVisitorMutation, useGetVisitorsQuery, type Visitor } from '@/services/visitorsApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

type ErrorLike = {
  data?: {
    message?: string
  }
  message?: string
}

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

const toDateOnly = (value?: string) => {
  const s = String(value ?? '')
  if (!s) return ''
  return s.includes('T') ? s.split('T')[0] : s
}

export function VisitorsScreen() {
  const navigate = useNavigate()
  const selectedPGLocationId = useAppSelector((s) => s.pgLocations.selectedPGLocationId)

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const {
    data: visitorsResponse,
    isLoading,
    error,
    refetch,
  } = useGetVisitorsQuery(
    selectedPGLocationId
      ? {
          page,
          limit,
          search: query.trim() ? query.trim() : undefined,
        }
      : undefined,
    { skip: !selectedPGLocationId }
  )

  const [deleteVisitor, { isLoading: deleting }] = useDeleteVisitorMutation()

  const visitors: Visitor[] = useMemo(() => asArray<Visitor>((visitorsResponse as { data?: unknown } | undefined)?.data), [visitorsResponse])

  const pagination = (visitorsResponse as { pagination?: unknown } | undefined)?.pagination as
    | {
        total?: number
        page?: number
        limit?: number
        totalPages?: number
        hasMore?: boolean
      }
    | undefined

  const total = Number(pagination?.total ?? visitors.length)
  const totalPages = Number(pagination?.totalPages ?? (pagination?.hasMore ? page + 1 : 1))

  const fetchErrorMessage = (error as ErrorLike | undefined)?.data?.message || (error as ErrorLike | undefined)?.message

  const [deleteTarget, setDeleteTarget] = useState<Visitor | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const askDelete = (v: Visitor) => {
    setDeleteTarget(v)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteVisitor(deleteTarget.s_no).unwrap()
      showSuccessAlert('Visitor deleted successfully')
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const canPrev = page > 1
  const canNext = Boolean(pagination?.hasMore) || (Number.isFinite(totalPages) && page < totalPages)

  const countLabel = useMemo(() => {
    if (!selectedPGLocationId) return 'Select PG'
    if (Number.isFinite(total) && total > 0) return `${total} Visitors`
    return `${visitors.length} Visitors`
  }, [selectedPGLocationId, total, visitors.length])

  return (
    <div className='container mx-auto max-w-6xl px-3 py-6'>
      <PageHeader
        title='Visitors'
        subtitle='Manage visitors'
        right={
          <>
            <Button asChild type='button' size='icon' aria-label='Add visitor' title='Add visitor' disabled={!selectedPGLocationId}>
              <Link to='/visitors/new'>
                <Plus className='size-4' />
              </Link>
            </Button>
            <Button variant='outline' size='sm' onClick={() => refetch()} disabled={!selectedPGLocationId}>
              Refresh
            </Button>
          </>
        }
      />

      {fetchErrorMessage ? (
        <div className='mt-6'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load visitors</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>Select a PG Location</div>
          <div className='mt-1 text-xs text-muted-foreground'>Choose a PG from the top bar to manage visitors.</div>
        </div>
      ) : (
        <>
          <div className='mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <div className='relative w-full sm:max-w-xs'>
              <Search className='pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground' />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder='Search by name, phone'
                className='h-8 pl-8 text-sm'
              />
            </div>

            <Badge variant='secondary' className='h-7 px-2 text-xs'>
              {countLabel}
            </Badge>
          </div>

          <div className='mt-4'>
            {isLoading ? (
              <div className='rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>Loading...</div>
            ) : visitors.length === 0 ? (
              <div className='rounded-md border bg-card px-3 py-8 text-center'>
                <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-muted'>
                  <Users className='size-6 text-muted-foreground' />
                </div>
                <div className='mt-3 text-base font-semibold'>No Visitors</div>
                <div className='mt-1 text-xs text-muted-foreground'>Add your first visitor to get started.</div>
                <div className='mt-4'>
                  <Button asChild>
                    <Link to='/visitors/new'>Add Visitor</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {visitors.map((v) => (
                  <Card key={String(v.s_no)} className='h-full'>
                    <CardContent className='flex h-full flex-col gap-3 p-4'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0'>
                          <div className='truncate text-base font-bold'>{v.visitor_name || 'Visitor'}</div>
                          <div className='mt-1 text-xs text-muted-foreground'>{v.phone_no ? v.phone_no : 'Phone —'}</div>
                          <div className='mt-1 text-xs text-muted-foreground'>
                            {v.purpose ? v.purpose : 'Purpose —'}
                            {v.visited_date ? ` • ${toDateOnly(v.visited_date)}` : ''}
                          </div>
                        </div>
                        <Badge variant={v.convertedTo_tenant ? 'default' : 'outline'} className='shrink-0'>
                          {v.convertedTo_tenant ? 'Converted' : 'Not Converted'}
                        </Badge>
                      </div>

                      {(v.rooms?.room_no || v.beds?.bed_no) ? (
                        <div className='text-xs text-muted-foreground'>
                          {v.rooms?.room_no ? `Room ${v.rooms.room_no}` : ''}
                          {v.rooms?.room_no && v.beds?.bed_no ? ' • ' : ''}
                          {v.beds?.bed_no ? `Bed ${v.beds.bed_no}` : ''}
                        </div>
                      ) : null}

                      {v.remarks ? <div className='text-xs text-muted-foreground line-clamp-2'>{v.remarks}</div> : null}

                      <div className='mt-auto flex items-center justify-between'>
                        <Button type='button' variant='outline' size='sm' onClick={() => navigate(`/visitors/${v.s_no}`)}>
                          View
                        </Button>
                        <ActionButtons
                          mode='icon'
                          viewTo={undefined}
                          onEdit={() => navigate(`/visitors/${v.s_no}/edit`)}
                          onDelete={() => askDelete(v)}
                          disabled={deleting}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className='mt-5 flex items-center justify-between gap-2'>
              <Button variant='outline' size='sm' disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </Button>
              <div className='text-xs text-muted-foreground'>
                Page {page}
                {Number.isFinite(totalPages) && totalPages > 0 ? ` / ${totalPages}` : ''}
              </div>
              <Button variant='outline' size='sm' disabled={!canNext} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visitor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className='font-semibold'>{deleteTarget?.visitor_name}</span>? This action cannot be undone.
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
