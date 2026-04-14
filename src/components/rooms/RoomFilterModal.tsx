import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DoorOpen } from 'lucide-react'
import { Room } from '@/services/roomsApi'

interface RoomFilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rooms: Room[]
  selectedRoomId: number | null
  onSelectRoom: (roomId: number | null) => void
}

export function RoomFilterModal({ 
  open, 
  onOpenChange, 
  rooms, 
  selectedRoomId, 
  onSelectRoom 
}: RoomFilterModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorOpen className="size-4" />
            Filter by Room
          </DialogTitle>
          <DialogDescription>
            Select a room to filter beds
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-2 py-4 max-h-[400px] overflow-y-auto">
          <Button
            variant={selectedRoomId === null ? 'default' : 'outline'}
            onClick={() => {
              onSelectRoom(null)
              onOpenChange(false)
            }}
            className="justify-start"
          >
            <div className="flex items-center justify-between w-full">
              <span>All Rooms</span>
              <span className="text-xs text-muted-foreground">Show all beds</span>
            </div>
          </Button>
          
          {rooms.map((room) => (
            <Button
              key={room.s_no}
              variant={selectedRoomId === room.s_no ? 'default' : 'outline'}
              onClick={() => {
                onSelectRoom(room.s_no)
                onOpenChange(false)
              }}
              className="justify-start"
            >
              <div className="flex items-center justify-between w-full">
                <span>Room {room.room_no}</span>
                <span className="text-xs text-muted-foreground">
                  {room.total_beds ?? 0} beds
                </span>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
