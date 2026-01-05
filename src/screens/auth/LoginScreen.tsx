import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'

import { useSendOtpMutation, useVerifyOtpMutation } from '@/services/authApi'
import { setCookie } from '@/lib/cookies'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/store/slices/authSlice'

const phoneSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
})

const otpSchema = z.object({
  otp: z.string().min(4, 'OTP is required').max(6, 'OTP is invalid'),
})

type PhoneForm = z.infer<typeof phoneSchema>
type OtpForm = z.infer<typeof otpSchema>

export function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation() as any
  const dispatch = useAppDispatch()

  const [phase, setPhase] = useState<'phone' | 'otp'>('phone')
  const [fullPhone, setFullPhone] = useState<string>('')

  const [sendOtp, { isLoading: sending }] = useSendOtpMutation()
  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation()

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema), defaultValues: { phone: '' } })
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema), defaultValues: { otp: '' } })

  const fromPath = useMemo(() => location?.state?.from || '/', [location])

  const onSendOtp = async (values: PhoneForm) => {
    const phone = values.phone.trim()
    const normalized = phone.startsWith('+') ? phone : `+91 ${phone}`
    try {
      await sendOtp({ phone: normalized }).unwrap()
      setFullPhone(normalized)
      setPhase('otp')
      toast.success('OTP sent')
    } catch (e: any) {
      toast.error(e?.data?.message || e?.message || 'Failed to send OTP')
    }
  }

  const onVerifyOtp = async (values: OtpForm) => {
    try {
      const res = await verifyOtp({ phone: fullPhone, otp: values.otp.trim() }).unwrap()

      const user: any = (res as any).user
      const userId = user?.s_no ?? user?.id ?? user?.user_id ?? user?.userId

      setCookie('access_token', res.accessToken)
      if ((res as any).refreshToken) setCookie('refresh_token', (res as any).refreshToken)
      if (userId !== undefined && userId !== null) setCookie('x_user_id', String(userId))

      dispatch(setCredentials({ user, accessToken: res.accessToken, refreshToken: (res as any).refreshToken }))

      toast.success('Login successful')
      navigate(fromPath, { replace: true })
    } catch (e: any) {
      toast.error(e?.data?.message || e?.message || 'Invalid OTP')
    }
  }

  return (
    <div className='mx-auto flex min-h-[calc(100vh-64px)] max-w-md items-center px-4 py-10'>
      <Card className='w-full'>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Use your phone number to login with OTP</CardDescription>
        </CardHeader>
        <CardContent>
          {phase === 'phone' ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className='grid gap-4'>
                <FormField
                  control={phoneForm.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder='10 digit number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type='submit' disabled={sending}>
                  {sending ? 'Sending...' : 'Send OTP'}
                </Button>
                <Button type='button' variant='link' onClick={() => navigate('/signup')}>
                  Create new account
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className='grid gap-4'>
                <div className='text-sm text-muted-foreground'>OTP sent to {fullPhone}</div>
                <FormField
                  control={otpForm.control}
                  name='otp'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OTP</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter OTP' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type='submit' disabled={verifying}>
                  {verifying ? 'Verifying...' : 'Verify & Login'}
                </Button>
                <Button type='button' variant='outline' onClick={() => setPhase('phone')}>
                  Change phone
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
