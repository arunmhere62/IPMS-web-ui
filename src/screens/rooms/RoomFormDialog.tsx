import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  type CreateRoomDto,
  type Room,
  useCreateRoomMutation,
  useUpdateRoomMutation,
} from '@/services/roomsApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormDialog } from '@/components/form/form-dialog'
import { FormPrefixInput } from '@/components/form/form-prefix-input'
import { ImageUploadS3 } from '@/components/form/image-upload-s3'

const schema = z.object({
  roomNo: z.string().min(1, 'Room number is required'),
  images: z.array(z.string()),
})

type FormValues = z.infer<typeof schema>

export type RoomFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTarget: Room | null
  pgId: number
  onSaved: () => void
}

export function RoomFormDialog({
  open,
  onOpenChange,
  editTarget,
  pgId,
  onSaved,
}: RoomFormDialogProps) {
  const [createRoom, { isLoading: creating }] = useCreateRoomMutation()
  const [updateRoom, { isLoading: updating }] = useUpdateRoomMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      roomNo: '',
      images: [],
    },
  })

  useEffect(() => {
    if (!open) return

    if (editTarget) {
      form.reset({
        roomNo: String(editTarget.room_no ?? ''),
        images: Array.isArray(editTarget.images)
          ? (editTarget.images as string[])
          : [],
      })
      return
    }

    form.reset({
      roomNo: '',
      images: [],
    })
  }, [open, editTarget, form])

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: Partial<CreateRoomDto> = {
        pg_id: pgId,
        room_no: values.roomNo.trim(),
        images: Array.isArray(values.images) ? values.images : [],
      }

      if (editTarget) {
        await updateRoom({ id: editTarget.s_no, data: payload }).unwrap()
        showSuccessAlert('Room updated successfully')
      } else {
        await createRoom(payload as CreateRoomDto).unwrap()
        showSuccessAlert('Room created successfully')
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
      title={editTarget ? 'Edit Room' : 'Add Room'}
      description='Enter room details.'
      size='md'
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
          <Button type='submit' form='room-form' disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id='room-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='grid gap-4'
        >
          <FormPrefixInput
            control={form.control}
            name='roomNo'
            label='Room Number'
            placeholder='101'
            prefix='RM'
            required
          />

          <ImageUploadS3
            images={form.watch('images')}
            onImagesChange={(images) => form.setValue('images', images)}
            maxImages={5}
            label='Room Images (Optional)'
            disabled={saving}
            folder='rooms/images'
            useS3
            entityId={editTarget?.s_no ? String(editTarget.s_no) : undefined}
          />
        </form>
      </Form>
    </FormDialog>
  )
}
