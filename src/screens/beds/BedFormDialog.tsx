import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { AppDialog } from '@/components/form/app-dialog'
import { FormTextInput } from '@/components/form/form-text-input'
import { FormSelectField } from '@/components/form/form-select-field'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'

import {
  type Bed,
  type CreateBedDto,
  type Room,
  useCreateBedMutation,
  useUpdateBedMutation,
} from '@/services/roomsApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

const schema = z.object({
  roomId: z.number().min(1, 'Room is required'),
  bedNo: z.string().min(1, 'Bed number is required'),
  bedPrice: z
    .string()
    .min(1, 'Bed price is required')
    .refine((v) => {
      const n = Number(v)
      return Number.isFinite(n) && n > 0
    }, 'Bed price must be greater than 0'),
})

type FormValues = z.infer<typeof schema>

export type BedFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTarget: Bed | null
  rooms: Room[]
  defaultRoomId?: number
  pgId: number
  onSaved: () => void
}

export function BedFormDialog({ open, onOpenChange, editTarget, rooms, defaultRoomId, pgId, onSaved }: BedFormDialogProps) {
  const [createBed, { isLoading: creating }] = useCreateBedMutation()
  const [updateBed, { isLoading: updating }] = useUpdateBedMutation()

  const roomOptions = useMemo(
    () =>
      (Array.isArray(rooms) ? rooms : []).map((r) => ({
        label: String(r.room_no),
        value: String(r.s_no),
        searchText: String(r.room_no),
      })),
    [rooms]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      roomId: defaultRoomId ?? 0,
      bedNo: '',
      bedPrice: '',
    },
  })

  useEffect(() => {
    if (!open) return

    if (editTarget) {
      form.reset({
        roomId: Number((editTarget as any).room_id ?? 0),
        bedNo: String((editTarget as any).bed_no ?? ''),
        bedPrice: (editTarget as any).bed_price != null ? String((editTarget as any).bed_price) : '',
      })
      return
    }

    form.reset({
      roomId: defaultRoomId ?? 0,
      bedNo: '',
      bedPrice: '',
    })
  }, [open, editTarget, form, defaultRoomId])

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: Partial<CreateBedDto> = {
        room_id: values.roomId,
        pg_id: pgId,
        bed_no: values.bedNo.trim(),
        bed_price: Number(values.bedPrice),
      }

      if (editTarget) {
        await updateBed({ id: editTarget.s_no, data: payload }).unwrap()
        showSuccessAlert('Bed updated successfully')
      } else {
        await createBed(payload as CreateBedDto).unwrap()
        showSuccessAlert('Bed created successfully')
      }

      onOpenChange(false)
      onSaved()
    } catch (e: any) {
      showErrorAlert(e, 'Save Error')
    }
  }

  const saving = creating || updating

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editTarget ? 'Edit Bed' : 'Add Bed'}
      description='Enter bed details.'
      size='sm'
      footer={
        <div className='flex w-full justify-end gap-2 px-3 pb-3'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type='submit' form='bed-form' disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <form id='bed-form' onSubmit={form.handleSubmit(onSubmit)} className='grid gap-4'>
          <FormSelectField
            control={form.control}
            name='roomId'
            label='Room'
            required
            placeholder='Select room'
            options={roomOptions}
            parse={(v) => Number(v)}
            searchable
          />

          <FormTextInput control={form.control} name='bedNo' label='Bed Number' placeholder='BED1' required />
          <FormTextInput control={form.control} name='bedPrice' label='Bed Price' placeholder='5000' required />
        </form>
      </Form>
    </AppDialog>
  )
}
