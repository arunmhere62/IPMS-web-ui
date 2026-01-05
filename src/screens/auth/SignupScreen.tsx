import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { showErrorToast, showSuccessToast } from '@/utils/toast'

import {
  useSendSignupOtpMutation,
  useVerifySignupOtpMutation,
  useSignupMutation,
} from '@/services/authApi'

import {
  type RequiredLegalDocument,
  useAcceptLegalDocumentMutation,
  useLazyGetRequiredLegalDocumentsStatusQuery,
} from '@/services/legalDocumentsApi'

const schema = z.object({
  organizationName: z.string().min(1, 'Organization name is required'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone number is required'),
  pgName: z.string().min(1, 'PG name is required'),
  rentCycleType: z.enum(['CALENDAR', 'MIDMONTH']),
  rentCycleStart: z.number().nullable(),
  rentCycleEnd: z.number().nullable(),
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

  const loadLegalDocs = async () => {
    try {
      const status = await getRequiredLegalStatus({ context: 'SIGNUP' }).unwrap()
      const pending = ((status as any)?.pending ?? []) as RequiredLegalDocument[]
      setRequiredLegalDocs(Array.isArray(pending) ? pending : [])
    } catch {
      setRequiredLegalDocs([])
    }
  }

  useEffect(() => {
    void loadLegalDocs()
  }, [])

  const findLegalDocUrl = (types: string | string[]) => {
    const candidates = (Array.isArray(types) ? types : [types])
      .map((t) => String(t || '').toUpperCase())
      .filter(Boolean)

    const doc = (requiredLegalDocs || []).find((d: any) => {
      const dt = String(d?.type || '').toUpperCase()
      return candidates.includes(dt)
    })

    return (doc as any)?.url || (doc as any)?.content_url
  }

  const onSendOtp = async (values: FormValues) => {
    const phone = values.phone.trim()
    const normalized = phone.startsWith('+') ? phone : `+91${phone}`

    try {
      await sendSignupOtp({ phone: normalized }).unwrap()
      setFullPhone(normalized)
      setOtpSent(true)
      showSuccessToast('OTP sent')
    } catch (e: any) {
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
    } catch (e: any) {
      showErrorToast(e, 'Failed to verify OTP')
    }
  }

  const onSignup = async () => {
    const values = form.getValues()

    if (!phoneVerified) {
      showErrorToast('Please verify your phone number first')
      return
    }

    if (!hasAgreedToLegal) {
      showErrorToast('Please agree to the Terms & Conditions and Privacy Policy')
      return
    }

    try {
      const signupData: any = {
        organizationName: values.organizationName.trim(),
        name: values.name.trim(),
        pgName: values.pgName.trim(),
        phone: fullPhone,
        rentCycleType: values.rentCycleType,
        rentCycleStart: values.rentCycleStart,
        rentCycleEnd: values.rentCycleEnd,
      }

      const status = await getRequiredLegalStatus({ context: 'SIGNUP' }).unwrap()
      const docsToAccept = ((status as any)?.required ?? (status as any)?.pending ?? []) as RequiredLegalDocument[]

      const signupResult: any = await signup(signupData).unwrap()
      const rawUserId = signupResult?.userId ?? signupResult?.user_id ?? signupResult?.s_no
      const userId = Number(rawUserId)

      if (docsToAccept?.length) {
        if (!Number.isFinite(userId) || userId <= 0) {
          throw new Error('Signup succeeded but user id was not returned')
        }
        for (const doc of docsToAccept) {
          const s_no = Number((doc as any).s_no)
          if (!Number.isFinite(s_no) || s_no <= 0) continue
          await acceptLegalDocument({ s_no, acceptance_context: 'SIGNUP', user_id: userId }).unwrap()
        }
      }

      showSuccessToast(signupResult?.message || 'Account created successfully! Please wait for admin approval.')
      navigate('/login', { replace: true })
    } catch (e: any) {
      showErrorToast(e, 'Signup failed')
    }
  }

  return (
    <div className='mx-auto flex min-h-[calc(100vh-64px)] max-w-xl items-center px-4 py-10'>
      <Card className='w-full'>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Signup with phone OTP</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className='grid gap-4'>
              <div className='grid gap-4 lg:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='organizationName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Organization' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='pgName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PG Name</FormLabel>
                      <FormControl>
                        <Input placeholder='PG name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='rentCycleType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rent Cycle Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v)
                          form.setValue('rentCycleStart', 1)
                          form.setValue('rentCycleEnd', 30)
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select cycle type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='CALENDAR'>Calendar Month Cycle</SelectItem>
                          <SelectItem value='MIDMONTH'>Mid-Month Cycle</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='rentCycleEnd'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rent Cycle End Day</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='30'
                          value={field.value == null ? '' : String(field.value)}
                          onChange={(e) => {
                            const v = e.target.value
                            const n = v ? Number(v) : null
                            field.onChange(Number.isFinite(n as any) ? n : null)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem className='lg:col-span-2'>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='10 digit number'
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value)
                            setPhoneVerified(false)
                            setOtpSent(false)
                            setOtp('')
                            setFullPhone('')
                          }}
                        />
                      </FormControl>
                      <FormMessage />

                      {!phoneVerified ? (
                        <div className='mt-2 grid gap-2'>
                          <Button
                            type='button'
                            disabled={sending || !field.value?.trim()}
                            onClick={() => void form.handleSubmit(onSendOtp)()}
                            className='w-full sm:w-auto'
                          >
                            {sending ? 'Sending...' : 'Verify Phone Number'}
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
                          ) : null}
                        </div>
                      ) : (
                        <div className='mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>
                          Phone Verified
                        </div>
                      )}
                    </FormItem>
                  )}
                />
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

              <Button type='button' variant='link' onClick={() => navigate('/login')}>
                Already have an account? Login
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
