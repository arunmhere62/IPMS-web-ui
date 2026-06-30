import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useSendSignupOtpMutation,
  useVerifySignupOtpMutation,
} from '@/services/authApi'
import {
  useGetCitiesQuery,
  useGetStatesQuery,
  type City,
  type State,
} from '@/services/locationApi'
import {
  useGetAllBedsQuery,
  useGetAllRoomsQuery,
  useGetBedByIdQuery,
  type Bed,
  type Room,
} from '@/services/roomsApi'
import {
  useCreateTenantMutation,
  useGetTenantByIdQuery,
  useUpdateTenantMutation,
  type CreateTenantDto,
  type ProofDocument,
  type Tenant,
} from '@/services/tenantsApi'
import { useAppSelector } from '@/store/hooks'
import { CheckCircle2, CircleAlert, Loader2, Save } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/form/date-picker'
import {
  FormSelectField,
  FormTextInput,
  FormTextarea,
} from '@/components/form/form-fields'
import { ImageUploadS3 } from '@/components/form/image-upload-s3'
import { PageHeader } from '@/components/form/page-header'
import { PhoneInput } from '@/components/form/phone-input'

const toDigitsOnly = (value: string) => (value || '').replace(/\D/g, '')

const stripCountryCode = (value: string): string => {
  const s = (value || '').trim()
  if (!s.startsWith('+')) return s
  // Strip leading country code (1-4 digits after +), keep last 10
  const digits = s.replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

const withCountryCode = (countryCode: string, localNumber: string): string => {
  const digits = toDigitsOnly(localNumber)
  if (!digits) return ''
  const code = countryCode.startsWith('+') ? countryCode : `+${countryCode}`
  return `${code}${digits}`
}

const parseLocalDate = (dateStr: string): Date | undefined => {
  if (!dateStr) return undefined
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  const [y, m, d] = clean.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone_no: z
    .string()
    .min(1, 'Phone number is required')
    .refine(
      (v) =>
        /^\d{10}$/.test(
          toDigitsOnly(v.startsWith('+') ? stripCountryCode(v) : v)
        ),
      'Phone number must be exactly 10 digits'
    ),
  whatsapp_number: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) =>
        !v ||
        /^\d{10}$/.test(
          toDigitsOnly(v.startsWith('+') ? stripCountryCode(v) : v)
        ),
      'WhatsApp number must be exactly 10 digits'
    ),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  occupation: z.string().optional().or(z.literal('')),
  tenant_address: z.string().optional().or(z.literal('')),
  room_id: z.number().min(1, 'Room is required'),
  bed_id: z.number().min(1, 'Bed is required'),
  check_in_date: z.string().min(1, 'Check-in date is required'),
  state_id: z.number().optional().nullable(),
  city_id: z.number().optional().nullable(),
  images: z.array(z.string()).optional(),
  proof_documents: z
    .array(
      z.object({
        document_type: z.string(),
        document_url: z.string(),
      })
    )
    .optional(),
})

type FormValues = z.infer<typeof schema>

const asArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : []

const coerceDateString = (value: unknown) => {
  const s = String(value ?? '')
  if (!s) return ''
  return s.includes('T') ? s.split('T')[0] : s
}

const coerceStringArray = (value: unknown): string[] => {
  if (Array.isArray(value))
    return value.filter((v) => typeof v === 'string') as string[]
  return []
}

