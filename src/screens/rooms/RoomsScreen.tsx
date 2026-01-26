import { useMemo, useState } from 'react'
import { CircleAlert, DoorOpen, Plus, Search } from 'lucide-react'

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

import { RoomFormDialog } from './RoomFormDialog'
import { useAppSelector } from '@/store/hooks'
import type { Room } from '@/services/roomsApi'
import { useDeleteRoomMutation, useGetAllRoomsQuery } from '@/services/roomsApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

export function RoomsScreen() {
  const selectedPGLocationId = useAppSelector((s) => (s as any).pgLocations?.selectedPGLocationId) as number | null

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Room | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const {
    data: roomsResponse,
    isLoading,
    error,
    refetch,
  } = useGetAllRoomsQuery(
    selectedPGLocationId
      ? {
          page,
          limit,
          pg_id: selectedPGLocationId,
          search: query.trim() ? query.trim() : undefined,
        }
      : (undefined as any),
    { skip: !selectedPGLocationId }
  )

  const [deleteRoom, { isLoading: deleting }] = useDeleteRoomMutation()

  const rooms: Room[] = Array.isArray((roomsResponse as any)?.data) ? (((roomsResponse as any).data ?? []) as Room[]) : []

  const pagination = (roomsResponse as any)?.pagination as
    | {
        total?: number
        page?: number
        limit?: number
        totalPages?: number
        hasMore?: boolean
      }
    | undefined

  const total = Number(pagination?.total ?? rooms.length)
  const totalPages = Number(pagination?.totalPages ?? (pagination?.hasMore ? page + 1 : 1))

  const fetchErrorMessage = (error as any)?.data?.message || (error as any)?.message

  const openCreate = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  const openEdit = (r: Room) => {
    setEditTarget(r)
    setDialogOpen(true)
  }

  const askDelete = (r: Room) => {
    setDeleteTarget(r)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteRoom(deleteTarget.s_no).unwrap()
      showSuccessAlert('Room deleted successfully')
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      void refetch()
    } catch (e: any) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const canPrev = page > 1
  const canNext = Boolean(pagination?.hasMore) || (Number.isFinite(totalPages) && page < totalPages)

  const countLabel = useMemo(() => {
    if (!selectedPGLocationId) return 'Select PG'
    if (Number.isFinite(total) && total > 0) return `${total} Rooms`
    return `${rooms.length} Rooms`
  }, [rooms.length, selectedPGLocationId, total])

  return (
    <div className='container mx-auto max-w-6xl px-3 py-6'>
      <PageHeader
        title='Rooms'
        subtitle='Manage rooms in your PG'
        right={
          <>
            <Button type='button' size='icon' onClick={openCreate} aria-label='Add room' title='Add room' disabled={!selectedPGLocationId}>
              <Plus className='size-4' />
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
            <AlertTitle>Failed to load rooms</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>Select a PG Location</div>
          <div className='mt-1 text-xs text-muted-foreground'>Choose a PG from the top bar to manage rooms.</div>
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
                placeholder='Search by room number'
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
            ) : rooms.length === 0 ? (
              <div className='rounded-md border bg-card px-3 py-8 text-center'>
                <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-muted'>
                  <DoorOpen className='size-6 text-muted-foreground' />
                </div>
                <div className='mt-3 text-base font-semibold'>No Rooms</div>
                <div className='mt-1 text-xs text-muted-foreground'>Add your first room to get started.</div>
                <div className='mt-4'>
                  <Button onClick={openCreate}>Add Room</Button>
                </div>
              </div>
            ) : (
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {rooms.map((r) => (
                  <Card key={r.s_no} className='h-full'>
                    <CardContent className='flex h-full flex-col gap-2 p-3'>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <div className='truncate text-sm font-semibold'>{r.room_no}</div>
                          <div className='mt-0.5 text-xs text-muted-foreground'>PG: #{r.pg_id}</div>
                        </div>
                        <div className='flex flex-col items-end gap-1'>
                          <Badge variant='outline' className='shrink-0 px-2 text-xs'>
                            #{r.s_no}
                          </Badge>
                          <Badge variant='secondary' className='h-6 px-2 text-[10px]'>
                            {Number((r as any).available_beds ?? 0)} FREE
                          </Badge>
                        </div>
                      </div>

                      <div className='grid grid-cols-3 gap-2 text-xs text-muted-foreground'>
                        <div>
                          <div className='font-semibold text-foreground'>{Number((r as any).total_beds ?? 0)}</div>
                          <div>Total</div>
                        </div>
                        <div>
                          <div className='font-semibold text-foreground'>{Number((r as any).occupied_beds ?? 0)}</div>
                          <div>Occupied</div>
                        </div>
                        <div>
                          <div className='font-semibold text-foreground'>{Number((r as any).available_beds ?? 0)}</div>
                          <div>Available</div>
                        </div>
                      </div>

                      <div className='mt-auto pt-1'>
                        <ActionButtons
                          mode='icon'
                          viewTo={`/rooms/${r.s_no}`}
                          onEdit={() => openEdit(r)}
                          onDelete={() => askDelete(r)}
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

          <RoomFormDialog
            open={dialogOpen}
            onOpenChange={(open: boolean) => {
              setDialogOpen(open)
              if (!open) setEditTarget(null)
            }}
            editTarget={editTarget}
            pgId={selectedPGLocationId}
            onSaved={() => {
              setDialogOpen(false)
              setEditTarget(null)
              void refetch()
            }}
          />

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Room</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <span className='font-semibold'>{deleteTarget?.room_no}</span>? This action cannot
                  be undone.
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
        </>
      )}
    </div>
  )
}
