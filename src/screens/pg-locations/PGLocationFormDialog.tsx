import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { AppDialog } from '@/components/form/app-dialog'
import { ImageUploadS3 } from '@/components/form/image-upload-s3'
import { OptionSelector } from '@/components/form/option-selector'
import { FormNumberInput } from '@/components/form/form-number-input'
import { FormSelectField } from '@/components/form/form-select-field'
import { FormTextInput } from '@/components/form/form-text-input'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'

import { useGetCitiesQuery, useGetStatesQuery } from '@/services/locationApi'
import { useCreatePGLocationMutation, useUpdatePGLocationMutation } from '@/services/pgLocationsApi'
import type { PGLocation } from '@/types'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

const schema = z
  .object({
    locationName: z.string().min(1, 'Location name is required'),
    address: z.string().min(1, 'Address is required'),
    pincode: z.string().optional(),
    stateId: z.number().min(1, 'State is required'),
    cityId: z.number().min(1, 'City is required'),
    images: z.array(z.string()),
    rentCycleType: z.enum(['CALENDAR', 'MIDMONTH']),
    rentCycleStart: z.number().nullable(),
    rentCycleEnd: z.number().nullable(),
    pgType: z.enum(['COLIVING', 'MENS', 'WOMENS']),
  })
  .superRefine((v, ctx) => {
    if (v.rentCycleType !== 'MIDMONTH') return
    if (v.rentCycleStart == null || !Number.isFinite(v.rentCycleStart)) {
      ctx.addIssue({
        code: 'custom',
        path: ['rentCycleStart'],
        message: 'Rent cycle start day is required for mid-month cycle',
      })
    }
    if (v.rentCycleEnd == null || !Number.isFinite(v.rentCycleEnd)) {
      ctx.addIssue({
        code: 'custom',
        path: ['rentCycleEnd'],
        message: 'Rent cycle end day is required for mid-month cycle',
      })
    }
  })

type FormValues = z.infer<typeof schema>

export type PGLocationFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTarget: PGLocation | null
  onSaved: () => void
}

