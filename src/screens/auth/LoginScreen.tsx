import { useMemo, useState, useRef, useCallback } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSendOtpMutation, useVerifyOtpMutation } from '@/services/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials, type AuthUser } from '@/store/slices/authSlice'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { setCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
}

function OtpInput({ value, onChange, length = 6 }: OtpInputProps) {
  const [localValue, setLocalValue] = useState(value.split('').concat(Array(length).fill('')).slice(0, length))
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = useCallback((index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return

    const newLocalValue = [...localValue]
    newLocalValue[index] = digit.slice(-1)
    setLocalValue(newLocalValue)
    onChange(newLocalValue.join(''))

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }, [localValue, length, onChange])

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !localValue[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }, [localValue])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    const newLocalValue = pasted.split('').concat(Array(length).fill('')).slice(0, length)
    setLocalValue(newLocalValue)
    onChange(newLocalValue.join(''))

    const focusIndex = Math.min(pasted.length, length - 1)
    inputsRef.current[focusIndex]?.focus()
  }, [length, onChange])

  return (
    <div className='flex justify-center gap-2' onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputsRef.current[index] = el }}
          type='text'
          inputMode='numeric'
          pattern='[0-9]'
          maxLength={1}
          value={localValue[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className='h-12 w-12 rounded-lg border border-slate-200 bg-white text-center text-xl font-semibold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
        />
      ))}
    </div>
  )
}

type AuthLocationState = {
  from?: string
}

type VerifyOtpResponse = {
  accessToken: string
  refreshToken?: string
  user?: unknown
}

const getErrorMessage = (err: unknown) => {
  if (!err) return null
  if (typeof err === 'string') return err
  if (typeof err === 'object') {
    const obj = err as Record<string, unknown>
    const message = typeof obj.message === 'string' ? obj.message : null
    const data = obj.data as Record<string, unknown> | undefined
    const dataMessage =
      data && typeof data.message === 'string' ? data.message : null
    return dataMessage || message
  }
  return null
}

const phoneSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
})

const otpSchema = z.object({
  otp: z.string().min(4, 'OTP is required').max(4, 'OTP must be 4 digits'),
})

type PhoneForm = z.infer<typeof phoneSchema>
type OtpForm = z.infer<typeof otpSchema>

