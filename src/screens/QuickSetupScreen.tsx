import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { useCreateRoomMutation, useBulkCreateBedMutation, useGetAllRoomsQuery } from '@/services/roomsApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/form/page-header'
import { Building2, Plus, Trash2, IndianRupee, Loader2 } from 'lucide-react'

interface RoomSetupRow {
  id: number
  roomNo: string
  beds: string
  price: string
}

// Production constants
const MAX_ROOMS = 50
const MAX_BEDS_PER_ROOM = 50
const MIN_PRICE = 1
const MAX_PRICE = 10_00_000 // ₹10,00,000 per bed
const MAX_PRICE_DECIMALS = 2
const ROOM_NUMBER_START = 101

const generateBedNo = (roomIndex: number, bedIndex: number): string => {
  return `BED${roomIndex * 100 + bedIndex + 1}`
}

const formatPrice = (value: number): string => {
  return `₹${value.toLocaleString('en-IN')}`
}

const extractSno = (response: any): number | undefined => {
  const raw = response?.data?.s_no ?? response?.s_no ?? response?.data?.data?.s_no
  const id = Number(raw)
  return Number.isFinite(id) && id > 0 ? id : undefined
}

export function QuickSetupScreen() {
  const navigate = useNavigate()
  const selectedPGLocationId = useAppSelector((s) => s.pgLocations?.selectedPGLocationId)

  const { data: existingRoomsResponse, isFetching: isFetchingExistingRooms } = useGetAllRoomsQuery(
    undefined,
    { skip: !selectedPGLocationId }
  )

  const [createRoom] = useCreateRoomMutation()
  const [bulkCreateBeds] = useBulkCreateBedMutation()

  const [numRooms, setNumRooms] = useState('')
  const [defaultPrice, setDefaultPrice] = useState('')
  const [rooms, setRooms] = useState<RoomSetupRow[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [completedRooms, setCompletedRooms] = useState<string[]>([])
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const safeSetState = useCallback(<T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: React.SetStateAction<T>) => {
    if (isMounted.current) {
      setter(value)
    }
  }, [])

  const existingRoomNos = useMemo(() => {
    const raw = existingRoomsResponse as any
    const rooms = Array.isArray(raw) ? raw : (raw?.data ?? [])
    const set = new Set<string>()
    rooms.forEach((r: any) => {
      const no = r?.room_no
      if (typeof no === 'string' && no.trim()) {
        const normalized = no.trim().toUpperCase()
        // Support both "RM101" and "101" formats from backend
        if (/^\d+$/.test(normalized)) {
          set.add(`RM${normalized}`)
        } else {
          set.add(normalized)
        }
      }
    })
    return set
  }, [existingRoomsResponse])

  const getNextAvailableRoomNos = useCallback(
    (count: number, currentRooms: RoomSetupRow[]): string[] => {
      const taken = new Set(existingRoomNos)
      currentRooms.forEach((r) => {
        if (r.roomNo.trim()) {
          taken.add(`RM${r.roomNo.trim()}`)
        }
      })
      const numbers: string[] = []
      let candidate = ROOM_NUMBER_START
      while (numbers.length < count) {
        const fullNo = `RM${candidate}`
        if (!taken.has(fullNo)) {
          numbers.push(String(candidate))
          taken.add(fullNo)
        }
        candidate++
      }
      return numbers
    },
    [existingRoomNos]
  )

  const handleNumRoomsChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '')
    const count = parseInt(digits, 10)
    const validCount = !Number.isNaN(count) && count > 0 && count <= MAX_ROOMS ? count : 0

    setNumRooms(digits)
    setRooms((prev) => {
      if (validCount === 0) return []
      // Keep existing rooms, add or remove only what changed
      const next: RoomSetupRow[] = prev.slice(0, validCount)
      const toAdd = validCount - next.length
      if (toAdd > 0) {
        const baseId = prev.length > 0 ? Math.max(...prev.map((r) => r.id)) + 1 : 0
        const newNumbers = getNextAvailableRoomNos(toAdd, next)
        for (let i = 0; i < toAdd; i++) {
          next.push({
            id: baseId + i,
            roomNo: newNumbers[i],
            beds: '2',
            price: defaultPrice || '',
          })
        }
      }
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next.numRooms
      return next
    })
  }

  const cleanPrice = (raw: string): string => {
    // Remove any non-numeric characters except decimal point
    const numeric = raw.replace(/[^0-9.]/g, '')
    // Remove multiple decimal points, keep only the first one
    const parts = numeric.split('.')
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numeric
    if (!sanitized) return sanitized
    const [intPart, ...rest] = sanitized.split('.')
    const cleanedInt = intPart.replace(/^0+/, '') || '0'
    const decimal = rest.join('').substring(0, MAX_PRICE_DECIMALS)
    const value = decimal.length ? `${cleanedInt}.${decimal}` : cleanedInt
    // Clamp to maximum price while typing
    if (parseFloat(value) > MAX_PRICE) {
      return String(MAX_PRICE)
    }
    return value
  }

  const handleDefaultPriceChange = (value: string) => {
    const sanitized = cleanPrice(value)
    setDefaultPrice(sanitized)
    // Update all rooms to match the new default price (including clearing it)
    setRooms((prevRooms) =>
      prevRooms.map((r) => {
        return { ...r, price: sanitized }
      })
    )
    setErrors((prev) => {
      const next = { ...prev }
      delete next.defaultPrice
      return next
    })
  }

  const updateRoom = (id: number, field: keyof RoomSetupRow, value: string) => {
    let newRoomNo = ''
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        if (field === 'beds') {
          return { ...r, beds: value.replace(/[^0-9]/g, '') }
        }
        if (field === 'price') {
          return { ...r, price: cleanPrice(value) }
        }
        if (field === 'roomNo') {
          const numeric = value.replace(/[^0-9]/g, '').substring(0, 6)
          newRoomNo = numeric.replace(/^0+/, '')
          return { ...r, roomNo: newRoomNo }
        }
        return r
      })
    )
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`room_${id}_${field}`]
      if (field === 'roomNo' && newRoomNo) {
        const fullRoomNo = `RM${newRoomNo}`
        if (existingRoomNos.has(fullRoomNo)) {
          next[`room_${id}_roomNo`] = 'Room already exists'
        }
      }
      return next
    })
  }

  const addRoom = () => {
    setRooms((prev) => {
      const nextId = prev.length > 0 ? Math.max(...prev.map((r) => r.id)) + 1 : 0
      const newNumbers = getNextAvailableRoomNos(1, prev)
      return [
        ...prev,
        {
          id: nextId,
          roomNo: newNumbers[0],
          beds: '2',
          price: defaultPrice || '',
        },
      ]
    })
    setNumRooms((prev) => String(parseInt(prev || '0', 10) + 1))
  }

  const removeRoom = (id: number) => {
    setRooms((prev) => prev.filter((r) => r.id !== id))
    setNumRooms((prev) => String(Math.max(0, parseInt(prev || '0', 10) - 1)))
  }

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    const count = parseInt(numRooms, 10)
    if (!numRooms || Number.isNaN(count) || count <= 0) {
      nextErrors.numRooms = `Enter number of rooms (1-${MAX_ROOMS})`
    } else if (count > MAX_ROOMS) {
      nextErrors.numRooms = `Maximum ${MAX_ROOMS} rooms at a time`
    }

    const price = parseFloat(defaultPrice)
    if (!defaultPrice || Number.isNaN(price) || price < MIN_PRICE) {
      nextErrors.defaultPrice = `Enter a valid bed price (min ₹${MIN_PRICE})`
    } else if (price > MAX_PRICE) {
      nextErrors.defaultPrice = `Price cannot exceed ${formatPrice(MAX_PRICE)}`
    }

    const seenRoomNos = new Set<string>()
    rooms.forEach((r) => {
      if (!r.roomNo.trim()) {
        nextErrors[`room_${r.id}_roomNo`] = 'Room number required'
      } else {
        const fullRoomNo = `RM${r.roomNo.trim()}`
        if (seenRoomNos.has(fullRoomNo)) {
          nextErrors[`room_${r.id}_roomNo`] = 'Duplicate room number'
        } else if (existingRoomNos.has(fullRoomNo)) {
          nextErrors[`room_${r.id}_roomNo`] = 'Room already exists'
        }
        seenRoomNos.add(fullRoomNo)
      }
      const beds = parseInt(r.beds, 10)
      if (!r.beds || Number.isNaN(beds) || beds <= 0) {
        nextErrors[`room_${r.id}_beds`] = 'Enter beds count'
      } else if (beds > MAX_BEDS_PER_ROOM) {
        nextErrors[`room_${r.id}_beds`] = `Max ${MAX_BEDS_PER_ROOM} beds`
      }
      const p = parseFloat(r.price)
      if (!r.price || Number.isNaN(p) || p < MIN_PRICE) {
        nextErrors[`room_${r.id}_price`] = `Enter price (min ₹${MIN_PRICE})`
      } else if (p > MAX_PRICE) {
        nextErrors[`room_${r.id}_price`] = `Max ${formatPrice(MAX_PRICE)}`
      }
    })

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      showErrorAlert('Validation Error', 'Please fix the highlighted fields')
      return
    }
    if (!selectedPGLocationId) {
      showErrorAlert('PG Location missing', 'Please create a PG location first.')
      return
    }
    if (isFetchingExistingRooms) {
      showErrorAlert('Loading', 'Please wait while we check existing rooms.')
      return
    }

    safeSetState<boolean>(setIsSubmitting, true)
    safeSetState(setProgress, { current: 0, total: rooms.length })
    safeSetState<string[]>(setCompletedRooms, [])

    try {
      for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i]
        const roomRes = await createRoom({
          pg_id: selectedPGLocationId,
          room_no: `RM${room.roomNo.trim()}`,
          images: [],
        }).unwrap()

        const roomId = extractSno(roomRes)

        if (!roomId) {
          throw new Error(`Room ${room.roomNo} was not created`)
        }

        const bedCount = parseInt(room.beds, 10)
        const bedPrice = parseFloat(room.price)
        const beds = Array.from({ length: bedCount }, (_, bedIndex) => ({
          bed_no: generateBedNo(i, bedIndex),
          bed_price: bedPrice,
          images: [],
        }))

        await bulkCreateBeds({
          room_id: roomId,
          pg_id: selectedPGLocationId,
          beds,
        }).unwrap()

        safeSetState(setProgress, { current: i + 1, total: rooms.length })
        safeSetState(setCompletedRooms, (prev) => [...prev, `RM${room.roomNo.trim()}`])
      }

      showSuccessAlert('Rooms and beds created successfully')
      navigate('/rooms')
    } catch (error: any) {
      showErrorAlert(error, 'Failed to set up rooms and beds')
    } finally {
      safeSetState<boolean>(setIsSubmitting, false)
    }
  }

  const totalBeds = useMemo(() => rooms.reduce((sum, r) => sum + (parseInt(r.beds, 10) || 0), 0), [rooms])
  const totalRevenue = useMemo(() => rooms.reduce((sum, r) => sum + (parseInt(r.beds, 10) || 0) * (parseFloat(r.price) || 0), 0), [rooms])

  const hasNoLocation = !selectedPGLocationId && !isFetchingExistingRooms

  return (
    <div className='container mx-auto max-w-5xl px-4 py-6'>
      <PageHeader
        title='Quick Setup'
        subtitle='Create your rooms and beds in one go'
        showBack={true}
        className='mb-6'
      />

      {hasNoLocation ? (
        <Card>
          <CardContent className='p-8 text-center'>
            <Building2 className='mx-auto size-16 text-muted-foreground' />
            <h3 className='mt-4 text-lg font-semibold'>No PG location found</h3>
            <p className='mt-2 text-sm text-muted-foreground'>
              Create a PG location first to set up rooms and beds.
            </p>
            <Button onClick={() => navigate('/pg-locations')} className='mt-6'>
              Create PG Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle className='text-lg'>Step 1: Basic Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>
                  Number of Rooms <span className='text-red-500'>*</span>
                </Label>
                <div className='flex'>
                  <div className='flex items-center justify-center rounded-l-md border border-r-0 border-input bg-primary/10 px-3'>
                    <Building2 className='size-4 text-primary' />
                  </div>
                  <Input
                    value={numRooms}
                    onChange={(e) => handleNumRoomsChange(e.target.value)}
                    placeholder='e.g., 5'
                    type='number'
                    min='1'
                    max={MAX_ROOMS}
                    className='rounded-l-none'
                  />
                </div>
                {errors.numRooms && <p className='text-sm text-red-500 mt-1'>{errors.numRooms}</p>}
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium'>
                  Default Bed Price / Month <span className='text-red-500'>*</span>
                </Label>
                <div className='flex'>
                  <div className='flex items-center justify-center rounded-l-md border border-r-0 border-input bg-primary/10 px-3'>
                    <IndianRupee className='size-4 text-primary' />
                  </div>
                  <Input
                    value={defaultPrice}
                    onChange={(e) => handleDefaultPriceChange(e.target.value)}
                    placeholder='e.g., 5000'
                    type='number'
                    min={MIN_PRICE}
                    max={MAX_PRICE}
                    step='0.01'
                    className='rounded-l-none'
                  />
                </div>
                {errors.defaultPrice && <p className='text-sm text-red-500 mt-1'>{errors.defaultPrice}</p>}
                <p className='text-xs text-muted-foreground mt-2'>
                  Tip: You can still update individual bed prices later from the Rooms screen.
                </p>
              </div>
            </CardContent>
          </Card>

          {rooms.length > 0 && (
            <Card className='mb-6'>
              <CardHeader className='pb-4'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                  <CardTitle className='text-lg'>Step 2: Rooms & Beds</CardTitle>
                  <Button onClick={addRoom} size='sm' variant='outline' className='w-full sm:w-auto'>
                    <Plus className='mr-2 size-4' />
                    Add Room
                  </Button>
                </div>
                {isFetchingExistingRooms && (
                  <p className='text-xs text-muted-foreground mt-1'>Checking existing rooms…</p>
                )}
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {rooms.map((room) => {
                    const beds = parseInt(room.beds, 10) || 0
                    const price = parseFloat(room.price) || 0
                    const total = beds * price
                    return (
                      <div key={room.id} className='rounded-lg border bg-card p-4'>
                        <div className='grid grid-cols-12 gap-3 items-center sm:items-end'>
                          <div className='col-span-12 sm:col-span-3 space-y-1.5'>
                            <Label className='text-xs font-medium'>Room No</Label>
                            <div className='flex'>
                              <div className='flex items-center justify-center rounded-l-md border border-r-0 border-input bg-primary/10 px-2'>
                                <span className='text-xs font-bold text-primary'>RM</span>
                              </div>
                              <Input
                                value={room.roomNo}
                                onChange={(e) => updateRoom(room.id, 'roomNo', e.target.value)}
                                placeholder='101'
                                type='number'
                                className='rounded-l-none text-sm'
                              />
                            </div>
                            {errors[`room_${room.id}_roomNo`] && (
                              <p className='text-xs text-red-500 mt-1'>{errors[`room_${room.id}_roomNo`]}</p>
                            )}
                          </div>

                          <div className='col-span-6 sm:col-span-2 space-y-1.5'>
                            <Label className='text-xs font-medium'>Beds</Label>
                            <Input
                              value={room.beds}
                              onChange={(e) => updateRoom(room.id, 'beds', e.target.value)}
                              placeholder='2'
                              type='number'
                              min='1'
                              max={MAX_BEDS_PER_ROOM}
                              className='text-sm text-center'
                            />
                            {errors[`room_${room.id}_beds`] && (
                              <p className='text-xs text-red-500 text-center mt-1'>{errors[`room_${room.id}_beds`]}</p>
                            )}
                          </div>

                          <div className='col-span-12 sm:col-span-4 space-y-1.5'>
                            <Label className='text-xs font-medium'>Price / Bed</Label>
                            <div className='flex'>
                              <div className='flex items-center justify-center rounded-l-md border border-r-0 border-input bg-primary/10 px-2'>
                                <IndianRupee className='size-3 text-primary' />
                              </div>
                              <Input
                                value={room.price}
                                onChange={(e) => updateRoom(room.id, 'price', e.target.value)}
                                placeholder='5000'
                                type='number'
                                min={MIN_PRICE}
                                max={MAX_PRICE}
                                step='0.01'
                                className='rounded-l-none text-sm'
                              />
                            </div>
                            {errors[`room_${room.id}_price`] && (
                              <p className='text-xs text-red-500 mt-1'>{errors[`room_${room.id}_price`]}</p>
                            )}
                          </div>

                          <div className='col-span-4 sm:col-span-2 text-right space-y-1.5 flex flex-col justify-end'>
                            <Label className='text-xs font-medium'>Total</Label>
                            <div className='text-sm font-bold text-primary'>
                              {formatPrice(total)}
                            </div>
                          </div>

                          <div className='col-span-2 sm:col-span-1 flex items-end justify-end'>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              onClick={() => removeRoom(room.id)}
                              disabled={isSubmitting}
                            >
                              <Trash2 className='size-4 text-red-500' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {rooms.length > 0 && (
            <Card className='mb-6'>
              <CardContent className='p-6'>
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-6'>
                  <div className='text-center sm:text-left'>
                    <div className='text-sm text-muted-foreground'>Total Rooms</div>
                    <div className='text-2xl font-bold'>{rooms.length}</div>
                  </div>
                  <div className='text-center sm:text-left'>
                    <div className='text-sm text-muted-foreground'>Total Beds</div>
                    <div className='text-2xl font-bold'>{totalBeds}</div>
                  </div>
                  <div className='text-center sm:text-left'>
                    <div className='text-sm text-muted-foreground'>Total Revenue</div>
                    <div className='text-2xl font-bold'>{formatPrice(totalRevenue)}</div>
                  </div>
                  <div className='text-center sm:text-left'>
                    <div className='text-sm text-muted-foreground'>Avg Price/Bed</div>
                    <div className='text-2xl font-bold'>
                      {totalBeds > 0 ? formatPrice(totalRevenue / totalBeds) : '₹0'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isSubmitting && (
            <Card className='mb-6'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-4'>
                  <Loader2 className='size-6 animate-spin text-primary' />
                  <div className='flex-1'>
                    <div className='text-sm font-medium'>Creating rooms and beds...</div>
                    <div className='text-xs text-muted-foreground'>
                      {progress.current} of {progress.total} completed
                    </div>
                    <div className='mt-3 h-2 w-full rounded-full bg-muted overflow-hidden'>
                      <div
                        className='h-full bg-primary transition-all duration-300'
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                {completedRooms.length > 0 && (
                  <div className='mt-4 text-xs text-muted-foreground'>
                    Completed: {completedRooms.join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className='flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2'>
            <Button variant='outline' onClick={() => navigate('/rooms')} disabled={isSubmitting} className='w-full sm:w-auto'>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || rooms.length === 0} className='w-full sm:w-auto'>
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 size-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Rooms & Beds'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
