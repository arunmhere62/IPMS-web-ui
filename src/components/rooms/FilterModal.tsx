import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Filter } from 'lucide-react'

interface FilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filter: 'all' | 'occupied' | 'available'
  onFilterChange: (filter: 'all' | 'occupied' | 'available') => void
}

export function FilterModal({ open, onOpenChange, filter, onFilterChange }: FilterModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="size-4" />
            Filter Rooms
          </DialogTitle>
          <DialogDescription>
            Choose how you want to filter the rooms list
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => {
                onFilterChange('all')
                onOpenChange(false)
              }}
              className="justify-start h-12"
            >
              <div className="flex items-center justify-between w-full">
                <span>All Rooms</span>
                <span className="text-xs text-muted-foreground">Show everything</span>
              </div>
            </Button>
            
            <Button
              variant={filter === 'occupied' ? 'default' : 'outline'}
              onClick={() => {
                onFilterChange('occupied')
                onOpenChange(false)
              }}
              className="justify-start h-12"
            >
              <div className="flex items-center justify-between w-full">
                <span>Occupied Only</span>
                <span className="text-xs text-muted-foreground">Full rooms</span>
              </div>
            </Button>
            
            <Button
              variant={filter === 'available' ? 'default' : 'outline'}
              onClick={() => {
                onFilterChange('available')
                onOpenChange(false)
              }}
              className="justify-start h-12"
            >
              <div className="flex items-center justify-between w-full">
                <span>Available Only</span>
                <span className="text-xs text-muted-foreground">Rooms with space</span>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
