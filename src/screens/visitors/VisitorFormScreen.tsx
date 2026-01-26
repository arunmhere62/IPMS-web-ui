import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, CircleAlert, Save } from 'lucide-react'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Form } from '@/components/ui/form'
import { PageHeader } from '@/components/form/page-header'
import { FormSelectField } from '@/components/form/form-select-field'
import { FormTextInput } from '@/components/form/form-text-input'
import { FormTextarea } from '@/components/form/form-textarea'

import {
  useCreateVisitorMutation,
  useGetVisitorByIdQuery,
  useUpdateVisitorMutation,
  type CreateVisitorDto,
  type Visitor,
} from '@/services/visitorsApi'
import { useGetCitiesQuery, useGetStatesQuery, type City, type State } from '@/services/locationApi'
import { useGetAllBedsQuery, useGetAllRoomsQuery, type Bed, type Room } from '@/services/roomsApi'
import { useAppSelector } from '@/store/hooks'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

const schema = z.object({
  visitor_name: z.string().min(1, 'Visitor name is required'),
  phone_no: z.string().min(1, 'Phone number is required'),
  purpose: z.string().optional().or(z.literal('')),
  visited_date: z.string().optional().or(z.literal('')),
  visited_room_id: z.number().optional().nullable(),
  visited_bed_id: z.number().optional().nullable(),
  state_id: z.number().optional().nullable(),
  city_id: z.number().optional().nullable(),
  remarks: z.string().optional().or(z.literal('')),
  convertedTo_tenant: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

type ErrorLike = {
  data?: {
    message?: string
  }
  message?: string
}

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

const coerceDateString = (value: unknown) => {
  const s = String(value ?? '')
  if (!s) return ''
  return s.includes('T') ? s.split('T')[0] : s
}

export function VisitorFormScreen() {
  const navigate = useNavigate()
  const params = useParams()
  const visitorId = params.id ? Number(params.id) : null
  const isEditMode = Number.isFinite(visitorId) && Number(visitorId) > 0

  const selectedPGLocationId = useAppSelector((s) => s.pgLocations.selectedPGLocationId)

  const { data: visitorData, isLoading: loadingVisitor, error: visitorError } = useGetVisitorByIdQuery(visitorId ?? 0, {
    skip: !isEditMode,
  })
  const visitor = (visitorData as unknown as Visitor | null) ?? null

  const [createVisitor, { isLoading: creating }] = useCreateVisitorMutation()
  const [updateVisitor, { isLoading: updating }] = useUpdateVisitorMutation()

  const { data: roomsResponse } = useGetAllRoomsQuery(
    selectedPGLocationId ? { pg_id: selectedPGLocationId, limit: 200 } : undefined,
    { skip: !selectedPGLocationId }
  )
  const rooms: Room[] = useMemo(() => asArray<Room>((roomsResponse as { data?: unknown } | undefined)?.data), [roomsResponse])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      visitor_name: '',
      phone_no: '',
      purpose: '',
      visited_date: new Date().toISOString().split('T')[0],
      visited_room_id: null,
      visited_bed_id: null,
      state_id: null,
      city_id: null,
      remarks: '',
      convertedTo_tenant: false,
    },
  })

  const watchedRoomId = useWatch({ control: form.control, name: 'visited_room_id' })
  const watchedStateId = useWatch({ control: form.control, name: 'state_id' })
  const watchedVisitedDate = useWatch({ control: form.control, name: 'visited_date' })
  const watchedConverted = useWatch({ control: form.control, name: 'convertedTo_tenant' })

  const { data: bedsResponse, isLoading: bedsLoading } = useGetAllBedsQuery(
    watchedRoomId ? { room_id: watchedRoomId, limit: 500 } : undefined,
    { skip: !watchedRoomId }
  )
  const beds: Bed[] = useMemo(() => asArray<Bed>((bedsResponse as { data?: unknown } | undefined)?.data), [bedsResponse])

  const { data: statesResponse } = useGetStatesQuery({ countryCode: 'IN' })
  const states = useMemo(() => asArray<State>((statesResponse as { data?: unknown } | undefined)?.data), [statesResponse])

  const stateCode = useMemo(() => {
    if (!watchedStateId) return ''
    const st = states.find((s) => Number(s?.s_no) === Number(watchedStateId))
    return String(st?.iso_code ?? '')
  }, [states, watchedStateId])

  const { data: citiesResponse } = useGetCitiesQuery({ stateCode: stateCode || '' }, { skip: !stateCode })
  const cities = useMemo(() => asArray<City>((citiesResponse as { data?: unknown } | undefined)?.data), [citiesResponse])

  useEffect(() => {
    if (!isEditMode) return
    if (!visitor) return

    form.reset({
      visitor_name: String(visitor.visitor_name ?? ''),
      phone_no: String(visitor.phone_no ?? ''),
      purpose: String(visitor.purpose ?? ''),
      visited_date: coerceDateString(visitor.visited_date) || new Date().toISOString().split('T')[0],
      visited_room_id: visitor.visited_room_id ?? null,
      visited_bed_id: visitor.visited_bed_id ?? null,
      state_id: visitor.state_id ?? null,
      city_id: visitor.city_id ?? null,
      remarks: String(visitor.remarks ?? ''),
      convertedTo_tenant: Boolean(visitor.convertedTo_tenant),
    })
  }, [form, isEditMode, visitor])

  useEffect(() => {
    if (!watchedRoomId) {
      form.setValue('visited_bed_id', null)
      return
    }
    const currentBed = form.getValues('visited_bed_id')
    if (!currentBed) return
    const exists = beds.some((b) => Number(b.s_no) === Number(currentBed))
    if (!exists) form.setValue('visited_bed_id', null)
  }, [beds, form, watchedRoomId])

  useEffect(() => {
    if (!watchedStateId) {
      form.setValue('city_id', null)
      return
    }
    const currentCity = form.getValues('city_id')
    if (!currentCity) return
    const exists = cities.some((c) => Number(c.s_no) === Number(currentCity))
    if (!exists) form.setValue('city_id', null)
  }, [cities, form, watchedStateId])

  const roomOptions = useMemo(
    () => [{ label: 'None', value: '' }, ...rooms.map((r) => ({ label: `Room ${r.room_no}`, value: String(r.s_no), searchText: String(r.room_no) }))],
    [rooms]
  )

  const bedOptions = useMemo(
    () => [{ label: 'None', value: '' }, ...beds.map((b) => ({ label: `Bed ${b.bed_no}`, value: String(b.s_no), searchText: String(b.bed_no) }))],
    [beds]
  )

  const stateOptions = useMemo(
    () => [{ label: 'None', value: '' }, ...states.map((s) => ({ label: String(s.name ?? s.iso_code ?? s.s_no), value: String(s.s_no), searchText: String(s.name ?? s.iso_code) }))],
    [states]
  )

  const cityOptions = useMemo(
    () => [{ label: 'None', value: '' }, ...cities.map((c) => ({ label: String(c.name ?? c.s_no), value: String(c.s_no), searchText: String(c.name ?? c.s_no) }))],
    [cities]
  )

  const busy = creating || updating

  const fetchErrorMessage =
    (visitorError as ErrorLike | undefined)?.data?.message || (visitorError as ErrorLike | undefined)?.message

  const onSubmit = async (values: FormValues) => {
    if (!selectedPGLocationId) {
      showErrorAlert('Please select a PG location first', 'Error')
      return
    }

    try {
      const payload: CreateVisitorDto = {
        visitor_name: values.visitor_name.trim(),
        phone_no: values.phone_no.trim(),
        purpose: values.purpose?.trim() ? values.purpose.trim() : undefined,
        visited_date: values.visited_date?.trim() ? values.visited_date : undefined,
        visited_room_id: values.visited_room_id ?? undefined,
        visited_bed_id: values.visited_bed_id ?? undefined,
        state_id: values.state_id ?? undefined,
        city_id: values.city_id ?? undefined,
        remarks: values.remarks?.trim() ? values.remarks.trim() : undefined,
        convertedTo_tenant: Boolean(values.convertedTo_tenant),
      }

      if (isEditMode && visitorId) {
        await updateVisitor({ id: visitorId, data: payload }).unwrap()
        showSuccessAlert('Visitor updated successfully')
        navigate(`/visitors/${visitorId}`)
      } else {
        await createVisitor(payload).unwrap()
        showSuccessAlert('Visitor created successfully')
        navigate('/visitors')
      }
    } catch (e: unknown) {
      showErrorAlert(e, 'Save Error')
    }
  }

  return (
    <div className='container mx-auto max-w-4xl px-3 py-6'>
      <PageHeader
        title={isEditMode ? 'Edit Visitor' : 'Add Visitor'}
        subtitle='Visitor details'
        right={
          <>
            <Button asChild variant='outline' size='sm'>
              <Link to='/visitors'>
                <ChevronLeft className='me-1 size-4' />
                Back
              </Link>
            </Button>
            {isEditMode && visitorId ? <Badge variant='outline'>#{visitorId}</Badge> : null}
          </>
        }
      />

      {fetchErrorMessage ? (
        <div className='mt-4'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load visitor</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>Select a PG Location</div>
          <div className='mt-1 text-xs text-muted-foreground'>Choose a PG from the top bar to manage visitors.</div>
        </div>
      ) : isEditMode && loadingVisitor ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>Loading...</div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='mt-4 grid gap-4'>
            <Card>
              <CardContent className='grid gap-4 p-4'>
                <div className='text-sm font-semibold'>Basic Information</div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormTextInput control={form.control} name='visitor_name' label='Visitor Name' required placeholder='Enter visitor name' disabled={busy} />
                  <FormTextInput control={form.control} name='phone_no' label='Phone Number' required placeholder='Enter phone number' disabled={busy} />
                </div>

                <div className='grid gap-2'>
                  <div className='text-sm font-medium'>Visit Date</div>
                  <Input
                    type='date'
                    value={watchedVisitedDate || ''}
                    onChange={(e) => form.setValue('visited_date', e.target.value, { shouldDirty: true, shouldValidate: true })}
                    disabled={busy}
                  />
                </div>

                <FormTextInput control={form.control} name='purpose' label='Purpose (Optional)' placeholder='Room Inquiry / Meeting ...' disabled={busy} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className='grid gap-4 p-4'>
                <div className='text-sm font-semibold'>Room & Bed (Optional)</div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormSelectField
                    control={form.control}
                    name='visited_room_id'
                    label='Room'
                    placeholder='Select room'
                    options={roomOptions}
                    parse={(v) => {
                      const n = v ? Number(v) : NaN
                      return Number.isFinite(n) ? n : null
                    }}
                    searchable
                    disabled={busy}
                  />

                  <FormSelectField
                    control={form.control}
                    name='visited_bed_id'
                    label='Bed'
                    placeholder={bedsLoading ? 'Loading beds...' : 'Select bed'}
                    options={bedOptions}
                    parse={(v) => {
                      const n = v ? Number(v) : NaN
                      return Number.isFinite(n) ? n : null
                    }}
                    searchable
                    disabled={busy || !watchedRoomId}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='grid gap-4 p-4'>
                <div className='text-sm font-semibold'>Location (Optional)</div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormSelectField
                    control={form.control}
                    name='state_id'
                    label='State'
                    placeholder='Select state'
                    options={stateOptions}
                    parse={(v) => {
                      const n = v ? Number(v) : NaN
                      return Number.isFinite(n) ? n : null
                    }}
                    searchable
                    disabled={busy}
                    onValueChange={() => {
                      form.setValue('city_id', null, { shouldDirty: true, shouldValidate: false })
                      form.clearErrors('city_id')
                    }}
                  />

                  <FormSelectField
                    control={form.control}
                    name='city_id'
                    label='City'
                    placeholder='Select city'
                    options={cityOptions}
                    parse={(v) => {
                      const n = v ? Number(v) : NaN
                      return Number.isFinite(n) ? n : null
                    }}
                    searchable
                    disabled={busy || !stateCode}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='grid gap-4 p-4'>
                <div className='text-sm font-semibold'>Other</div>

                <FormTextarea control={form.control} name='remarks' label='Remarks (Optional)' placeholder='Any notes...' />

                <button
                  type='button'
                  className='rounded-md border px-3 py-2 text-left text-sm'
                  onClick={() => form.setValue('convertedTo_tenant', !form.getValues('convertedTo_tenant'), { shouldDirty: true })}
                  disabled={busy}
                >
                  <div className='font-semibold'>Converted to Tenant</div>
                  <div className='text-xs text-muted-foreground'>{watchedConverted ? 'Yes' : 'No'}</div>
                </button>
              </CardContent>
            </Card>

            <div className='flex items-center justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => navigate('/visitors')} disabled={busy}>
                Cancel
              </Button>
              <Button type='submit' disabled={busy}>
                <Save className='me-2 size-4' />
                {busy ? 'Saving...' : isEditMode ? 'Update Visitor' : 'Create Visitor'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