export function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: AuthLocationState } | null
  const dispatch = useAppDispatch()

  const [phase, setPhase] = useState<'phone' | 'otp'>('phone')
  const [fullPhone, setFullPhone] = useState<string>('')

  const [sendOtp, { isLoading: sending }] = useSendOtpMutation()
  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation()

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  })
  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  })

  const fromPath = useMemo(() => location?.state?.from || '/', [location])

  const onSendOtp = async (values: PhoneForm) => {
    const phone = values.phone.trim()
    const normalized = phone.startsWith('+') ? phone : `+91${phone}`
    try {
      await sendOtp({ phone: normalized }).unwrap()
      setFullPhone(normalized)
      setPhase('otp')
      toast.success('OTP sent')
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || 'Failed to send OTP')
    }
  }

  const onVerifyOtp = async (values: OtpForm) => {
    try {
      const res = (await verifyOtp({
        phone: fullPhone,
        otp: values.otp.trim(),
      }).unwrap()) as VerifyOtpResponse

      const user = (res.user ?? null) as AuthUser
      const userId = user?.s_no ?? user?.id ?? user?.user_id ?? user?.userId

      setCookie('access_token', res.accessToken)
      if (res.refreshToken) setCookie('refresh_token', res.refreshToken)
      if (userId !== undefined && userId !== null)
        setCookie('x_user_id', String(userId))

      dispatch(
        setCredentials({
          user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
        })
      )

      toast.success('Login successful')
      navigate(fromPath, { replace: true })
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || 'Invalid OTP')
    }
  }

  return (
    <div className='flex h-screen w-screen flex-col overflow-hidden lg:flex-row'>
      {/* Form - On top for mobile, right side for desktop */}
      <div className='order-1 flex w-full items-center justify-center bg-white lg:order-2 lg:w-1/2'>
        <div className='w-full max-w-[420px] px-8 py-12'>
          {phase === 'phone' ? (
            <>
              <h1 className='mb-2 text-center text-4xl font-bold text-slate-900'>
                Welcome Back
              </h1>
              <p className='mb-8 text-center text-slate-500'>
                Enter your phone to receive OTP
              </p>

              <Form {...phoneForm}>
                <form
                  onSubmit={phoneForm.handleSubmit(onSendOtp)}
                  className='space-y-5'
                >
                  <FormField
                    control={phoneForm.control}
                    name='phone'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel className='text-left text-sm font-medium text-slate-700'>
                          Phone Number
                        </FormLabel>
                        <FormControl className='w-full'>
                          <Input
                            placeholder='Enter 10 digit number'
                            {...field}
                            className='h-12 rounded-lg border-slate-200 focus:border-slate-400'
                          />
                        </FormControl>
                        <FormMessage className='text-left' />
                      </FormItem>
                    )}
                  />

                  <Button
                    type='submit'
                    disabled={sending}
                    className='h-12 w-full rounded-full bg-blue-600 text-base font-medium hover:bg-blue-700'
                  >
                    {sending ? 'Sending...' : 'Send OTP'}
                  </Button>

                  <div className='flex items-center gap-4 py-2'>
                    <div className='h-px flex-1 bg-slate-200' />
                    <span className='text-xs text-slate-400'>or</span>
                    <div className='h-px flex-1 bg-slate-200' />
                  </div>

                  <Button
                    type='button'
                    variant='outline'
                    className='h-12 w-full rounded-lg border-slate-200 text-base font-normal'
                    onClick={() => navigate('/signup')}
                  >
                    Create new account
                  </Button>
                </form>
              </Form>

              <p className='mt-8 text-center text-sm text-slate-500'>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => navigate('/signup')}
                  className='font-semibold text-blue-600 hover:text-blue-700'
                >
                  Sign up
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 className='mb-2 text-center text-4xl font-bold text-slate-900'>
                Verify OTP
              </h1>
              <p className='mb-8 text-center text-slate-500'>
                Enter the code sent to {fullPhone}
              </p>

              <Form {...otpForm}>
                <form
                  onSubmit={otpForm.handleSubmit(onVerifyOtp)}
                  className='space-y-5'
                >
                  <div className='flex flex-col items-center space-y-4'>
                    <label className='text-center text-sm font-medium text-slate-600'>
                      Enter 4-digit verification code
                    </label>
                    <OtpInput
                      value={otpForm.watch('otp')}
                      onChange={(value) => otpForm.setValue('otp', value, { shouldValidate: true })}
                      length={4}
                    />
                    {otpForm.formState.errors.otp && (
                      <p className='text-sm text-red-500'>{otpForm.formState.errors.otp.message}</p>
                    )}
                  </div>

                  <Button
                    type='submit'
                    disabled={verifying}
                    className='h-12 w-full rounded-full bg-blue-600 text-base font-medium hover:bg-blue-700'
                  >
                    {verifying ? 'Verifying...' : 'Login'}
                  </Button>

                  <div className='flex items-center justify-center gap-2 pt-2'>
                    <span className='text-sm text-slate-500'>Didn&apos;t receive code?</span>
                    <button
                      type='button'
                      onClick={() => {
                        const phoneWithoutPrefix = fullPhone.startsWith('+91')
                          ? fullPhone.slice(3)
                          : fullPhone
                        onSendOtp({ phone: phoneWithoutPrefix })
                      }}
                      disabled={sending}
                      className='text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {sending ? 'Sending...' : 'Resend'}
                    </button>
                  </div>

                  <Button
                    type='button'
                    onClick={() => setPhase('phone')}
                    className='h-12 w-full gap-2 rounded-full border-2 border-blue-600 bg-white text-sm font-medium text-blue-600 shadow-none hover:bg-blue-50'
                  >
                    <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                    </svg>
                    Change phone number
                  </Button>
                </form>
              </Form>
            </>
          )}
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
