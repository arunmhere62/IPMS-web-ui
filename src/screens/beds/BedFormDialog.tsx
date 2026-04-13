import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  type Bed,
  type CreateBedDto,
  type Room,
  useCreateBedMutation,
  useUpdateBedMutation,
} from '@/services/roomsApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormDialog } from '@/components/form/form-dialog'
import { FormPrefixInput } from '@/components/form/form-prefix-input'
import { FormTextInput } from '@/components/form/form-text-input'

const schema = z.object({
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

export function BedFormDialog({
  open,
  onOpenChange,
  editTarget,
  defaultRoomId,
  pgId,
  onSaved,
}: BedFormDialogProps) {
  const [createBed, { isLoading: creating }] = useCreateBedMutation()
  const [updateBed, { isLoading: updating }] = useUpdateBedMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bedNo: '',
      bedPrice: '',
    },
  })

  useEffect(() => {
    if (!open) return

    if (editTarget) {
      form.reset({
        bedNo: String(editTarget.bed_no ?? ''),
        bedPrice:
          editTarget.bed_price != null ? String(editTarget.bed_price) : '',
      })
      return
    }

    form.reset({
      bedNo: '',
      bedPrice: '',
    })
  }, [open, editTarget, form, defaultRoomId])

  const onSubmit = async (values: FormValues) => {
    try {
      const roomId = editTarget?.room_id ?? defaultRoomId
      if (!roomId) {
        showErrorAlert('Room is required', 'Save Error')
        return
      }

      const payload: Partial<CreateBedDto> = {
        room_id: roomId,
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
    } catch (e: unknown) {
      showErrorAlert(e, 'Save Error')
    }
  }

  const saving = creating || updating

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editTarget ? 'Edit Bed' : 'Add Bed'}
      description='Enter bed details.'
      size='sm'
      footer={
        <>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type='submit' form='bed-form' disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id='bed-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='grid gap-4'
        >
          <FormPrefixInput
            control={form.control}
            name='bedNo'
            label='Bed Number'
            placeholder='1'
            prefix='BED'
            required
          />
          <FormTextInput
            control={form.control}
            name='bedPrice'
            label='Bed Price'
            placeholder='5000'
            required
          />
        </form>
      </Form>
    </FormDialog>
  )
}