export function PGLocationFormDialog({ open, onOpenChange, editTarget, onSaved }: PGLocationFormDialogProps) {
  const [createPGLocation, { isLoading: creating }] = useCreatePGLocationMutation()
  const [updatePGLocation, { isLoading: updating }] = useUpdatePGLocationMutation()

  const { data: statesResponse, isLoading: statesLoading } = useGetStatesQuery({ countryCode: 'IN' })
  const states = statesResponse?.data || []

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      locationName: '',
      address: '',
      pincode: '',
      stateId: 0,
      cityId: 0,
      images: [],
      rentCycleType: 'CALENDAR',
      rentCycleStart: 1,
      rentCycleEnd: 30,
      pgType: 'COLIVING',
    },
  })

  const selectedStateId = form.watch('stateId')
  const selectedStateCode = useMemo(() => {
    const state = states.find((s: any) => Number(s.s_no) === Number(selectedStateId))
    return state?.iso_code ? String(state.iso_code) : ''
  }, [selectedStateId, states])

  const { data: citiesResponse, isLoading: citiesLoading } = useGetCitiesQuery(
    { stateCode: selectedStateCode },
    { skip: !selectedStateCode } as any
  )
  const cities = citiesResponse?.data || []

  useEffect(() => {
    if (!open) return

    if (editTarget) {
      form.reset({
        locationName: (editTarget as any)?.location_name || '',
        address: (editTarget as any)?.address || '',
        pincode: (editTarget as any)?.pincode || '',
        stateId: Number((editTarget as any)?.state_id || 0),
        cityId: Number((editTarget as any)?.city_id || 0),
        images: Array.isArray((editTarget as any)?.images) ? ((editTarget as any).images as any) : [],
        rentCycleType: ((editTarget as any)?.rent_cycle_type || 'CALENDAR') as any,
        rentCycleStart: ((editTarget as any)?.rent_cycle_start ?? 1) as any,
        rentCycleEnd: ((editTarget as any)?.rent_cycle_end ?? 30) as any,
        pgType: ((editTarget as any)?.pg_type || 'COLIVING') as any,
      })
      return
    }

    form.reset({
      locationName: '',
      address: '',
      pincode: '',
      stateId: 0,
      cityId: 0,
      images: [],
      rentCycleType: 'CALENDAR',
      rentCycleStart: 1,
      rentCycleEnd: 30,
      pgType: 'COLIVING',
    })
  }, [open, editTarget, form])

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: any = {
        locationName: values.locationName.trim(),
        address: values.address.trim(),
        stateId: values.stateId,
        cityId: values.cityId,
        images: Array.isArray(values.images) ? values.images : [],
        rentCycleType: values.rentCycleType,
        pgType: values.pgType,
      }

      if (values.pincode && values.pincode.trim()) payload.pincode = values.pincode.trim()

      if (values.rentCycleType === 'MIDMONTH') {
        payload.rentCycleStart = values.rentCycleStart
        payload.rentCycleEnd = values.rentCycleEnd
      }

      if (editTarget) {
        await updatePGLocation({ id: editTarget.s_no, data: payload }).unwrap()
        showSuccessAlert('PG location updated successfully')
      } else {
        await createPGLocation(payload).unwrap()
        showSuccessAlert('PG location created successfully')
      }

      onOpenChange(false)
      onSaved()
    } catch (e: any) {
      showErrorAlert(e, 'Save Error')
    }
  }

  const busy = creating || updating

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      size='xl'
      title={editTarget ? 'Edit PG Location' : 'Add PG Location'}
      description={editTarget ? `Update details for #${editTarget.s_no}` : 'Create a new PG location'}
      footer={
        <>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form={editTarget ? 'pg-location-edit' : 'pg-location-create'} disabled={busy}>
            {busy ? 'Saving...' : editTarget ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id={editTarget ? 'pg-location-edit' : 'pg-location-create'}
          className='grid gap-4'
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormTextInput
            control={form.control}
            name='locationName'
            label='Location Name'
            placeholder='Enter PG location name'
            required
            disabled={busy}
          />

          <FormTextInput
            control={form.control}
            name='address'
            label='Address'
            placeholder='Enter address'
            required
            disabled={busy}
          />

          <div className='grid gap-4 sm:grid-cols-2'>
            <FormSelectField
              control={form.control}
              name='stateId'
              label='State'
              required
              disabled={busy}
              placeholder={statesLoading ? 'Loading...' : 'Select a state'}
              options={(states || []).map((s: any) => ({ label: s.name, value: String(s.s_no) }))}
              parse={(v) => {
                const n = v ? Number(v) : 0
                return Number.isFinite(n) ? n : 0
              }}
              onValueChange={() => {
                form.setValue('cityId', 0, { shouldDirty: true, shouldValidate: false })
                form.clearErrors('cityId')
              }}
            />

            <FormSelectField
              control={form.control}
              name='cityId'
              label='City'
              required
              disabled={busy || !selectedStateCode}
              placeholder={citiesLoading ? 'Loading...' : 'Select a city'}
              options={(cities || []).map((c: any) => ({ label: c.name, value: String(c.s_no) }))}
              parse={(v) => {
                const n = v ? Number(v) : 0
                return Number.isFinite(n) ? n : 0
              }}
            />
          </div>

          <FormTextInput
            control={form.control}
            name='pincode'
            label='Pincode (Optional)'
            placeholder='Enter pincode'
            disabled={busy}
          />

          <FormSelectField
            control={form.control}
            name='rentCycleType'
            label='Rent Cycle Type'
            required
            disabled={busy}
            placeholder='Select cycle type'
            options={[
              { label: 'Calendar Month Cycle', value: 'CALENDAR' },
              { label: 'Mid-Month Cycle', value: 'MIDMONTH' },
            ]}
            onValueChange={() => {
              form.setValue('rentCycleStart', 1, { shouldDirty: true, shouldValidate: true })
              form.setValue('rentCycleEnd', 30, { shouldDirty: true, shouldValidate: true })
            }}
          />

          <OptionSelector
            label='PG Type'
            description='Type of accommodation'
            options={[
              { label: 'COLIVING', value: 'COLIVING', icon: '👥' },
              { label: 'MENS', value: 'MENS', icon: '👨' },
              { label: 'WOMENS', value: 'WOMENS', icon: '👩' },
            ]}
            selectedValue={form.watch('pgType')}
            onSelect={(value) => {
              if (!value) return
              form.setValue('pgType', value as any, { shouldDirty: true, shouldValidate: true })
            }}
            required
            disabled={busy}
            error={(form.formState.errors as any)?.pgType?.message}
          />

          {form.watch('rentCycleType') === 'MIDMONTH' ? (
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormNumberInput
                control={form.control}
                name='rentCycleStart'
                label='Rent Cycle Start Day'
                placeholder='1'
                required
                disabled={busy}
              />

              <FormNumberInput
                control={form.control}
                name='rentCycleEnd'
                label='Rent Cycle End Day'
                placeholder='30'
                required
                disabled={busy}
              />
            </div>
          ) : null}

          <ImageUploadS3
            images={(form.watch('images') as any) || []}
            onImagesChange={(images) => {
              form.setValue('images', images as any, { shouldDirty: true, shouldValidate: true })
            }}
            maxImages={2}
            label='PG Location Images'
            disabled={busy}
            folder='pg-locations/images'
            useS3={true}
            entityId={editTarget?.s_no?.toString()}
            autoSave={false}
          />
        </form>
      </Form>
    </AppDialog>
  )
}
