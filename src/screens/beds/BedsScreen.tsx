import { useMemo, useState } from 'react'
import { CircleAlert, Filter, Plus, Search } from 'lucide-react'

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
import { AppDialog } from '@/components/form/app-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { BedFormDialog } from './BedFormDialog'
import { useAppSelector } from '@/store/hooks'
import {
  type Bed,
  type Room,
  useDeleteBedMutation,
  useGetAllBedsQuery,
  useGetAllRoomsQuery,
} from '@/services/roomsApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

type OccupancyFilter = 'all' | 'occupied' | 'available'

export function BedsScreen() {
  const selectedPGLocationId = useAppSelector((s) => (s as any).pgLocations?.selectedPGLocationId) as number | null

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [occupancyFilter, setOccupancyFilter] = useState<OccupancyFilter>('all')

  const [draftRoomId, setDraftRoomId] = useState<number | null>(null)
  const [draftOccupancy, setDraftOccupancy] = useState<OccupancyFilter>('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Bed | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Bed | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { data: roomsResponse } = useGetAllRoomsQuery(
    selectedPGLocationId ? { pg_id: selectedPGLocationId, limit: 200 } : (undefined as any),
    { skip: !selectedPGLocationId }
  )

  const rooms: Room[] = Array.isArray((roomsResponse as any)?.data) ? (((roomsResponse as any).data ?? []) as Room[]) : []

  const roomOptions = useMemo(
    () =>
      [{ label: 'All Rooms', value: '' }, ...rooms.map((r) => ({ label: String(r.room_no), value: String(r.s_no) }))],
    [rooms]
  )

  const onlyUnoccupied = occupancyFilter === 'available' ? true : undefined

  const {
    data: bedsResponse,
    isLoading,
    error,
    refetch,
  } = useGetAllBedsQuery(
    selectedPGLocationId
      ? {
          page,
          limit,
          pg_id: selectedPGLocationId,
          room_id: selectedRoomId ?? undefined,
          search: query.trim() ? query.trim() : undefined,
          only_unoccupied: onlyUnoccupied,
        }
      : (undefined as any),
    { skip: !selectedPGLocationId }
  )

  const [deleteBed, { isLoading: deleting }] = useDeleteBedMutation()

  const allBeds: Bed[] = Array.isArray((bedsResponse as any)?.data) ? (((bedsResponse as any).data ?? []) as Bed[]) : []

  const beds = useMemo(() => {
    if (occupancyFilter !== 'occupied') return allBeds
    return allBeds.filter((b) => Boolean((b as any).is_occupied))
  }, [allBeds, occupancyFilter])

  const pagination = (bedsResponse as any)?.pagination as
    | {
        total?: number
        page?: number
        limit?: number
        totalPages?: number
        hasMore?: boolean
      }
    | undefined

  const total = Number(pagination?.total ?? beds.length)
  const totalPages = Number(pagination?.totalPages ?? (pagination?.hasMore ? page + 1 : 1))

  const fetchErrorMessage = (error as any)?.data?.message || (error as any)?.message

  const filterCount = Number(selectedRoomId ? 1 : 0) + Number(occupancyFilter !== 'all')

  const openCreate = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  const openEdit = (b: Bed) => {
    setEditTarget(b)
    setDialogOpen(true)
  }

  const askDelete = (b: Bed) => {
    setDeleteTarget(b)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteBed(deleteTarget.s_no).unwrap()
      showSuccessAlert('Bed deleted successfully')
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      void refetch()
    } catch (e: any) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const canPrev = page > 1
  const canNext = Boolean(pagination?.hasMore) || (Number.isFinite(totalPages) && page < totalPages)

  const occupancyLabel = occupancyFilter === 'all' ? 'All' : occupancyFilter === 'occupied' ? 'Occupied' : 'Available'

  const activeRoomLabel = useMemo(() => {
    if (!selectedRoomId) return 'All Rooms'
    const room = rooms.find((r) => Number(r.s_no) === Number(selectedRoomId))
    return room?.room_no ? String(room.room_no) : `Room #${selectedRoomId}`
  }, [rooms, selectedRoomId])

  return (
    <div className='container mx-auto max-w-6xl px-3 py-6'>
      <PageHeader
        title='Beds'
        subtitle='Manage beds in your PG'
        right={
          <>
            <Button type='button' size='icon' onClick={openCreate} aria-label='Add bed' title='Add bed' disabled={!selectedPGLocationId}>
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
            <AlertTitle>Failed to load beds</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>Select a PG Location</div>
          <div className='mt-1 text-xs text-muted-foreground'>Choose a PG from the top bar to manage beds.</div>
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
                placeholder='Search by bed number'
                className='h-8 pl-8 text-sm'
              />
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='secondary' className='h-7 px-2 text-xs'>
                {Number.isFinite(total) && total > 0 ? `${total} Beds` : `${beds.length} Beds`}
              </Badge>

              <Button
                variant={filterCount > 0 ? 'default' : 'outline'}
                size='sm'
                onClick={() => {
                  setDraftRoomId(selectedRoomId)
                  setDraftOccupancy(occupancyFilter)
                  setFiltersOpen(true)
                }}
              >
                <Filter className='me-2 size-4' />
                Filters
                {filterCount > 0 ? <span className='ms-2 text-xs font-semibold'>({filterCount})</span> : null}
              </Button>

              <Badge variant='outline' className='h-7 px-2 text-xs'>
                {activeRoomLabel} • {occupancyLabel}
              </Badge>
            </div>
          </div>

          <div className='mt-4'>
            {isLoading ? (
              <div className='rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>Loading...</div>
            ) : beds.length === 0 ? (
              <div className='rounded-md border bg-card px-3 py-8 text-center'>
                <div className='text-base font-semibold'>No Beds</div>
                <div className='mt-1 text-xs text-muted-foreground'>Add your first bed to get started.</div>
                <div className='mt-4'>
                  <Button onClick={openCreate}>Add Bed</Button>
                </div>
              </div>
            ) : (
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {beds.map((b) => (
                  <Card key={b.s_no} className='h-full'>
                    <CardContent className='flex h-full flex-col gap-2 p-3'>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <div className='truncate text-sm font-semibold'>{b.bed_no}</div>
                          <div className='mt-0.5 line-clamp-2 text-xs text-muted-foreground'>
                            Room: {b.rooms?.room_no ?? `#${b.room_id}`}
                          </div>
                        </div>
                        <div className='flex flex-col items-end gap-1'>
                          <Badge variant='outline' className='shrink-0 px-2 text-xs'>
                            #{b.s_no}
                          </Badge>
                          <Badge variant={(b as any).is_occupied ? 'destructive' : 'secondary'} className='h-6 px-2 text-[10px]'>
                            {(b as any).is_occupied ? 'OCCUPIED' : 'AVAILABLE'}
                          </Badge>
                        </div>
                      </div>

                      <div className='flex items-center justify-between gap-2'>
                        <div className='text-xs text-muted-foreground'>Price</div>
                        <div className='text-sm font-semibold text-primary'>
                          {b.bed_price != null && String(b.bed_price).length > 0 ? `₹${String(b.bed_price)}` : 'Unassigned'}
                        </div>
                      </div>

                      {(b as any).tenants?.[0]?.name ? (
                        <div className='text-xs text-muted-foreground'>
                          Tenant: {(b as any).tenants[0].name}
                          {(b as any).tenants[0].phone_no ? ` • ${(b as any).tenants[0].phone_no}` : ''}
                        </div>
                      ) : null}

                      <div className='mt-auto pt-1'>
                        <ActionButtons mode='icon' onEdit={() => openEdit(b)} onDelete={() => askDelete(b)} />
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

          <BedFormDialog
            open={dialogOpen}
            onOpenChange={(open: boolean) => {
              setDialogOpen(open)
              if (!open) setEditTarget(null)
            }}
            editTarget={editTarget}
            rooms={rooms}
            defaultRoomId={selectedRoomId ?? undefined}
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
                <AlertDialogTitle>Delete Bed</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <span className='font-semibold'>{deleteTarget?.bed_no}</span>? This action cannot
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

          <AppDialog
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            title='Filters'
            description='Filter beds by room and occupancy.'
            size='sm'
            footer={
              <div className='flex w-full justify-end gap-2 px-3 pb-3'>
                {filterCount > 0 ? (
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      setSelectedRoomId(null)
                      setOccupancyFilter('all')
                      setFiltersOpen(false)
                      setPage(1)
                      void refetch()
                    }}
                  >
                    Clear
                  </Button>
                ) : null}

                <Button
                  type='button'
                  onClick={() => {
                    setSelectedRoomId(draftRoomId)
                    setOccupancyFilter(draftOccupancy)
                    setFiltersOpen(false)
                    setPage(1)
                    void refetch()
                  }}
                >
                  Apply
                </Button>
              </div>
            }
          >
            <div className='grid gap-4'>
              <div className='grid gap-2'>
                <div className='text-sm font-medium'>Room</div>
                <Select
                  value={draftRoomId ? String(draftRoomId) : ''}
                  onValueChange={(v) => {
                    const id = v ? Number(v) : null
                    setDraftRoomId(Number.isFinite(id as any) && (id as any) > 0 ? (id as number) : null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='All Rooms' />
                  </SelectTrigger>
                  <SelectContent>
                    {roomOptions.map((o) => (
                      <SelectItem key={String(o.value)} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <div className='text-sm font-medium'>Occupancy</div>
                <div className='flex flex-wrap gap-2'>
                  <Button
                    type='button'
                    variant={draftOccupancy === 'all' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setDraftOccupancy('all')}
                  >
                    All
                  </Button>
                  <Button
                    type='button'
                    variant={draftOccupancy === 'available' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setDraftOccupancy('available')}
                  >
                    Available
                  </Button>
                  <Button
                    type='button'
                    variant={draftOccupancy === 'occupied' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setDraftOccupancy('occupied')}
                  >
                    Occupied
                  </Button>
                </div>
              </div>
            </div>
          </AppDialog>
        </>
      )}
    </div>
  )
}