const coerceProofDocuments = (value: unknown): ProofDocument[] => {
  if (Array.isArray(value)) {
    // Handle both string[] (old format) and ProofDocument[] (new format)
    return value.map((v) => {
      if (typeof v === 'string') {
        // Legacy format: just a URL string
        return { document_type: 'document', document_url: v }
      }
      if (v && typeof v === 'object' && 'document_url' in v) {
        return v as ProofDocument
      }
      return { document_type: 'document', document_url: String(v) }
    })
  }
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
  const [searchParams] = useSearchParams()

  // Phone OTP verification state
  const [phoneVerifiedFor, setPhoneVerifiedFor] = useState<string | null>(null)
  const [phoneSkipped, setPhoneSkipped] = useState(false)
  const [showOtpDialog, setShowOtpDialog] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpPhone, setOtpPhone] = useState('')
  const [sendSignupOtp, { isLoading: sendingOtp }] = useSendSignupOtpMutation()
  const [verifySignupOtp, { isLoading: verifyingOtp }] =
    useVerifySignupOtpMutation()
  const [resendCooldown, setResendCooldown] = useState(0)
  const tenantId = params.id ? Number(params.id) : null
  const isEditMode = Number.isFinite(tenantId) && Number(tenantId) > 0

  // Get pre-selected room and bed from URL parameters (from bed details)
  const preSelectedRoomId = searchParams.get('roomId')
    ? Number(searchParams.get('roomId'))
    : null
  const preSelectedBedId = searchParams.get('bedId')
    ? Number(searchParams.get('bedId'))
    : null

  // Fetch bed details when only bedId is passed to get room_id
  const { data: bedResponse } = useGetBedByIdQuery(
    preSelectedBedId && !preSelectedRoomId ? preSelectedBedId : 0,
    { skip: !preSelectedBedId || !!preSelectedRoomId || isEditMode }
  )
  const bedDetails = bedResponse?.data ?? null
  const bedRoomId = bedDetails?.room_id ?? null
  const isPreSelected = Boolean(
    (preSelectedRoomId || bedRoomId) && preSelectedBedId
  )

  const selectedPGLocationId = useAppSelector(
    (s) => s.pgLocations.selectedPGLocationId
  )

  const {
    data: tenantResponse,
    isLoading: tenantLoading,
    error: tenantError,
  } = useGetTenantByIdQuery(tenantId ?? 0, { skip: !isEditMode })

  const tenant: Tenant | null = tenantResponse?.data ?? null

  const lockTenancyFacts =
    isEditMode &&
    !!tenant &&
    ((Array.isArray(
      (tenant as unknown as Record<string, unknown[]>).rent_payments
    ) &&
      ((tenant as unknown as Record<string, unknown[]>).rent_payments?.length ??
        0) > 0) ||
      (Array.isArray(
        (tenant as unknown as Record<string, unknown[]>).advance_payments
      ) &&
        ((tenant as unknown as Record<string, unknown[]>).advance_payments
          ?.length ?? 0) > 0) ||
      (Array.isArray(
        (tenant as unknown as Record<string, unknown[]>).refund_payments
      ) &&
        ((tenant as unknown as Record<string, unknown[]>).refund_payments
          ?.length ?? 0) > 0) ||
      (Array.isArray(
        (tenant as unknown as Record<string, unknown[]>).current_bills
      ) &&
        ((tenant as unknown as Record<string, unknown[]>).current_bills
          ?.length ?? 0) > 0))

  const [createTenant, { isLoading: creating }] = useCreateTenantMutation()
  const [updateTenant, { isLoading: updating }] = useUpdateTenantMutation()

  const { data: roomsResponse } = useGetAllRoomsQuery(
    selectedPGLocationId ? { limit: 200 } : undefined,
    { skip: !selectedPGLocationId }
  )

  const rooms: Room[] = useMemo(
    () => asArray<Room>(roomsResponse?.data),
    [roomsResponse]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone_no: '',
      whatsapp_number: '',
      email: '',
      occupation: '',
      tenant_address: '',
      room_id: preSelectedRoomId || bedRoomId || 0,
      bed_id: preSelectedBedId || 0,
      check_in_date: '',
      state_id: null,
      city_id: null,
      images: [],
      proof_documents: [],
    },
  })

  const watchedRoomId = useWatch({ control: form.control, name: 'room_id' })
  const watchedStateId = useWatch({ control: form.control, name: 'state_id' })
  const watchedImages = useWatch({ control: form.control, name: 'images' })
  const watchedProofDocuments = useWatch({
    control: form.control,
    name: 'proof_documents',
  })
  const watchedCheckInDate = useWatch({
    control: form.control,
    name: 'check_in_date',
  })

  const selectedDate = useMemo(() => {
    return parseLocalDate(watchedCheckInDate)
  }, [watchedCheckInDate])

  const { data: bedsResponse, isLoading: bedsLoading } = useGetAllBedsQuery(
    watchedRoomId
      ? {
          room_id: watchedRoomId,
          only_unoccupied: !isEditMode && !isPreSelected,
          limit: 500,
        }
      : undefined,
    { skip: !watchedRoomId }
  )

  const beds: Bed[] = useMemo(
    () => asArray<Bed>(bedsResponse?.data),
    [bedsResponse]
  )

  const { data: statesResponse } = useGetStatesQuery({ countryCode: 'IN' })
  const states = useMemo(
    () => asArray<State>(statesResponse?.data),
    [statesResponse]
  )

  const stateCode = useMemo(() => {
    if (!watchedStateId) return ''
    const st = states.find((s) => Number(s?.s_no) === Number(watchedStateId))
    return String(st?.iso_code ?? '')
  }, [states, watchedStateId])

  const { data: citiesResponse } = useGetCitiesQuery(
    { stateCode: stateCode || '' },
    { skip: !stateCode }
  )
  const cities = useMemo(
    () => asArray<City>(citiesResponse?.data),
    [citiesResponse]
  )

  useEffect(() => {
    if (!isEditMode) return
    if (!tenant) return

    const checkInDate = coerceDateString(tenant.check_in_date)
    form.reset({
      name: String(tenant.name ?? ''),
      phone_no: stripCountryCode(String(tenant.phone_no ?? '')),
      whatsapp_number: stripCountryCode(String(tenant.whatsapp_number ?? '')),
      email: String(tenant.email ?? ''),
      occupation: String(tenant.occupation ?? ''),
      tenant_address: String(tenant.tenant_address ?? ''),
      room_id: Number(tenant.room_id ?? 0),
      bed_id: Number(tenant.bed_id ?? 0),
      check_in_date: checkInDate,
      state_id: tenant.state_id ?? null,
      city_id: tenant.city_id ?? null,
      images: coerceStringArray(tenant.images),
      proof_documents: coerceProofDocuments(tenant.proof_documents),
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

  // Ensure pre-selected bed is set when beds data loads
  useEffect(() => {
    if (!isPreSelected || !preSelectedBedId || !beds.length) return

    const currentBedId = form.getValues('bed_id')
    if (currentBedId === preSelectedBedId) return // Already set

    // Check if the pre-selected bed exists in the loaded beds
    const bedExists = beds.some(
      (b) => Number(b.s_no) === Number(preSelectedBedId)
    )
    if (bedExists) {
      form.setValue('bed_id', preSelectedBedId)
    }
  }, [beds, form, isPreSelected, preSelectedBedId])

  const roomOptions = useMemo(
    () =>
      rooms.map((r) => ({
        label: `Room ${r.room_no}`,
        value: String(r.s_no),
        searchText: String(r.room_no),
      })),
    [rooms]
  )

  const bedOptions = useMemo(
    () =>
      beds.map((b) => ({
        label: `Bed ${b.bed_no}`,
        value: String(b.s_no),
        searchText: String(b.bed_no),
      })),
    [beds]
  )

  const stateOptions = useMemo(
    () =>
      states.map((s) => ({
        label: String(s.name ?? s.iso_code ?? s.s_no),
        value: String(s.s_no),
        searchText: String(s.name ?? s.iso_code),
      })),
    [states]
  )

  const cityOptions = useMemo(
    () =>
      cities.map((c) => ({
        label: String(c.name ?? c.s_no),
        value: String(c.s_no),
        searchText: String(c.name ?? c.s_no),
      })),
    [cities]
  )

  // Get current room and bed data for display
  const currentRoom = useMemo(() => {
    const roomId = form.getValues('room_id')
    return rooms.find((r) => Number(r.s_no) === Number(roomId))
  }, [rooms, form])

  const currentBed = useMemo(() => {
    const bedId = form.getValues('bed_id')
    return beds.find((b) => Number(b.s_no) === Number(bedId))
  }, [beds, form])

  const saving = creating || updating

  const watchedPhone = useWatch({ control: form.control, name: 'phone_no' })
  const localPhoneDigits = toDigitsOnly(
    watchedPhone?.startsWith('+')
      ? stripCountryCode(watchedPhone)
      : (watchedPhone ?? '')
  )
  const fullPhoneForOtp =
    localPhoneDigits.length === 10
      ? withCountryCode('+91', localPhoneDigits)
      : ''
  const isPhoneVerified =
    !!phoneVerifiedFor && phoneVerifiedFor === fullPhoneForOtp

  const handleSendOtp = async (isResend = false) => {
    if (!fullPhoneForOtp) return
    try {
      await sendSignupOtp({ phone: fullPhoneForOtp }).unwrap()
      setOtpPhone(fullPhoneForOtp)
      setOtpValue('')
      setOtpError('')
      setShowOtpDialog(true)
      if (isResend) {
        setResendCooldown(30)
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
      showSuccessAlert('OTP sent to ' + fullPhoneForOtp)
    } catch (e: unknown) {
      showErrorAlert(e, 'Failed to send OTP')
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpValue.trim() || otpValue.trim().length !== 4) {
      setOtpError('Please enter a valid 4-digit OTP')
      return
    }
    try {
      await verifySignupOtp({ phone: otpPhone, otp: otpValue.trim() }).unwrap()
      setPhoneVerifiedFor(otpPhone)
      setShowOtpDialog(false)
      setOtpValue('')
      setOtpError('')
      showSuccessAlert('Phone number verified successfully')
    } catch (e: unknown) {
      setOtpError('Invalid OTP. Please try again.')
      showErrorAlert(e, 'Verification failed')
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (!selectedPGLocationId) {
      showErrorAlert('Please select a PG location first', 'Error')
      return
    }

    try {
      const phoneCountryCode = '+91'
      const dto: CreateTenantDto = {
        name: values.name.trim(),
        phone_no: withCountryCode(phoneCountryCode, values.phone_no),
        whatsapp_number: values.whatsapp_number?.trim()
          ? withCountryCode(phoneCountryCode, values.whatsapp_number)
          : undefined,
        email: values.email?.trim() || undefined,
        occupation: values.occupation?.trim() || undefined,
        tenant_address: values.tenant_address?.trim() || undefined,
        pg_id: selectedPGLocationId,
        room_id: values.room_id,
        bed_id: values.bed_id,
        check_in_date: values.check_in_date,
        status: 'ACTIVE',
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

  const fetchErrorMessage =
    (tenantError as ErrorLike | undefined)?.data?.message ||
    (tenantError as ErrorLike | undefined)?.message

  return (
    <div className='container mx-auto max-w-4xl px-3 py-6'>
      <PageHeader
        title={isEditMode ? 'Edit Tenant' : 'Add Tenant'}
        showBack={true}
        subtitle='Tenant details and accommodation'
        right={
          isEditMode && tenantId ? (
            <Badge variant='outline'>#{tenantId}</Badge>
          ) : null
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
          <div className='mt-1 text-xs text-muted-foreground'>
            Choose a PG from the top bar to manage tenants.
          </div>
        </div>
      ) : !isEditMode && !preSelectedBedId && !preSelectedRoomId ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-8 text-center'>
          <div className='text-base font-semibold'>Room and Bed Required</div>
          <div className='mt-1 text-xs text-muted-foreground'>
            Please select a room and bed from the bed details page to add a
            tenant.
          </div>
        </div>
      ) : isEditMode && tenantLoading ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>
          Loading...
        </div>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='mt-4 grid gap-4'
          >
            <Card className='border p-0 shadow-none'>
              <CardContent className='grid gap-4 p-4'>
                <div className='bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-sm font-semibold text-transparent'>
                  Personal Information
                </div>

                <FormTextInput
                  control={form.control}
                  name='name'
                  label='Full Name'
                  required
                  placeholder='Enter full name'
                />

                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-3'>
                    <PhoneInput
                      control={form.control}
                      name='phone_no'
                      label='Phone Number'
                      placeholder='Enter phone number'
                      required
                      defaultCountryCode='+91'
                    />
                    {/* OTP verification section */}
                    {!isEditMode && (
                      <div className='rounded-lg border bg-card p-3'>
                        {isPhoneVerified ? (
                          <div className='flex items-center gap-2 text-sm font-medium text-emerald-600'>
                            <CheckCircle2 className='size-4' />
                            Phone number verified
                          </div>
                        ) : phoneSkipped ? (
                          <div className='space-y-2'>
                            <div className='text-sm text-muted-foreground'>
                              Phone verification skipped
                            </div>
                            {localPhoneDigits.length === 10 && (
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                className='h-7 px-3 text-xs'
                                onClick={() => {
                                  setPhoneSkipped(false)
                                  void handleSendOtp()
                                }}
                                disabled={sendingOtp}
                              >
                                {sendingOtp ? (
                                  <>
                                    <Loader2 className='mr-1 size-3 animate-spin' />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className='mr-1 size-3' />
                                    Verify Now
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        ) : localPhoneDigits.length === 10 ? (
                          <div className='space-y-2'>
                            <div className='text-sm font-medium'>
                              Verify this phone number
                            </div>
                            <div className='flex items-center gap-3'>
                              <Button
                                type='button'
                                variant='default'
                                className='h-8 px-4 text-sm'
                                onClick={() => void handleSendOtp()}
                                disabled={sendingOtp}
                              >
                                {sendingOtp ? (
                                  <>
                                    <Loader2 className='mr-2 size-4 animate-spin' />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className='mr-2 size-4' />
                                    Send OTP
                                  </>
                                )}
                              </Button>
                              <button
                                type='button'
                                className='text-sm text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground'
                                onClick={() => setPhoneSkipped(true)}
                              >
                                Skip verification
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className='text-xs text-muted-foreground'>
                            Enter 10 digits to verify phone number
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <PhoneInput
                    control={form.control}
                    name='whatsapp_number'
                    label='WhatsApp Number'
                    placeholder='Enter WhatsApp number'
                    defaultCountryCode='+91'
                  />
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormTextInput
                    control={form.control}
                    name='email'
                    label='Email'
                    placeholder='name@example.com'
                  />
                  <FormTextInput
                    control={form.control}
                    name='occupation'
                    label='Occupation'
                    placeholder='Occupation (optional)'
                  />
                </div>

                <FormTextarea
                  control={form.control}
                  name='tenant_address'
                  label='Address'
                  placeholder='Address (optional)'
                />
              </CardContent>
            </Card>

            <Card className='border p-0 shadow-none'>
              <CardContent className='grid gap-4 p-4'>
                <div className='bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-sm font-semibold text-transparent'>
                  Accommodation
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  {isEditMode ? (
                    <>
                      <div className='space-y-2'>
                        <label className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                          Room
                        </label>
                        <div className='relative flex items-center'>
                          <div className='pointer-events-none absolute left-3 flex items-center'>
                            <span className='text-sm font-medium text-muted-foreground'>
                              RM
                            </span>
                          </div>
                          <Input
                            value={currentRoom?.room_no || ''}
                            disabled
                            className='bg-muted pl-16'
                            placeholder='Room number'
                          />
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <label className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                          Bed
                        </label>
                        <div className='relative flex items-center'>
                          <div className='pointer-events-none absolute left-3 flex items-center'>
                            <span className='text-sm font-medium text-muted-foreground'>
                              BED
                            </span>
                          </div>
                          <Input
                            value={currentBed?.bed_no || ''}
                            disabled
                            className='bg-muted pl-16'
                            placeholder='Bed number'
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <FormSelectField
                        control={form.control}
                        name='room_id'
                        label='Room'
                        required
                        placeholder='Select room'
                        options={roomOptions}
                        parse={(v) => Number(v)}
                        searchable
                        disabled
                      />

                      <FormSelectField
                        control={form.control}
                        name='bed_id'
                        label='Bed'
                        required
                        placeholder={
                          bedsLoading ? 'Loading beds...' : 'Select bed'
                        }
                        options={bedOptions}
                        parse={(v) => Number(v)}
                        searchable
                        disabled={!watchedRoomId || isPreSelected}
                      />
                    </>
                  )}
                </div>

                {lockTenancyFacts && (
                  <div className='rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300'>
                    <strong>Note:</strong> Once rent is generated or any payment
                    exists, Check-in date, Room, and Bed cannot be changed.
                  </div>
                )}
                {!lockTenancyFacts && isPreSelected && (
                  <div className='rounded-md bg-muted/30 p-3 text-xs text-muted-foreground'>
                    <strong>Note:</strong> Room and bed are pre-selected from
                    the bed details page.
                  </div>
                )}

                <div className='grid gap-2'>
                  <div className='flex items-center justify-between'>
                    <div className='text-sm font-medium'>
                      Check-in Date <span className='text-destructive'>*</span>
                    </div>
                    {!lockTenancyFacts && !isEditMode && (
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => {
                          const today = new Date()
                          const y = today.getFullYear()
                          const m = String(today.getMonth() + 1).padStart(
                            2,
                            '0'
                          )
                          const d = String(today.getDate()).padStart(2, '0')
                          form.setValue('check_in_date', `${y}-${m}-${d}`, {
                            shouldValidate: true,
                          })
                        }}
                      >
                        Today
                      </Button>
                    )}
                  </div>
                  <DatePicker
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (!date) {
                        form.setValue('check_in_date', '')
                        return
                      }
                      const y = date.getFullYear()
                      const m = String(date.getMonth() + 1).padStart(2, '0')
                      const d = String(date.getDate()).padStart(2, '0')
                      form.setValue('check_in_date', `${y}-${m}-${d}`, {
                        shouldValidate: true,
                      })
                    }}
                    placeholder='Pick a date'
                    disabled={lockTenancyFacts}
                  />
                  {form.formState.errors.check_in_date?.message ? (
                    <div className='text-xs text-destructive'>
                      {String(form.formState.errors.check_in_date.message)}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className='border p-0 shadow-none'>
              <CardContent className='grid gap-4 p-4'>
                <div className='bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-sm font-semibold text-transparent'>
                  Location
                </div>

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

            <Card className='border p-0 shadow-none'>
              <CardContent className='grid gap-4 p-4'>
                <div className='bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-sm font-semibold text-transparent'>
                  Uploads
                </div>

                <ImageUploadS3
                  images={Array.isArray(watchedImages) ? watchedImages : []}
                  onImagesChange={(imgs) => form.setValue('images', imgs)}
                  maxImages={1}
                  label='Tenant Image'
                  folder='tenants/images'
                  useS3={true}
                  entityId={
                    isEditMode && tenantId ? String(tenantId) : undefined
                  }
                  autoSave={false}
                />

                <ImageUploadS3
                  images={
                    Array.isArray(watchedProofDocuments)
                      ? watchedProofDocuments.map((doc) => doc.document_url)
                      : []
                  }
                  onImagesChange={(imgs) =>
                    form.setValue(
                      'proof_documents',
                      imgs.map((url) => ({
                        document_type: 'document',
                        document_url: url,
                      }))
                    )
                  }
                  maxImages={3}
                  label='Proof Documents'
                  folder='tenants/documents'
                  useS3={true}
                  entityId={
                    isEditMode && tenantId ? String(tenantId) : undefined
                  }
                  autoSave={false}
                />
              </CardContent>
            </Card>

            {/* OTP Dialog */}
            <Dialog
              open={showOtpDialog}
              onOpenChange={(open) => {
                if (!open) {
                  setShowOtpDialog(false)
                  setOtpValue('')
                  setOtpError('')
                  setResendCooldown(0)
                }
              }}
            >
              <DialogContent className='sm:max-w-md'>
                <DialogHeader className='text-center'>
                  <DialogTitle className='text-lg'>
                    Verify Phone Number
                  </DialogTitle>
                  <DialogDescription className='text-sm'>
                    Enter the 4-digit OTP sent to <br />
                    <strong className='text-base text-foreground'>
                      {otpPhone}
                    </strong>
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='relative'>
                    <Input
                      value={otpValue}
                      onChange={(e) => {
                        setOtpValue(
                          e.target.value.replace(/\D/g, '').slice(0, 4)
                        )
                        setOtpError('')
                      }}
                      placeholder='----'
                      inputMode='numeric'
                      maxLength={4}
                      className='h-12 border-2 text-center font-mono text-2xl tracking-[0.8em]'
                      autoFocus
                    />
                    {otpError && (
                      <p className='mt-2 text-center text-sm text-destructive'>
                        {otpError}
                      </p>
                    )}
                  </div>
                </div>
                <div className='flex flex-col items-center gap-2 pt-2'>
                  <div className='text-center text-sm text-muted-foreground'>
                    Didn't receive OTP?{' '}
                    <button
                      type='button'
                      className='text-sm font-medium text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground'
                      onClick={() => void handleSendOtp(true)}
                      disabled={sendingOtp || resendCooldown > 0}
                    >
                      {sendingOtp
                        ? 'Sending...'
                        : resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : 'Resend'}
                    </button>
                  </div>
                </div>
                <DialogFooter className='gap-3 sm:gap-3'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      setShowOtpDialog(false)
                      setOtpValue('')
                      setOtpError('')
                      setResendCooldown(0)
                    }}
                    className='h-10 flex-1'
                  >
                    Cancel
                  </Button>
                  <Button
                    type='button'
                    onClick={() => void handleVerifyOtp()}
                    disabled={verifyingOtp || otpValue.length !== 4}
                    className='h-10 flex-1'
                  >
                    {verifyingOtp ? (
                      <>
                        <Loader2 className='mr-2 size-4 animate-spin' />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className='mr-2 size-4' />
                        Verify OTP
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className='flex items-center justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => navigate('/tenants')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={saving}>
                <Save className='me-2 size-4' />
                {saving
                  ? 'Saving...'
                  : isEditMode
                    ? 'Update Tenant'
                    : 'Create Tenant'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
