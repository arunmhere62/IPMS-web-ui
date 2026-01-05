import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, CircleAlert, Search } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/page-header'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useGetPGLocationDetailsQuery } from '@/services/pgLocationsApi'

type PGDetails = any

const unwrapDetails = (response: any): PGDetails | null => {
  if (!response) return null
  const root = (response as any)?.data ?? response
  const nested = (root as any)?.data ?? root
  return nested as any
}

const formatCurrency = (value: unknown) => {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return '-'
  return `₹${n.toLocaleString('en-IN')}`
}

export function PGDetailsScreen() {
  const params = useParams()
  const pgId = Number(params.id)

  const [tab, setTab] = useState<'summary' | 'detailed'>('summary')
  const [search, setSearch] = useState('')

  const {
    data: pgDetailsResponse,
    isLoading,
    error,
    refetch,
  } = useGetPGLocationDetailsQuery(Number.isFinite(pgId) ? pgId : (0 as any), {
    skip: !Number.isFinite(pgId) || pgId <= 0,
  } as any)

  const details = unwrapDetails(pgDetailsResponse)

  const fetchErrorMessage = (error as any)?.data?.message || (error as any)?.message

  const filteredRooms = useMemo(() => {
    const rooms = (details as any)?.room_details || []
    const q = search.trim().toLowerCase()
    if (!q) return rooms
    return rooms.filter((r: any) => {
      const roomNo = String(r?.room_no || '').toLowerCase()
      if (roomNo.includes(q)) return true
      const beds = Array.isArray(r?.beds) ? r.beds : []
      return beds.some((b: any) => String(b?.bed_no || '').toLowerCase().includes(q))
    })
  }, [details, search])

  const roomStats = (details as any)?.room_statistics
  const tenantStats = (details as any)?.tenant_statistics
  const images: string[] = Array.isArray((details as any)?.images) ? ((details as any).images as any) : []
  const imageSlots: (string | null)[] = images.length ? images : [null]
  const locationMeta = {
    city: (details as any)?.city?.name || '',
    state: (details as any)?.state?.name || '',
    pgType: (details as any)?.pg_type || '',
    status: (details as any)?.status || '',
    rentCycleType: (details as any)?.rent_cycle_type || '',
    rentCycleStart: (details as any)?.rent_cycle_start,
    rentCycleEnd: (details as any)?.rent_cycle_end,
    pincode: (details as any)?.pincode || '',
  }

  return (
    <div className='container mx-auto max-w-6xl px-3 py-6'>
      <PageHeader
        title={(details as any)?.location_name || 'PG Details'}
        subtitle={(details as any)?.address || ''}
        right={
          <>
            <Button asChild variant='outline' size='sm'>
              <Link to='/pg-locations'>
                <ChevronLeft className='me-1 size-4' />
                Back
              </Link>
            </Button>
            <Badge variant='outline'>#{Number.isFinite(pgId) ? pgId : '-'}</Badge>
            <Button variant='outline' size='sm' onClick={() => refetch()}>
              Refresh
            </Button>
          </>
        }
      />

      {fetchErrorMessage ? (
        <div className='mt-4'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load PG details</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {isLoading ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>Loading...</div>
      ) : !details ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>No details found</div>
          <div className='mt-1 text-xs text-muted-foreground'>Please check the PG id and try again.</div>
        </div>
      ) : (
        <div className='mt-4 grid gap-4'>
          <Card className='overflow-hidden'>
            <CardContent className='p-0'>
              <div className='grid gap-0 md:grid-cols-[420px_1fr]'>
                <div className='border-b bg-muted/30 p-3 md:border-b-0 md:border-e'>
                  <div className='aspect-video overflow-hidden rounded-lg border bg-muted'>
                    {imageSlots[0] ? (
                      <img src={imageSlots[0]} alt='PG location' className='h-full w-full object-cover' />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center text-sm text-muted-foreground'>
                        No image
                      </div>
                    )}
                  </div>

                  <div className='mt-2 grid grid-cols-4 gap-2'>
                    {imageSlots.slice(0, 4).map((src, idx) => (
                      <div key={idx} className='aspect-video overflow-hidden rounded-md border bg-muted'>
                        {src ? <img src={src} alt='PG' className='h-full w-full object-cover' /> : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className='p-3'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='outline' className='text-xs'>
                      #{Number.isFinite(pgId) ? pgId : '-'}
                    </Badge>
                    {locationMeta.status ? (
                      <Badge
                        variant={locationMeta.status === 'ACTIVE' ? 'secondary' : 'outline'}
                        className='text-xs'
                      >
                        {locationMeta.status}
                      </Badge>
                    ) : null}
                    {locationMeta.pgType ? (
                      <Badge variant='outline' className='text-xs'>
                        {locationMeta.pgType}
                      </Badge>
                    ) : null}
                  </div>

                  <div className='mt-3 grid gap-1'>
                    <div className='text-base font-semibold'>Overview</div>
                    <div className='text-xs text-muted-foreground'>Key details for this PG location</div>
                  </div>

                  <Separator className='my-3' />

                  <div className='grid gap-3 sm:grid-cols-2'>
                    <div className='grid gap-1'>
                      <div className='text-xs text-muted-foreground'>City</div>
                      <div className='text-sm font-medium'>{locationMeta.city || '-'}</div>
                    </div>
                    <div className='grid gap-1'>
                      <div className='text-xs text-muted-foreground'>State</div>
                      <div className='text-sm font-medium'>{locationMeta.state || '-'}</div>
                    </div>
                    <div className='grid gap-1'>
                      <div className='text-xs text-muted-foreground'>Pincode</div>
                      <div className='text-sm font-medium'>{locationMeta.pincode || '-'}</div>
                    </div>
                    <div className='grid gap-1'>
                      <div className='text-xs text-muted-foreground'>Rent Cycle</div>
                      <div className='text-sm font-medium'>
                        {locationMeta.rentCycleType || '-'}
                        {locationMeta.rentCycleType ? (
                          <span className='text-xs font-normal text-muted-foreground'>
                            {' '}
                            ({locationMeta.rentCycleStart ?? '-'}-{locationMeta.rentCycleEnd ?? '-'})
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardContent className='p-3'>
                <div className='text-xs text-muted-foreground'>Rooms</div>
                <div className='mt-1 text-lg font-semibold'>{roomStats?.total_rooms ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-3'>
                <div className='text-xs text-muted-foreground'>Beds</div>
                <div className='mt-1 text-lg font-semibold'>{roomStats?.total_beds ?? 0}</div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  {roomStats?.occupied_beds ?? 0} occupied • {roomStats?.available_beds ?? 0} free
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-3'>
                <div className='text-xs text-muted-foreground'>Tenants</div>
                <div className='mt-1 text-lg font-semibold'>{tenantStats?.total_tenants ?? 0}</div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  {tenantStats?.active_tenants ?? 0} active • {tenantStats?.inactive_tenants ?? 0} inactive
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-3'>
                <div className='text-xs text-muted-foreground'>Monthly Revenue</div>
                <div className='mt-1 text-lg font-semibold'>{formatCurrency(roomStats?.total_monthly_revenue)}</div>
                <div className='mt-0.5 text-xs text-muted-foreground'>
                  Occupancy{' '}
                  {typeof tenantStats?.occupancy_rate === 'number' ? `${tenantStats.occupancy_rate.toFixed(0)}%` : '-'}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <TabsList>
                <TabsTrigger value='summary'>Summary</TabsTrigger>
                <TabsTrigger value='detailed'>Detailed</TabsTrigger>
              </TabsList>

              <div className='relative w-full sm:max-w-xs'>
                <Search className='pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground' />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Search room/bed'
                  className='h-8 pl-8 text-sm'
                />
              </div>
            </div>

            <TabsContent value='summary' className='mt-3'>
              <div className='grid gap-2'>
                {filteredRooms.length === 0 ? (
                  <div className='rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>No rooms found.</div>
                ) : (
                  filteredRooms.map((room: any) => (
                    <Card key={room.s_no}>
                      <CardContent className='p-3'>
                        <div className='flex items-start justify-between gap-3'>
                          <div>
                            <div className='text-sm font-semibold'>{room.room_no}</div>
                            <div className='mt-1 text-xs text-muted-foreground'>
                              {room.occupied_beds}/{room.total_beds} beds occupied • {Number(room.occupancy_rate ?? 0).toFixed(0)}%
                            </div>
                          </div>
                          <Badge variant={room.available_beds > 0 ? 'secondary' : 'destructive'}>
                            {room.available_beds} free
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value='detailed' className='mt-3'>
              <div className='grid gap-2'>
                {filteredRooms.length === 0 ? (
                  <div className='rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>No rooms found.</div>
                ) : (
                  filteredRooms.map((room: any) => (
                    <Collapsible key={room.s_no}>
                      <Card>
                        <CardContent className='p-3'>
                          <div className='flex items-start justify-between gap-3'>
                            <div>
                              <div className='text-sm font-semibold'>{room.room_no}</div>
                              <div className='mt-1 text-xs text-muted-foreground'>
                                {room.occupied_beds}/{room.total_beds} beds occupied • {Number(room.occupancy_rate ?? 0).toFixed(0)}%
                              </div>
                            </div>

                            <CollapsibleTrigger asChild>
                              <Button variant='outline' size='sm'>View Beds</Button>
                            </CollapsibleTrigger>
                          </div>

                          <CollapsibleContent className='mt-3'>
                            <div className='grid gap-2'>
                              {(Array.isArray(room?.beds) ? room.beds : []).map((bed: any) => (
                                <div key={bed.s_no} className='rounded-md border p-2'>
                                  <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
                                    <div className='text-sm font-semibold'>{bed.bed_no}</div>
                                    <div className='text-sm font-semibold text-primary'>₹{bed.price}</div>
                                  </div>
                                  <div className='mt-1 text-xs text-muted-foreground'>
                                    {bed.is_occupied ? 'Occupied' : 'Available'}
                                    {bed.tenant?.name ? ` • ${bed.tenant.name}` : ''}
                                    {bed.tenant?.phone_no ? ` • ${bed.tenant.phone_no}` : ''}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </CardContent>
                      </Card>
                    </Collapsible>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
