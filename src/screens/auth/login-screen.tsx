import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSendOtpMutation } from '@/store/auth.api'

export function LoginScreen() {
  const navigate = useNavigate()
  const [country, setCountry] = useState<'IN' | 'US' | 'AE'>('IN')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [sendOtp, { isLoading }] = useSendOtpMutation()

  const countryMeta = useMemo(() => {
    const map = {
      IN: { code: 'IN' as const, dialCode: '+91', flag: '🇮🇳', label: 'India' },
      US: { code: 'US' as const, dialCode: '+1', flag: '🇺🇸', label: 'United States' },
      AE: { code: 'AE' as const, dialCode: '+971', flag: '🇦🇪', label: 'UAE' },
    }
    return map[country]
  }, [country])

  const handleSendOtp = async () => {
    setError(null)
    const digitsOnly = phone.replace(/[^0-9]/g, '').trim()
    if (!digitsOnly) {
      setError('Phone number is required')
      return
    }

    const fullPhone = `${countryMeta.dialCode}${digitsOnly}`

    try {
      await sendOtp({ phone: fullPhone }).unwrap()
      navigate('/login/otp', { state: { phone: fullPhone } })
    } catch (e: any) {
      setError(e?.data?.message ?? e?.message ?? 'Failed to send OTP')
    }
  }

  return (
    <div className='min-h-svh w-full bg-background flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your phone number to receive an OTP</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          {error ? (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className='grid gap-2'>
            <Label htmlFor='phone'>Phone</Label>
            <div className='flex gap-2'>
              <Select value={country} onValueChange={(v) => setCountry(v as any)}>
                <SelectTrigger className='w-[140px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='IN'>🇮🇳 +91</SelectItem>
                  <SelectItem value='US'>🇺🇸 +1</SelectItem>
                  <SelectItem value='AE'>🇦🇪 +971</SelectItem>
                </SelectContent>
              </Select>

              <Input
                id='phone'
                placeholder='9876543210'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete='tel'
                inputMode='numeric'
              />
            </div>
            <div className='text-xs text-muted-foreground'>
              Sending OTP to {countryMeta.dialCode}
              {phone.replace(/[^0-9]/g, '')}
            </div>
          </div>

          <Button onClick={handleSendOtp} disabled={isLoading}>
            {isLoading ? 'Sending…' : 'Send OTP'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
