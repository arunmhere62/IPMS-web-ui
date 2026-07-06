import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2 } from 'lucide-react'
import { useBulkCreateBedMutation } from '@/services/roomsApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

// Constants
const MIN_BED_PRICE = 100
const MAX_BED_PRICE = 100000
const MAX_BED_NUMBER_SUFFIX = 3
const MAX_DECIMAL_PLACES = 2
const MAX_BEDS_PER_BATCH = 20

interface BedRow {
  bed_no: string
  bed_price: string
}

interface BulkAddBedsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: number
  roomNo: string
  pgId: number
  existingBedCount: number
  defaultPrice?: string
  existingBedNumbers?: string[]
  onSaved: () => void
}

const sanitizeNumeric = (text: string): string => {
  // Remove any non-numeric characters except decimal point
  const numeric = text.replace(/[^0-9.]/g, '')
  // Remove multiple decimal points, keep only the first one
  const parts = numeric.split('.')
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('')
  }
  return numeric
}

const limitDecimalPlaces = (value: string, maxPlaces: number): string => {
  const parts = value.split('.')
  if (parts.length === 2 && parts[1].length > maxPlaces) {
    return parts[0] + '.' + parts[1].slice(0, maxPlaces)
  }
  return value
}

export function BulkAddBedsDialog({
  open,
  onOpenChange,
  roomId,
  roomNo,
  pgId,
  existingBedCount,
  defaultPrice,
  existingBedNumbers = [],
  onSaved,
}: BulkAddBedsDialogProps) {
  const [bulkCreateBed, { isLoading }] = useBulkCreateBedMutation()
  const [beds, setBeds] = useState<BedRow[]>([{ bed_no: '', bed_price: '' }])
  const [errors, setErrors] = useState<Record<number, { bed_no?: string; bed_price?: string }>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reset = () => {
    setBeds([{ bed_no: '', bed_price: defaultPrice || '' }])
    setErrors({})
    setIsSubmitting(false)
  }

  const handleClose = () => {
    if (isLoading) return
    reset()
    onOpenChange(false)
  }

  const addRow = () => {
    if (beds.length >= MAX_BEDS_PER_BATCH) {
      showErrorAlert(new Error(`Maximum ${MAX_BEDS_PER_BATCH} beds can be created at once`), 'Limit')
      return
    }
    setBeds([...beds, { bed_no: '', bed_price: defaultPrice || '' }])
  }

  const removeRow = (index: number) => {
    if (beds.length === 1) return
    const newBeds = beds.filter((_, i) => i !== index)
    setBeds(newBeds)
    setErrors((prev) => {
      const newErrors: Record<number, { bed_no?: string; bed_price?: string }> = {}
      Object.keys(prev).forEach((key) => {
        const idx = Number(key)
        if (idx < index) newErrors[idx] = prev[idx]
        else if (idx > index) newErrors[idx - 1] = prev[idx]
      })
      return newErrors
    })
  }

  const updateBed = (index: number, field: 'bed_no' | 'bed_price', value: string) => {
    let processed = sanitizeNumeric(value)
    if (field === 'bed_price') {
      processed = limitDecimalPlaces(processed, MAX_DECIMAL_PLACES)
    }
    setBeds((prev) => prev.map((b, i) => (i === index ? { ...b, [field]: processed } : b)))
    if (errors[index]?.[field]) {
      setErrors((prev) => ({
        ...prev,
        [index]: { ...prev[index], [field]: undefined },
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<number, { bed_no?: string; bed_price?: string }> = {}
    const bedNos: string[] = []

    beds.forEach((bed, index) => {
      const bedNo = bed.bed_no.trim()
      if (!bedNo) {
        newErrors[index] = { ...newErrors[index], bed_no: 'Required' }
      } else if (!/^\d+$/.test(bedNo)) {
        newErrors[index] = { ...newErrors[index], bed_no: 'Numbers only' }
      } else if (bedNo.length > MAX_BED_NUMBER_SUFFIX) {
        newErrors[index] = { ...newErrors[index], bed_no: `Max ${MAX_BED_NUMBER_SUFFIX} digits` }
      } else {
        const fullBedNo = `BED${bedNo}`
        if (bedNos.includes(fullBedNo)) {
          newErrors[index] = { ...newErrors[index], bed_no: 'Duplicate in list' }
        } else if (existingBedNumbers.includes(fullBedNo)) {
          newErrors[index] = { ...newErrors[index], bed_no: 'Bed number already exists' }
        } else {
          bedNos.push(fullBedNo)
        }
      }

      const price = bed.bed_price.trim()
      if (!price) {
        newErrors[index] = { ...newErrors[index], bed_price: 'Required' }
      } else {
        const numPrice = parseFloat(price)
        if (isNaN(numPrice) || numPrice <= 0) {
          newErrors[index] = { ...newErrors[index], bed_price: 'Invalid price' }
        } else if (numPrice < MIN_BED_PRICE) {
          newErrors[index] = { ...newErrors[index], bed_price: `Min ₹${MIN_BED_PRICE}` }
        } else if (numPrice > MAX_BED_PRICE) {
          newErrors[index] = { ...newErrors[index], bed_price: `Max ₹${MAX_BED_PRICE.toLocaleString('en-IN')}` }
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (isSubmitting || isLoading) return
    if (!roomId || !pgId) {
      showErrorAlert(new Error('Missing required information'), 'Error')
      return
    }

    if (!validate()) {
      showErrorAlert(new Error('Please fix the errors before submitting'), 'Validation Error')
      return
    }

    setIsSubmitting(true)

    try {
      await bulkCreateBed({
        room_id: roomId,
        pg_id: pgId,
        beds: beds.map((bed) => ({
          bed_no: `BED${bed.bed_no.trim()}`,
          bed_price: parseFloat(bed.bed_price),
        })),
      }).unwrap()
      showSuccessAlert(`${beds.length} bed${beds.length > 1 ? 's' : ''} created successfully`)
      reset()
      onSaved()
      onOpenChange(false)
    } catch (error) {
      showErrorAlert(error as Error, 'Bulk Create Error')
      // Don't reset on error so user can fix it
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      void handleSubmit()
    }
  }, [handleSubmit])

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Add Multiple Beds — Room {roomNo}</DialogTitle>
          <DialogDescription>
            {existingBedCount} existing bed{existingBedCount !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3" onKeyDown={handleKeyDown}>
            {beds.map((bed, index) => (
              <div key={index} className="flex gap-2 items-start">
                {/* Bed Number */}
                <div className="flex-1">
                  <Label className="text-xs font-semibold">
                    Bed {index + 1} Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex mt-1">
                    <div className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 font-semibold text-primary text-sm">
                      BED
                    </div>
                    <Input
                      value={bed.bed_no}
                      onChange={(e) => updateBed(index, 'bed_no', e.target.value)}
                      placeholder="1"
                      type="text"
                      disabled={isSubmitting}
                      className="rounded-l-none text-sm"
                      autoFocus={index === 0}
                    />
                  </div>
                  {errors[index]?.bed_no && (
                    <p className="text-xs text-destructive mt-1">{errors[index]?.bed_no}</p>
                  )}
                </div>

                {/* Bed Price */}
                <div className="flex-1">
                  <Label className="text-xs font-semibold">
                    Price (₹/mo) <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex mt-1">
                    <div className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 font-semibold text-primary text-sm">
                      ₹
                    </div>
                    <Input
                      value={bed.bed_price}
                      onChange={(e) => updateBed(index, 'bed_price', e.target.value)}
                      placeholder="5000"
                      type="text"
                      disabled={isSubmitting}
                      className="rounded-l-none text-sm"
                    />
                  </div>
                  {errors[index]?.bed_price && (
                    <p className="text-xs text-destructive mt-1">{errors[index]?.bed_price}</p>
                  )}
                </div>

                {/* Remove button */}
                {beds.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeRow(index)}
                    disabled={isSubmitting}
                    className="mt-5 bg-red-50 hover:bg-red-100 border-red-200 text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}

            {/* Add more button */}
            <Button
              type="button"
              variant="outline"
              onClick={addRow}
              disabled={beds.length >= MAX_BEDS_PER_BATCH || isSubmitting}
              className="w-full border-dashed"
            >
              <Plus className="size-4 mr-2" />
              Add Another Bed
            </Button>

            {/* Summary */}
            <div className="bg-primary/5 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                {beds.length} bed{beds.length !== 1 ? 's' : ''} will be created in Room {roomNo}
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : `Create ${beds.length} Bed${beds.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
