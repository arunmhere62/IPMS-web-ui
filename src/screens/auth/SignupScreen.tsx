import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
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

  const phoneValue = form.watch('phone')

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
    <div className='flex h-full w-full flex-col overflow-hidden lg:flex-row'>
      {/* Form - On top for mobile, right side for desktop */}
      <div className='order-1 flex h-full w-full items-center justify-center overflow-y-auto bg-white lg:order-2 lg:w-1/2'>
        <div className='w-full max-w-[420px] px-8 py-12'>
          <h1 className='mb-2 text-center text-3xl font-bold text-slate-900'>
            {phoneVerified ? 'Setup your PG' : 'Create Account'}
          </h1>
          <p className='mb-8 text-center text-slate-500'>
            {phoneVerified
              ? 'Complete setup to get started'
              : 'Verify your phone number to continue'}
          </p>

          <div>
            <Form {...form}>
              <form className='space-y-5'>
                {!phoneVerified ? (
                  <>
                    <FormField
                      control={form.control}
                      name='phone'
                      render={({ field }) => (
                        <FormItem className='flex flex-col'>
                          <FormLabel className='text-left text-sm font-medium text-slate-700'>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Enter 10 digit number'
                              {...field}
                              disabled={otpSent}
                              onChange={(e) => {
                                field.onChange(e.target.value)
                                if (otpSent) resetPhoneFlow()
                              }}
                              className='h-12 rounded-lg border-slate-200 focus:border-slate-400'
                            />
                          </FormControl>
                          <FormMessage className='text-left' />
                        </FormItem>
                      )}
                    />

                    {!otpSent ? (
                      <Button
                        type='button'
                        disabled={sending || !String(phoneValue || '').trim()}
                        onClick={() => void onSendOtp()}
                        className='h-12 w-full rounded-full bg-blue-600 text-base font-medium hover:bg-blue-700'
                      >
                        {sending ? 'Sending...' : 'Send OTP'}
                      </Button>
                    ) : (
                      <>
                        <div>
                          <label className='mb-2 block text-sm font-medium text-slate-700'>Verification Code</label>
                          <Input
                            placeholder='Enter 4-digit OTP'
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={4}
                            className='h-12 rounded-lg border-slate-200 text-center text-xl tracking-widest focus:border-slate-400'
                          />
                          <p className='mt-2 text-xs text-slate-500'>Sent to {fullPhone}</p>
                        </div>
                        <div className='flex gap-3'>
                          <Button
                            type='button'
                            onClick={onVerifyOtp}
                            disabled={verifying}
                            className='h-12 flex-1 rounded-full bg-blue-600 text-base font-medium hover:bg-blue-700'
                          >
                            {verifying ? 'Verifying...' : 'Verify'}
                          </Button>
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => {
                              setOtpSent(false)
                              setOtp('')
                            }}
                            className='h-12 flex-1 rounded-lg border-slate-200'
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className='flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3'>
                    <div className='text-sm font-medium text-emerald-700'>Phone Verified</div>
                    <Button type='button' variant='ghost' size='sm' className='h-8 px-2 text-emerald-700 hover:text-emerald-800' onClick={resetPhoneFlow}>
                      Change
                    </Button>
                  </div>
                )}

                {phoneVerified ? (
                  <>
                    <div className='rounded-lg border border-blue-100 bg-blue-50 px-4 py-3'>
                      <div className='text-center text-sm font-semibold text-blue-900'>Quick setup</div>
                      <div className='mt-0.5 text-center text-xs text-blue-700'>Just a few details to get started.</div>
                    </div>

                    <div className='space-y-4'>
                      <FormField
                        control={form.control}
                        name='pgName'
                        render={({ field }) => (
                          <FormItem className='flex flex-col'>
                            <FormLabel className='text-left text-sm font-medium text-slate-700'>PG Name</FormLabel>
                            <FormControl>
                              <Input placeholder='e.g., Green Valley PG' {...field} className='h-12 rounded-lg border-slate-200' />
                            </FormControl>
                            <FormMessage className='text-left' />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='name'
                        render={({ field }) => (
                          <FormItem className='flex flex-col'>
                            <FormLabel className='text-left text-sm font-medium text-slate-700'>Your Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder='e.g., John Doe' {...field} className='h-12 rounded-lg border-slate-200' />
                            </FormControl>
                            <FormMessage className='text-left' />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='rentCycleType'
                        render={({ field }) => (
                          <FormItem className='flex flex-col'>
                            <FormLabel className='text-left text-sm font-medium text-slate-700'>Rent Cycle Type</FormLabel>
                            <div className='mt-2 grid gap-3 sm:grid-cols-2'>
                              <button
                                type='button'
                                className={
                                  'rounded-lg border px-4 py-3 text-left transition ' +
                                  ((field.value || 'CALENDAR') === 'CALENDAR'
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-slate-200 bg-white hover:bg-slate-50')
                                }
                                onClick={() => {
                                  field.onChange('CALENDAR')
                                  form.setValue('rentCycleStart', 1)
                                  form.setValue('rentCycleEnd', 30)
                                }}
                              >
                                <div className='text-sm font-semibold'>Calendar Month</div>
                                <div className='mt-1 text-xs text-slate-500'>1st to 30th/31st</div>
                              </button>
                              <button
                                type='button'
                                className={
                                  'rounded-lg border px-4 py-3 text-left transition ' +
                                  ((field.value || 'CALENDAR') === 'MIDMONTH'
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-slate-200 bg-white hover:bg-slate-50')
                                }
                                onClick={() => {
                                  field.onChange('MIDMONTH')
                                  form.setValue('rentCycleStart', 1)
                                  form.setValue('rentCycleEnd', 30)
                                }}
                              >
                                <div className='text-sm font-semibold'>Check-in Based</div>
                                <div className='mt-1 text-xs text-slate-500'>From tenant start date</div>
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
                            <FormItem className='flex flex-col'>
                              <FormLabel className='text-left text-sm font-medium text-slate-700'>Rent Cycle End Day</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='30'
                                  value={field.value == null ? '' : String(field.value)}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    const n = v ? Number(v) : NaN
                                    field.onChange(Number.isFinite(n) ? n : null)
                                  }}
                                  className='h-12 rounded-lg border-slate-200'
                                />
                              </FormControl>
                              <FormMessage className='text-left' />
                            </FormItem>
                          )}
                        />
                      ) : null}
                    </div>

                    <div className='flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4'>
                      <Checkbox
                        checked={hasAgreedToLegal}
                        onCheckedChange={(v) => setHasAgreedToLegal(Boolean(v))}
                        id='legal'
                        className='mt-0.5'
                      />
                      <label htmlFor='legal' className='text-sm text-slate-600'>
                        I agree to{' '}
                        {findLegalDocUrl(['TERMS', 'TERMS_AND_CONDITIONS', 'TNC', 'T_AND_C']) ? (
                          <a
                            className='text-blue-600 hover:text-blue-700'
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
                            className='text-blue-600 hover:text-blue-700'
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

                    <Button 
                      type='button' 
                      onClick={onSignup} 
                      disabled={!phoneVerified || signingUp}
                      className='h-12 w-full rounded-full bg-blue-600 text-base font-medium hover:bg-blue-700'
                    >
                      {signingUp ? 'Creating...' : 'Create Account'}
                    </Button>
                  </>
                ) : null}

                <div className='flex items-center gap-4 py-2'>
                  <div className='h-px flex-1 bg-slate-200' />
                  <span className='text-xs text-slate-400'>or</span>
                  <div className='h-px flex-1 bg-slate-200' />
                </div>

                <Button 
                  type='button' 
                  variant='outline' 
                  onClick={() => navigate('/login')}
                  className='h-12 w-full rounded-lg border-slate-200'
                >
                  Already have an account? Login
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* Branding - Hidden on mobile, left side on desktop */}
      <div className='order-2 hidden h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 text-white lg:order-1 lg:flex lg:w-1/2'>
        <div className='flex flex-col items-center justify-center p-12'>
          <div className='mb-8 text-6xl'>🏠</div>
          <h1 className='mb-4 text-4xl font-bold'>IPMS</h1>
          <p className='text-center text-lg text-white/80'>
            Indian PG Management System
          </p>
          <div className='mt-12 text-sm text-white/60'>
            Manage your PG properties efficiently
          </div>
        </div>
      </div>
    </div>
  )
}
