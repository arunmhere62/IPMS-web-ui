import { useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Country {
  code: string
  name: string
  flag: string
  phoneCode: string
  phoneLength: number
}

const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', flag: '🇮🇳', phoneCode: '+91', phoneLength: 10 },
  { code: 'US', name: 'United States', flag: '🇺🇸', phoneCode: '+1', phoneLength: 10 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', phoneCode: '+44', phoneLength: 10 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', phoneCode: '+1', phoneLength: 10 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', phoneCode: '+61', phoneLength: 9 },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', phoneCode: '+65', phoneLength: 8 },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', phoneCode: '+60', phoneLength: 9 },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', phoneCode: '+92', phoneLength: 10 },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', phoneCode: '+880', phoneLength: 10 },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', phoneCode: '+94', phoneLength: 9 },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', phoneCode: '+64', phoneLength: 9 },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', phoneCode: '+971', phoneLength: 9 },
]

interface CountryPhoneSelectorProps {
  selectedCountry?: Country
  onSelectCountry: (country: Country) => void
  phoneValue?: string
  onPhoneChange: (phone: string) => void
  className?: string
}

export function CountryPhoneSelector({
  selectedCountry = COUNTRIES[0],
  onSelectCountry,
  phoneValue = '',
  onPhoneChange,
  className,
}: CountryPhoneSelectorProps) {
  const [localPhone, setLocalPhone] = useState(phoneValue)

  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/[^\d]/g, '')
    const maxLength = selectedCountry.phoneLength
    const truncated = digitsOnly.slice(0, maxLength)
    setLocalPhone(truncated)
    onPhoneChange(truncated)
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <Select
        value={selectedCountry.code}
        onValueChange={(code) => {
          const country = COUNTRIES.find((c) => c.code === code)
          if (country) onSelectCountry(country)
        }}
      >
        <SelectTrigger className='w-[140px] h-10'>
          <SelectValue placeholder='Country'>
            <div className='flex items-center gap-2'>
              <span>{selectedCountry.flag}</span>
              <span className='text-sm'>{selectedCountry.phoneCode}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className='flex items-center gap-2'>
                <span>{country.flag}</span>
                <span>{country.name}</span>
                <span className='text-muted-foreground'>{country.phoneCode}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type='tel'
        placeholder={`${selectedCountry.phoneLength}-digit number`}
        value={localPhone}
        onChange={(e) => handlePhoneChange(e.target.value)}
        className='flex-1 h-10'
        maxLength={selectedCountry.phoneLength}
      />
    </div>
  )
}

export { COUNTRIES }
