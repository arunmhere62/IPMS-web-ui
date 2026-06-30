import type { Room } from '@/services/roomsApi'
import { Bed, DoorOpen, FilterX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type OccupancyFilter = 'all' | 'occupied' | 'available'

interface RoomFilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rooms: Room[]
  selectedRoomId: number | null
  onSelectRoom: (roomId: number | null) => void
  occupancyFilter?: OccupancyFilter
  onOccupancyChange?: (filter: OccupancyFilter) => void
}

const OCCUPANCY_OPTIONS: { label: string; value: OccupancyFilter }[] = [
  { label: 'All Beds', value: 'all' },
  { label: 'Occupied', value: 'occupied' },
  { label: 'Available', value: 'available' },
]

export function RoomFilterModal({
  open,
  onOpenChange,
  rooms,
  selectedRoomId,
  onSelectRoom,
  occupancyFilter = 'all',
  onOccupancyChange,
}: RoomFilterModalProps) {
  const hasFilters = selectedRoomId !== null || occupancyFilter !== 'all'

  const handleClear = () => {
    onSelectRoom(null)
    onOccupancyChange?.('all')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Bed className='size-4' />
            Filter Beds
          </DialogTitle>
          <DialogDescription>
            Filter beds by room and occupancy status
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* Occupancy filter */}
          {onOccupancyChange && (
            <div>
              <div className='mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase'>
                Occupancy
              </div>
              <div className='flex gap-2'>
                {OCCUPANCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type='button'
                    onClick={() => onOccupancyChange(opt.value)}
                    className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                      occupancyFilter === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input text-foreground hover:bg-muted/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Room filter */}
          <div>
            <div className='mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase'>
              Room
            </div>
            <div className='max-h-[260px] space-y-1.5 overflow-y-auto'>
              <button
                type='button'
                onClick={() => onSelectRoom(null)}
                className={`w-full rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors ${
                  selectedRoomId === null
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input text-foreground hover:bg-muted/40'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <DoorOpen className='size-3.5' />
                    <span>All Rooms</span>
                  </div>
                  <span className='text-[10px] text-muted-foreground'>
                    Show all
                  </span>
                </div>
              </button>
              {rooms.map((room) => (
                <button
                  key={room.s_no}
                  type='button'
                  onClick={() => onSelectRoom(room.s_no)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors ${
                    selectedRoomId === room.s_no
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input text-foreground hover:bg-muted/40'
                  }`}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <DoorOpen className='size-3.5' />
                      <span>Room {room.room_no}</span>
                    </div>
                    <span className='text-[10px] text-muted-foreground'>
                      {room.total_beds ?? 0} beds
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          {hasFilters && (
            <Button
              variant='outline'
              size='sm'
              onClick={handleClear}
              className='gap-1.5'
            >
              <FilterX className='size-3.5' />
              Clear Filters
            </Button>
          )}
          <Button size='sm' onClick={() => onOpenChange(false)}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
