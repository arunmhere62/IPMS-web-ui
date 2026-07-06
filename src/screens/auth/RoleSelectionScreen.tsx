import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { User, Shield } from 'lucide-react'

export function RoleSelectionScreen() {
  const navigate = useNavigate()

  return (
    <div className='flex h-full w-full flex-col overflow-hidden lg:flex-row'>
      {/* Form Section */}
      <div className='order-1 flex h-full w-full items-center justify-center overflow-y-auto bg-white lg:order-2 lg:w-1/2'>
        <div className='w-full max-w-[380px] px-6 py-8'>
          {/* Logo */}
          <div className='mb-6 flex justify-center'>
            <div className='flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-3xl'>
              🏠
            </div>
          </div>

          {/* Header */}
          <div className='mb-6 text-center'>
            <h1 className='mb-1 text-2xl font-bold text-slate-900'>Welcome</h1>
            <p className='text-sm text-slate-500'>Select your role to continue</p>
          </div>

          {/* Role Cards */}
          <div className='space-y-3'>
            {/* Tenant Card */}
            <Card
              className='cursor-pointer border-2 border-slate-200 bg-slate-50 transition-all hover:border-blue-400 hover:bg-blue-50'
              onClick={() => navigate('/tenant-login')}
            >
              <CardContent className='flex items-center gap-3 p-4'>
                <div className='flex size-10 items-center justify-center rounded-full bg-slate-200'>
                  <User className='size-5 text-slate-600' />
                </div>
                <div className='flex-1'>
                  <h3 className='text-base font-semibold text-slate-900'>Tenant</h3>
                  <p className='text-xs text-slate-500'>View PG details & pay rent</p>
                </div>
                <div className='text-slate-400'>›</div>
              </CardContent>
            </Card>

            {/* Owner Card */}
            <Card
              className='cursor-pointer border-2 border-blue-200 bg-blue-50 transition-all hover:border-blue-400 hover:bg-blue-100'
              onClick={() => navigate('/owner-login')}
            >
              <CardContent className='flex items-center gap-3 p-4'>
                <div className='flex size-10 items-center justify-center rounded-full bg-blue-200'>
                  <Shield className='size-5 text-blue-600' />
                </div>
                <div className='flex-1'>
                  <h3 className='text-base font-semibold text-blue-900'>PG Owner</h3>
                  <p className='text-xs text-blue-600'>Manage properties & operations</p>
                </div>
                <div className='text-blue-400'>›</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Branding Section */}
      <div className='order-2 hidden h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 text-white lg:order-1 lg:flex lg:w-1/2'>
        <div className='flex flex-col items-center justify-center p-12'>
          <div className='mb-6 text-5xl'>🏠</div>
          <h1 className='mb-3 text-3xl font-bold'>IPMS</h1>
          <p className='text-center text-base text-white/80'>
            Indian PG Management System
          </p>
          <div className='mt-8 text-xs text-white/60'>
            Manage your PG properties efficiently
          </div>
        </div>
      </div>
    </div>
  )
}
