import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useGetCitiesQuery,
  useGetStatesQuery,
  type State,
  type City,
} from '@/services/locationApi'
import {
  useCreatePGLocationMutation,
  useUpdatePGLocationMutation,
} from '@/services/pgLocationsApi'
import type { PGLocation } from '@/types'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormDialog } from '@/components/form/form-dialog'
import { FormNumberInput } from '@/components/form/form-number-input'
import { FormSelectField } from '@/components/form/form-select-field'
import { FormTextInput } from '@/components/form/form-text-input'
import { ImageUploadS3 } from '@/components/form/image-upload-s3'
import { OptionSelector } from '@/components/form/option-selector'

const schema = z
  .object({
    locationName: z.string().min(1, 'Location name is required'),
    address: z.string().min(1, 'Address is required'),
    pincode: z.string().optional(),
    stateId: z.number().min(1, 'State is required'),
    cityId: z.number().min(1, 'City is required'),
    images: z.array(z.string()),
    rentCycleType: z
      .enum(['CALENDAR', 'MIDMONTH'])
      .optional()
      .refine((val) => val !== undefined, {
        message: 'Rent cycle type is required',
      }),
    rentCycleStart: z.number().nullable(),
    rentCycleEnd: z.number().nullable(),
    pgType: z
      .enum(['COLIVING', 'MENS', 'WOMENS'])
      .optional()
      .refine((val) => val !== undefined, {
        message: 'PG type is required',
      }),
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

export function PGLocationFormDialog({
  open,
  onOpenChange,
  editTarget,
  onSaved,
}: PGLocationFormDialogProps) {
  const [createPGLocation, { isLoading: creating }] =
    useCreatePGLocationMutation()
  const [updatePGLocation, { isLoading: updating }] =
    useUpdatePGLocationMutation()

  const { data: statesResponse, isLoading: statesLoading } = useGetStatesQuery({
    countryCode: 'IN',
  })
  const states = useMemo(
    () => statesResponse?.data || [],
    [statesResponse?.data]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      locationName: '',
      address: '',
      pincode: '',
      stateId: 0,
      cityId: 0,
      images: [],
      rentCycleType: undefined,
      rentCycleStart: 1,
      rentCycleEnd: 30,
      pgType: undefined,
    },
  })

  const selectedStateId = form.watch('stateId')
  const selectedStateCode = useMemo(() => {
    const state = states.find(
      (s: State) => Number(s.s_no) === Number(selectedStateId)
    )
    return state?.iso_code ? String(state.iso_code) : ''
  }, [selectedStateId, states])

  const { data: citiesResponse, isLoading: citiesLoading } = useGetCitiesQuery(
    { stateCode: selectedStateCode },
    { skip: !selectedStateCode }
  )
  const cities = useMemo(
    () => citiesResponse?.data || [],
    [citiesResponse?.data]
  )

  useEffect(() => {
    if (!open) return

    if (editTarget) {
      form.reset({
        locationName: editTarget.location_name || '',
        address: editTarget.address || '',
        pincode: editTarget.pincode || '',
        stateId: Number(editTarget.state_id || 0),
        cityId: Number(editTarget.city_id || 0),
        images: Array.isArray(editTarget.images) ? editTarget.images : [],
        rentCycleType: editTarget.rent_cycle_type || undefined,
        rentCycleStart: editTarget.rent_cycle_start ?? 1,
        rentCycleEnd: editTarget.rent_cycle_end ?? 30,
        pgType: editTarget.pg_type || undefined,
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
      rentCycleType: undefined,
      rentCycleStart: 1,
      rentCycleEnd: 30,
      pgType: undefined,
    })
  }, [open, editTarget, form])

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        locationName: values.locationName.trim(),
        address: values.address.trim(),
        stateId: values.stateId,
        cityId: values.cityId,
        images: Array.isArray(values.images) ? values.images : [],
        rentCycleType: values.rentCycleType!,
        pgType: values.pgType!,
        ...(values.pincode?.trim() && { pincode: values.pincode.trim() }),
        ...(values.rentCycleType === 'MIDMONTH' && {
          rentCycleStart: values.rentCycleStart,
          rentCycleEnd: values.rentCycleEnd,
        }),
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
    } catch (e) {
      showErrorAlert(e, 'Save Error')
    }
  }

  const busy = creating || updating

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      size='2xl'
      title={editTarget ? 'Edit PG Location' : 'Add PG Location'}
      description={
        editTarget
          ? `Update details for #${editTarget.s_no}`
          : 'Create a new PG location'
      }
      footer={
        <>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            form={editTarget ? 'pg-location-edit' : 'pg-location-create'}
            disabled={busy}
          >
            {busy ? 'Saving...' : editTarget ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id={editTarget ? 'pg-location-edit' : 'pg-location-create'}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-5'
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

          <div className='grid gap-4 md:grid-cols-2'>
            <FormSelectField
              control={form.control}
              name='stateId'
              label='State'
              required
              disabled={busy}
              placeholder={statesLoading ? 'Loading...' : 'Select a state'}
              options={states.map((s: State) => ({
                label: s.name,
                value: String(s.s_no),
              }))}
              parse={(v) => {
                const n = v ? Number(v) : 0
                return Number.isFinite(n) ? n : 0
              }}
              onValueChange={() => {
                form.setValue('cityId', 0, {
                  shouldDirty: true,
                  shouldValidate: false,
                })
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
              options={cities.map((c: City) => ({
                label: c.name,
                value: String(c.s_no),
              }))}
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
              form.setValue('rentCycleStart', 1, {
                shouldDirty: true,
                shouldValidate: true,
              })
              form.setValue('rentCycleEnd', 30, {
                shouldDirty: true,
                shouldValidate: true,
              })
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
            selectedValue={form.watch('pgType') || null}
            onSelect={(value) => {
              if (!value) return
              form.setValue('pgType', value as 'COLIVING' | 'MENS' | 'WOMENS', {
                shouldDirty: true,
                shouldValidate: true,
              })
            }}
            required
            disabled={busy}
            error={form.formState.errors.pgType?.message}
          />

          {form.watch('rentCycleType') === 'MIDMONTH' ? (
            <div className='grid gap-4 md:grid-cols-2'>
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
            images={form.watch('images') || []}
            onImagesChange={(images) => {
              form.setValue('images', images, {
                shouldDirty: true,
                shouldValidate: true,
              })
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
    </FormDialog>
  )
}
