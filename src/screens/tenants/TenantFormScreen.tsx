import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { ChevronLeft, CircleAlert, Save } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { PageHeader } from '@/components/form/page-header'
import { FormSelectField, FormTextInput, FormTextarea } from '@/components/form/form-fields'
import { ImageUploadS3 } from '@/components/form/image-upload-s3'

import { useGetCitiesQuery, useGetStatesQuery, type City, type State } from '@/services/locationApi'
import { useGetAllBedsQuery, useGetAllRoomsQuery, type Bed, type Room } from '@/services/roomsApi'
import {
  useCreateTenantMutation,
  useGetTenantByIdQuery,
  useUpdateTenantMutation,
  type CreateTenantDto,
  type Tenant,
  type TenantResponse,
} from '@/services/tenantsApi'
import { useAppSelector } from '@/store/hooks'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone_no: z.string().optional().or(z.literal('')),
  whatsapp_number: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  occupation: z.string().optional().or(z.literal('')),
  tenant_address: z.string().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'CHECKED_OUT']).optional(),
  room_id: z.number().min(1, 'Room is required'),
  bed_id: z.number().min(1, 'Bed is required'),
  check_in_date: z.string().min(1, 'Check-in date is required'),
  state_id: z.number().optional().nullable(),
  city_id: z.number().optional().nullable(),
  images: z.array(z.string()).optional(),
  proof_documents: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof schema>

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

const coerceDateString = (value: unknown) => {
  const s = String(value ?? '')
  if (!s) return ''
  return s.includes('T') ? s.split('T')[0] : s
}

const coerceStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string') as string[]
  return []
}

type ErrorLike = {
  data?: {
    message?: string
  }
  message?: string
}

