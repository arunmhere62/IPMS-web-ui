import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { showErrorToast, showSuccessToast } from '@/utils/toast'

import {
  useSendSignupOtpMutation,
  useVerifySignupOtpMutation,
  useSignupMutation,
} from '@/services/authApi'

import {
  type RequiredLegalDocument,
  type RequiredLegalDocumentsStatusResponse,
  useAcceptLegalDocumentMutation,
  useLazyGetRequiredLegalDocumentsStatusQuery,
} from '@/services/legalDocumentsApi'

const schema = z.object({
  organizationName: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().min(10, 'Phone number is required'),
  pgName: z.string().optional(),
  rentCycleType: z.enum(['CALENDAR', 'MIDMONTH']).optional(),
  rentCycleStart: z.number().nullable().optional(),
  rentCycleEnd: z.number().nullable().optional(),
})

type FormValues = z.infer<typeof schema>

export function SignupScreen() {
  const navigate = useNavigate()

  const [otp, setOtp] = useState('')
  const [fullPhone, setFullPhone] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [hasAgreedToLegal, setHasAgreedToLegal] = useState(false)
  const [requiredLegalDocs, setRequiredLegalDocs] = useState<RequiredLegalDocument[]>([])

  const [sendSignupOtp, { isLoading: sending }] = useSendSignupOtpMutation()
  const [verifySignupOtp, { isLoading: verifying }] = useVerifySignupOtpMutation()
  const [signup, { isLoading: signingUp }] = useSignupMutation()
  const [getRequiredLegalStatus] = useLazyGetRequiredLegalDocumentsStatusQuery()
  const [acceptLegalDocument] = useAcceptLegalDocumentMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationName: '',
      name: '',
      phone: '',
      pgName: '',
      rentCycleType: 'CALENDAR',
      rentCycleStart: 1,
      rentCycleEnd: 30,
    },
  })

  const loadLegalDocs = useCallback(async () => {
    try {
      const status =
        (await getRequiredLegalStatus({ context: 'SIGNUP' }).unwrap()) as RequiredLegalDocumentsStatusResponse

      const pending = status?.pending ?? []
      setRequiredLegalDocs(Array.isArray(pending) ? pending : [])
    } catch {
      setRequiredLegalDocs([])
    }
  }, [getRequiredLegalStatus])

  useEffect(() => {
    void loadLegalDocs()
  }, [loadLegalDocs])

  const findLegalDocUrl = (types: string | string[]) => {
    const candidates = (Array.isArray(types) ? types : [types])
      .map((t) => String(t || '').toUpperCase())
      .filter(Boolean)

    const doc = (requiredLegalDocs || []).find((d) => {
      const dt = String((d as RequiredLegalDocument & { type?: string })?.type || '').toUpperCase()
      return candidates.includes(dt)
    })

    return doc?.url || doc?.content_url
  }

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '')
    if (!cleaned) {
      showErrorToast('Phone number is required')
      return null
    }
    if (cleaned.length !== 10) {
      showErrorToast('Please enter valid 10-digit phone number')
      return null
    }
    return cleaned
  }

  const onSendOtp = async () => {
    const rawPhone = String(form.getValues('phone') ?? '')
    const cleaned = validatePhone(rawPhone)
    if (!cleaned) return

    const normalized = `+91${cleaned}`

    try {
      await sendSignupOtp({ phone: normalized }).unwrap()
      setFullPhone(normalized)
      setOtpSent(true)
      showSuccessToast('OTP sent')
    } catch (e: unknown) {
      showErrorToast(e, 'Failed to send OTP')
    }
  }

  const onVerifyOtp = async () => {
    if (!otp.trim()) {
      showErrorToast('OTP is required')
      return
    }

    if (otp.trim().length !== 4) {
      showErrorToast('Please enter valid 4-digit OTP')
      return
    }

    try {
      await verifySignupOtp({ phone: fullPhone, otp: otp.trim() }).unwrap()
      setPhoneVerified(true)
      setOtp('')
      setOtpSent(false)
      showSuccessToast('Phone number verified')
    } catch (e: unknown) {
      showErrorToast(e, 'Failed to verify OTP')
    }
  }

  const onSignup = async () => {
    const values = form.getValues()

    if (!phoneVerified) {
      showErrorToast('Please verify your phone number first')
      return
    }

    const pgName = String(values.pgName ?? '').trim()
    const name = String(values.name ?? '').trim()
    const rentCycleType = values.rentCycleType || 'CALENDAR'
    const rentCycleStart = values.rentCycleStart ?? 1
    const rentCycleEnd = values.rentCycleEnd ?? 30

    if (!pgName) {
      form.setError('pgName', { type: 'manual', message: 'PG name is required' })
      showErrorToast('Please enter PG name')
      return
    }

    if (!name) {
      form.setError('name', { type: 'manual', message: 'Name is required' })
      showErrorToast('Please enter your name')
      return
    }

    if (rentCycleType === 'CALENDAR' && (!rentCycleEnd || !Number.isFinite(Number(rentCycleEnd)))) {
      form.setError('rentCycleEnd', { type: 'manual', message: 'Rent cycle end day is required' })
      showErrorToast('Please enter rent cycle end day')
      return
    }

    if (!hasAgreedToLegal) {
      showErrorToast('Please agree to the Terms & Conditions and Privacy Policy')
      return
    }

    try {
      const signupData = {
        organizationName: pgName,
        name,
        pgName,
        phone: fullPhone,
        rentCycleType,
        rentCycleStart,
        rentCycleEnd,
      }

      const status =
        (await getRequiredLegalStatus({ context: 'SIGNUP' }).unwrap()) as RequiredLegalDocumentsStatusResponse
      const docsToAccept = (status?.required ?? status?.pending ?? []) as RequiredLegalDocument[]

      const signupResult = (await signup(signupData).unwrap()) as unknown
      const signupObj = (signupResult && typeof signupResult === 'object') ? (signupResult as Record<string, unknown>) : {}
      const rawUserId = signupObj.userId ?? signupObj.user_id ?? signupObj.s_no
      const userId = Number(rawUserId)

      if (docsToAccept?.length) {
        if (!Number.isFinite(userId) || userId <= 0) {
          throw new Error('Signup succeeded but user id was not returned')
        }
        for (const doc of docsToAccept) {
          const s_no = Number(doc.s_no)
          if (!Number.isFinite(s_no) || s_no <= 0) continue
          await acceptLegalDocument({ s_no, acceptance_context: 'SIGNUP', user_id: userId }).unwrap()
        }
      }

      const maybeMessage = typeof signupObj.message === 'string' ? signupObj.message : undefined
      showSuccessToast(maybeMessage || 'Account created successfully! Please wait for admin approval.')
      navigate('/login', { replace: true })
    } catch (e: unknown) {
      showErrorToast(e, 'Signup failed')
    }
  }

  const resetPhoneFlow = () => {
    setPhoneVerified(false)
    setOtpSent(false)
    setOtp('')
    setFullPhone('')
  }

  return (
    <div className='container mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center px-4 py-10 sm:py-12'>
      <div className='mx-auto w-full max-w-xl'>
        <Card className='w-full'>
          <CardHeader>
            <CardTitle>{phoneVerified ? 'Setup your PG' : 'Sign up easily'}</CardTitle>
            <CardDescription>
              {phoneVerified
                ? 'Complete setup to continue using the app'
                : 'Verify your phone number to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className='grid gap-4'>
                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='10 digit number'
                          {...field}
                          disabled={phoneVerified}
                          onChange={(e) => {
                            field.onChange(e.target.value)
                            resetPhoneFlow()
                          }}
                        />
                      </FormControl>
                      <FormMessage />

                      {!phoneVerified ? (
                        <div className='mt-2 grid gap-2'>
                          <Button
                            type='button'
                            disabled={sending || !String(field.value || '').trim()}
                            onClick={() => void onSendOtp()}
                            className='w-full sm:w-auto'
                          >
                            {sending ? 'Sending...' : 'Send OTP'}
                          </Button>

                          {otpSent ? (
                            <div className='grid gap-2'>
                              <div className='text-sm text-muted-foreground'>OTP sent to {fullPhone}</div>
                              <Input
                                placeholder='Enter 4-digit OTP'
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                              />
                              <div className='flex flex-col gap-2 sm:flex-row'>
                                <Button
                                  type='button'
                                  onClick={onVerifyOtp}
                                  disabled={verifying}
                                  className='w-full sm:w-auto'
                                >
                                  {verifying ? 'Please wait...' : 'Verify OTP'}
                                </Button>
                                <Button
                                  type='button'
                                  variant='outline'
                                  className='w-full sm:w-auto'
                                  onClick={() => {
                                    setOtpSent(false)
                                    setOtp('')
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className='text-xs text-muted-foreground'>You will receive a 4-digit OTP on your phone number</div>
                          )}
                        </div>
                      ) : (
                        <div className='mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>
                          <div>Phone Verified</div>
                          <Button type='button' variant='ghost' size='sm' className='h-7 px-2' onClick={resetPhoneFlow}>
                            Change
                          </Button>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                {phoneVerified ? (
                  <>
                    <div className='rounded-lg border bg-primary/5 px-3 py-3 text-sm'>
                      <div className='font-semibold'>Quick setup</div>
                      <div className='mt-0.5 text-xs text-muted-foreground'>Just a few details — you’re ready to start.</div>
                    </div>

                    <div className='grid gap-4 lg:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name='pgName'
                        render={({ field }) => (
                          <FormItem className='lg:col-span-2'>
                            <FormLabel>1. PG Name</FormLabel>
                            <FormControl>
                              <Input placeholder='e.g., Green Valley PG' {...field} />
                            </FormControl>
                            <FormMessage />
                            <div className='text-xs text-muted-foreground'>This will also be used as your organization name for now.</div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='name'
                        render={({ field }) => (
                          <FormItem className='lg:col-span-2'>
                            <FormLabel>2. Your Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder='e.g., John Doe' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='rentCycleType'
                        render={({ field }) => (
                          <FormItem className='lg:col-span-2'>
                            <FormLabel>3. Rent Cycle Type</FormLabel>
                            <FormMessage />
                            <div className='mt-2 grid gap-2 sm:grid-cols-2'>
                              <button
                                type='button'
                                className={
                                  'rounded-lg border px-3 py-3 text-left transition ' +
                                  ((field.value || 'CALENDAR') === 'CALENDAR'
                                    ? 'border-primary bg-primary/10'
                                    : 'bg-background hover:bg-muted/40')
                                }
                                onClick={() => {
                                  field.onChange('CALENDAR')
                                  form.setValue('rentCycleStart', 1)
                                  form.setValue('rentCycleEnd', 30)
                                }}
                              >
                                <div className='text-sm font-semibold'>Calendar Month</div>
                                <div className='mt-1 text-xs text-muted-foreground'>Rent month is 1st → 30th (or 31st).</div>
                              </button>
                              <button
                                type='button'
                                className={
                                  'rounded-lg border px-3 py-3 text-left transition ' +
                                  ((field.value || 'CALENDAR') === 'MIDMONTH'
                                    ? 'border-primary bg-primary/10'
                                    : 'bg-background hover:bg-muted/40')
                                }
                                onClick={() => {
                                  field.onChange('MIDMONTH')
                                  form.setValue('rentCycleStart', 1)
                                  form.setValue('rentCycleEnd', 30)
                                }}
                              >
                                <div className='text-sm font-semibold'>Mid‑Month / Check‑in based</div>
                                <div className='mt-1 text-xs text-muted-foreground'>Rent cycle starts from tenant check‑in date.</div>
                              </button>
                            </div>
                          </FormItem>
                        )}
                      />

                      {(form.getValues('rentCycleType') || 'CALENDAR') === 'CALENDAR' ? (
                        <FormField
                          control={form.control}
                          name='rentCycleEnd'
                          render={({ field }) => (
                            <FormItem className='lg:col-span-2'>
                              <FormLabel>Rent Cycle End Day</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='30'
                                  value={field.value == null ? '' : String(field.value)}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    const n = v ? Number(v) : NaN
                                    field.onChange(Number.isFinite(n) ? n : null)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}
                    </div>

                    <div className='grid gap-2'>
                      <div className='flex items-start gap-2'>
                        <Checkbox
                          checked={hasAgreedToLegal}
                          onCheckedChange={(v) => setHasAgreedToLegal(Boolean(v))}
                          id='legal'
                        />
                        <label htmlFor='legal' className='text-sm text-muted-foreground'>
                          I agree to{' '}
                          {findLegalDocUrl(['TERMS', 'TERMS_AND_CONDITIONS', 'TNC', 'T_AND_C']) ? (
                            <a
                              className='text-primary underline'
                              href={findLegalDocUrl(['TERMS', 'TERMS_AND_CONDITIONS', 'TNC', 'T_AND_C'])}
                              target='_blank'
                              rel='noreferrer'
                              onClick={(e) => e.stopPropagation()}
                            >
                              Terms & Conditions
                            </a>
                          ) : (
                            <span>Terms & Conditions</span>
                          )}{' '}
                          and{' '}
                          {findLegalDocUrl(['PRIVACY', 'PRIVACY_POLICY']) ? (
                            <a
                              className='text-primary underline'
                              href={findLegalDocUrl(['PRIVACY', 'PRIVACY_POLICY'])}
                              target='_blank'
                              rel='noreferrer'
                              onClick={(e) => e.stopPropagation()}
                            >
                              Privacy Policy
                            </a>
                          ) : (
                            <span>Privacy Policy</span>
                          )}
                        </label>
                      </div>
                    </div>

                    <Button type='button' onClick={onSignup} disabled={!phoneVerified || signingUp}>
                      {signingUp ? 'Creating...' : 'Create account'}
                    </Button>
                  </>
                ) : null}

                <Button type='button' variant='link' onClick={() => navigate('/login')}>
                  Already have an account? Login
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
