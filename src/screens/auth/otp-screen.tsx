import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { setCookie } from '@/lib/cookies'
import { useVerifyOtpMutation } from '@/store/auth.api'

export function OtpScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)

  const phone = useMemo(() => {
    const state = location.state as { phone?: string } | null
    return state?.phone
  }, [location.state])

  const [verifyOtp, { isLoading }] = useVerifyOtpMutation()

  useEffect(() => {
    if (!phone) {
      navigate('/login', { replace: true })
    }
  }, [navigate, phone])

  const handleVerify = async () => {
    if (!phone) return
    setError(null)

    const cleanedOtp = otp.replace(/[^0-9]/g, '')
    if (cleanedOtp.length < 4) {
      setError('Enter the OTP')
      return
    }

    try {
      const res = await verifyOtp({ phone, otp: cleanedOtp }).unwrap()

      setCookie('access_token', res.accessToken)
      setCookie('x_user_id', String(res.user?.s_no ?? ''))

      navigate('/', { replace: true })
    } catch (e: any) {
      setError(e?.data?.message ?? e?.message ?? 'OTP verification failed')
    }
  }

  return (
    <div className='min-h-svh w-full bg-background flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Verify OTP</CardTitle>
          <CardDescription>
            Enter the OTP sent to <span className='font-medium text-foreground'>{phone}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          {error ? (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className='grid gap-2'>
            <Label htmlFor='otp'>OTP</Label>
            <Input
              id='otp'
              placeholder='1234'
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode='numeric'
              autoComplete='one-time-code'
            />
          </div>

          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => navigate('/login', { replace: true })}>
              Back
            </Button>
            <Button className='flex-1' onClick={handleVerify} disabled={isLoading}>
              {isLoading ? 'Verifying…' : 'Verify'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