export function TenantFormScreen() {
  const navigate = useNavigate()
  const params = useParams()
  const tenantId = params.id ? Number(params.id) : null
  const isEditMode = Number.isFinite(tenantId) && Number(tenantId) > 0

  const selectedPGLocationId = useAppSelector((s) => s.pgLocations.selectedPGLocationId)

  const {
    data: tenantResponse,
    isLoading: tenantLoading,
    error: tenantError,
  } = useGetTenantByIdQuery(tenantId ?? 0, { skip: !isEditMode })

  const tenant: Tenant | null = (tenantResponse as TenantResponse | undefined)?.data ?? null

  const [createTenant, { isLoading: creating }] = useCreateTenantMutation()
  const [updateTenant, { isLoading: updating }] = useUpdateTenantMutation()

  const { data: roomsResponse } = useGetAllRoomsQuery(
    selectedPGLocationId ? { pg_id: selectedPGLocationId, limit: 200 } : undefined,
    { skip: !selectedPGLocationId }
  )

  const rooms: Room[] = useMemo(() => asArray<Room>((roomsResponse as { data?: unknown } | undefined)?.data), [roomsResponse])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone_no: '',
      whatsapp_number: '',
      email: '',
      occupation: '',
      tenant_address: '',
      status: 'ACTIVE',
      room_id: 0,
      bed_id: 0,
      check_in_date: new Date().toISOString().split('T')[0],
      state_id: null,
      city_id: null,
      images: [],
      proof_documents: [],
    },
  })

  const watchedRoomId = useWatch({ control: form.control, name: 'room_id' })
  const watchedStateId = useWatch({ control: form.control, name: 'state_id' })
  const watchedImages = useWatch({ control: form.control, name: 'images' })
  const watchedProofDocuments = useWatch({ control: form.control, name: 'proof_documents' })

  const { data: bedsResponse, isLoading: bedsLoading } = useGetAllBedsQuery(
    watchedRoomId ? { room_id: watchedRoomId, only_unoccupied: !isEditMode, limit: 500 } : undefined,
    { skip: !watchedRoomId }
  )

  const beds: Bed[] = useMemo(() => asArray<Bed>((bedsResponse as { data?: unknown } | undefined)?.data), [bedsResponse])

  const { data: statesResponse } = useGetStatesQuery(undefined)
  const states = useMemo(() => asArray<State>((statesResponse as { data?: unknown } | undefined)?.data), [statesResponse])

  const stateCode = useMemo(() => {
    if (!watchedStateId) return ''
    const st = states.find((s) => Number(s?.s_no) === Number(watchedStateId))
    return String(st?.iso_code ?? '')
  }, [states, watchedStateId])

  const { data: citiesResponse } = useGetCitiesQuery(
    { stateCode: stateCode || '' },
    { skip: !stateCode }
  )
  const cities = useMemo(() => asArray<City>((citiesResponse as { data?: unknown } | undefined)?.data), [citiesResponse])

  useEffect(() => {
    if (!isEditMode) return
    if (!tenant) return

    form.reset({
      name: String(tenant.name ?? ''),
      phone_no: String(tenant.phone_no ?? ''),
      whatsapp_number: String(tenant.whatsapp_number ?? ''),
      email: String(tenant.email ?? ''),
      occupation: String(tenant.occupation ?? ''),
      tenant_address: String(tenant.tenant_address ?? ''),
      status: (tenant.status ?? 'ACTIVE') as FormValues['status'],
      room_id: Number(tenant.room_id ?? 0),
      bed_id: Number(tenant.bed_id ?? 0),
      check_in_date: coerceDateString(tenant.check_in_date),
      state_id: tenant.state_id ?? null,
      city_id: tenant.city_id ?? null,
      images: coerceStringArray(tenant.images),
      proof_documents: coerceStringArray(tenant.proof_documents),
    })
  }, [form, isEditMode, tenant])

  useEffect(() => {
    if (!watchedRoomId) return
    const currentBed = form.getValues('bed_id')
    if (!currentBed) return
    const exists = beds.some((b) => Number(b.s_no) === Number(currentBed))
    if (!exists) form.setValue('bed_id', 0)
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
    () => rooms.map((r) => ({ label: `Room ${r.room_no}`, value: String(r.s_no), searchText: String(r.room_no) })),
    [rooms]
  )

  const bedOptions = useMemo(
    () => beds.map((b) => ({ label: `Bed ${b.bed_no}`, value: String(b.s_no), searchText: String(b.bed_no) })),
    [beds]
  )

  const stateOptions = useMemo(
    () => states.map((s) => ({ label: String(s.name ?? s.iso_code ?? s.s_no), value: String(s.s_no), searchText: String(s.name ?? s.iso_code) })),
    [states]
  )

  const cityOptions = useMemo(
    () => cities.map((c) => ({ label: String(c.name ?? c.s_no), value: String(c.s_no), searchText: String(c.name ?? c.s_no) })),
    [cities]
  )

  const saving = creating || updating

  const onSubmit = async (values: FormValues) => {
    if (!selectedPGLocationId) {
      showErrorAlert('Please select a PG location first', 'Error')
      return
    }

    try {
      const dto: CreateTenantDto = {
        name: values.name.trim(),
        phone_no: values.phone_no?.trim() || undefined,
        whatsapp_number: values.whatsapp_number?.trim() || undefined,
        email: values.email?.trim() || undefined,
        occupation: values.occupation?.trim() || undefined,
        tenant_address: values.tenant_address?.trim() || undefined,
        pg_id: selectedPGLocationId,
        room_id: values.room_id,
        bed_id: values.bed_id,
        check_in_date: values.check_in_date,
        status: values.status,
        state_id: values.state_id ?? undefined,
        city_id: values.city_id ?? undefined,
        images: values.images ?? [],
        proof_documents: values.proof_documents ?? [],
      }

      if (isEditMode && tenantId) {
        await updateTenant({ id: tenantId, data: dto }).unwrap()
        showSuccessAlert('Tenant updated successfully')
        navigate(`/tenants/${tenantId}`)
      } else {
        await createTenant(dto).unwrap()
        showSuccessAlert('Tenant created successfully')
        navigate('/tenants')
      }
    } catch (e: unknown) {
      showErrorAlert(e, 'Save Error')
    }
  }

  const fetchErrorMessage = (tenantError as ErrorLike | undefined)?.data?.message || (tenantError as ErrorLike | undefined)?.message

  return (
    <div className='container mx-auto max-w-4xl px-3 py-6'>
      <PageHeader
        title={isEditMode ? 'Edit Tenant' : 'Add Tenant'}
        subtitle='Tenant details and accommodation'
        right={
          <>
            <Button asChild variant='outline' size='sm'>
              <Link to='/tenants'>
                <ChevronLeft className='me-1 size-4' />
                Back
              </Link>
            </Button>
            {isEditMode && tenantId ? <Badge variant='outline'>#{tenantId}</Badge> : null}
          </>
        }
      />

      {fetchErrorMessage ? (
        <div className='mt-4'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load tenant</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>Select a PG Location</div>
          <div className='mt-1 text-xs text-muted-foreground'>Choose a PG from the top bar to manage tenants.</div>
        </div>
      ) : isEditMode && tenantLoading ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>Loading...</div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='mt-4 grid gap-4'>
            <Card>
              <CardContent className='grid gap-4 p-4'>
                <div className='text-sm font-semibold'>Personal Information</div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormTextInput control={form.control} name='name' label='Full Name' required placeholder='Enter full name' />
                  <FormSelectField
                    control={form.control}
                    name='status'
                    label='Status'
                    placeholder='Select status'
                    options={[
                      { label: 'Active', value: 'ACTIVE' },
                      { label: 'Inactive', value: 'INACTIVE' },
                      { label: 'Checked Out', value: 'CHECKED_OUT' },
                    ]}
                    parse={(v) => v as FormValues['status']}
                  />
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormTextInput control={form.control} name='phone_no' label='Phone Number' placeholder='Enter phone number' />
                  <FormTextInput control={form.control} name='whatsapp_number' label='WhatsApp Number' placeholder='Enter WhatsApp number' />
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormTextInput control={form.control} name='email' label='Email' placeholder='name@example.com' />
                  <FormTextInput control={form.control} name='occupation' label='Occupation' placeholder='Occupation (optional)' />
                </div>

                <FormTextarea control={form.control} name='tenant_address' label='Address' placeholder='Address (optional)' />
              </CardContent>
            </Card>

            <Card>
              <CardContent className='grid gap-4 p-4'>
                <div className='text-sm font-semibold'>Accommodation</div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormSelectField
                    control={form.control}
                    name='room_id'
                    label='Room'
                    required
                    placeholder='Select room'
                    options={roomOptions}
                    parse={(v) => Number(v)}
                    searchable
                  />

                  <FormSelectField
                    control={form.control}
                    name='bed_id'
                    label='Bed'
                    required
                    placeholder={bedsLoading ? 'Loading beds...' : 'Select bed'}
                    options={bedOptions}
                    parse={(v) => Number(v)}
                    searchable
                    disabled={!watchedRoomId}
                  />
                </div>

                <div className='grid gap-2'>
                  <div className='text-sm font-medium'>Check-in Date</div>
                  <Controller
                    control={form.control}
                    name='check_in_date'
                    render={({ field }) => (
                      <Input type='date' value={field.value || ''} onChange={(e) => field.onChange(e.target.value)} />
                    )}
                  />
                  {form.formState.errors.check_in_date?.message ? (
                    <div className='text-xs text-destructive'>{String(form.formState.errors.check_in_date.message)}</div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='grid gap-4 p-4'>
                <div className='text-sm font-semibold'>Location</div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormSelectField
                    control={form.control}
                    name='state_id'
                    label='State'
                    placeholder='Select state'
                    options={stateOptions}
                    parse={(v) => (v ? Number(v) : null)}
                    searchable
                  />

                  <FormSelectField
                    control={form.control}
                    name='city_id'
                    label='City'
                    placeholder='Select city'
                    options={cityOptions}
                    parse={(v) => (v ? Number(v) : null)}
                    searchable
                    disabled={!stateCode}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='grid gap-4 p-4'>
                <div className='text-sm font-semibold'>Uploads</div>

                <ImageUploadS3
                  images={Array.isArray(watchedImages) ? watchedImages : []}
                  onImagesChange={(imgs) => form.setValue('images', imgs)}
                  maxImages={1}
                  label='Tenant Image'
                  folder='tenants/images'
                  useS3={true}
                  entityId={isEditMode && tenantId ? String(tenantId) : undefined}
                  autoSave={false}
                />

                <ImageUploadS3
                  images={Array.isArray(watchedProofDocuments) ? watchedProofDocuments : []}
                  onImagesChange={(imgs) => form.setValue('proof_documents', imgs)}
                  maxImages={3}
                  label='Proof Documents'
                  folder='tenants/documents'
                  useS3={true}
                  entityId={isEditMode && tenantId ? String(tenantId) : undefined}
                  autoSave={false}
                />
              </CardContent>
            </Card>

            <div className='flex items-center justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => navigate('/tenants')} disabled={saving}>
                Cancel
              </Button>
              <Button type='submit' disabled={saving}>
                <Save className='me-2 size-4' />
                {saving ? 'Saving...' : isEditMode ? 'Update Tenant' : 'Create Tenant'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
