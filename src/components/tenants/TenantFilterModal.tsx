import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Filter } from 'lucide-react'

interface RoomOption {
  label: string
  value: string
}

interface TenantFilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'CHECKED_OUT'
  selectedRoomId: number | null
  pendingRent: boolean
  pendingAdvance: boolean
  partialRent: boolean
  roomOptions: RoomOption[]
  onStatusFilterChange: (filter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'CHECKED_OUT') => void
  onRoomChange: (roomId: number | null) => void
  onPendingRentChange: (value: boolean) => void
  onPendingAdvanceChange: (value: boolean) => void
  onPartialRentChange: (value: boolean) => void
  onClear: () => void
  onApply: () => void
}

export function TenantFilterModal({
  open,
  onOpenChange,
  statusFilter,
  selectedRoomId,
  pendingRent,
  pendingAdvance,
  partialRent,
  roomOptions,
  onStatusFilterChange,
  onRoomChange,
  onPendingRentChange,
  onPendingAdvanceChange,
  onPartialRentChange,
  onClear,
  onApply,
}: TenantFilterModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="size-4" />
            Filter Tenants
          </DialogTitle>
          <DialogDescription>
            Filter tenants by status, room and dues.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="text-sm font-medium">Filter by Status</div>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'ACTIVE', 'INACTIVE', 'CHECKED_OUT'].map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onStatusFilterChange(status as any)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Filter by Room</div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={!selectedRoomId ? 'default' : 'outline'}
                size="sm"
                onClick={() => onRoomChange(null)}
              >
                All Rooms
              </Button>
              {(roomOptions || []).map((o) => (
                <Button
                  key={o.value}
                  type="button"
                  variant={selectedRoomId === Number(o.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onRoomChange(Number(o.value))}
                >
                  {o.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Payment Filters</div>
            <p className="text-xs text-muted-foreground">Select one payment filter (mutually exclusive)</p>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant={pendingRent ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => {
                  if (pendingRent) {
                    onPendingRentChange(false)
                  } else {
                    onPendingRentChange(true)
                    onPendingAdvanceChange(false)
                    onPartialRentChange(false)
                  }
                }}
                className="justify-start"
              >
                ⚠️ Pending Rent
              </Button>
              <Button
                type="button"
                variant={pendingAdvance ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (pendingAdvance) {
                    onPendingAdvanceChange(false)
                  } else {
                    onPendingAdvanceChange(true)
                    onPendingRentChange(false)
                    onPartialRentChange(false)
                  }
                }}
                className="justify-start"
              >
                💰 No Advance
              </Button>
              <Button
                type="button"
                variant={partialRent ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (partialRent) {
                    onPartialRentChange(false)
                  } else {
                    onPartialRentChange(true)
                    onPendingRentChange(false)
                    onPendingAdvanceChange(false)
                  }
                }}
                className="justify-start"
              >
                ⏳ Partial Rent
              </Button>
            </div>
          </div>
        </div>

        <div className="flex w-full justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onClear()
              onOpenChange(false)
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply()
              onOpenChange(false)
            }}
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
