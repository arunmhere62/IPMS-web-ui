import { useState } from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore' },
]

export interface PhoneInputProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  defaultCountryCode?: string
}

export function PhoneInput<TFieldValues extends FieldValues>({
  control,
  name,
  label = 'Phone',
  placeholder = 'Enter phone number',
  required = false,
  disabled = false,
  defaultCountryCode = '+91',
}: PhoneInputProps<TFieldValues>) {
  const [countryCode, setCountryCode] = useState(defaultCountryCode)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Parse the current value to extract country code and number
        const currentValue = field.value as string
        const hasPlus = currentValue?.startsWith('+')

        // Extract country code from value if present
        const extractedCode = COUNTRY_CODES.find((c) =>
          currentValue?.startsWith(c.code)
        )?.code
        const displayCountryCode = extractedCode || countryCode

        // Get the phone number part (without country code)
        const phoneNumber = extractedCode
          ? currentValue?.slice(extractedCode.length) || ''
          : hasPlus
            ? currentValue?.slice(countryCode.length) || ''
            : currentValue || ''

        const handleCountryChange = (newCode: string) => {
          setCountryCode(newCode)
          // Update the field value with new country code
          const number = phoneNumber.replace(/\D/g, '')
          field.onChange(number ? `${newCode}${number}` : '')
        }

        const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const number = e.target.value.replace(/\D/g, '') // Remove non-digits
          field.onChange(number ? `${displayCountryCode}${number}` : '')
        }

        return (
          <FormItem>
            {label && (
              <FormLabel>
                {label}
                {required && <span className='ml-1 text-destructive'>*</span>}
              </FormLabel>
            )}
            <FormControl>
              <div className='flex gap-2'>
                <Select
                  value={displayCountryCode}
                  onValueChange={handleCountryChange}
                  disabled={disabled}
                >
                  <SelectTrigger className='w-[100px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <span className='flex items-center gap-2'>
                          <span>{country.flag}</span>
                          <span>{country.code}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  {...field}
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder={placeholder}
                  disabled={disabled}
                  type='tel'
                  className='flex-1'
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
