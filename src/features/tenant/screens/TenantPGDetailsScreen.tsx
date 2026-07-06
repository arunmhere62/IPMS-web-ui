import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppSelector } from '@/store/hooks'
import { useGetTenantProfileQuery } from '../api/tenantPortalApi'
import { getCookie } from '@/lib/cookies'
import { Building2, MapPin, RefreshCw, LogIn } from 'lucide-react'

export function TenantPGDetailsScreen() {
  const accessToken = getCookie('access_token')
  const tenantAuth = useAppSelector((state) => state.tenantAuth)

  const { data: profileData, isLoading } = useGetTenantProfileQuery(undefined, {
    skip: !accessToken,
  })

  const profile = profileData?.data

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-slate-500'>Loading...</div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-slate-900'>My PG Details</h1>
        <p className='text-slate-500'>View your PG information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building2 className='size-5' />
            PG Information
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-start gap-3'>
            <MapPin className='size-4 text-slate-400 mt-0.5' />
            <div className='flex-1'>
              <p className='text-sm font-medium text-slate-700'>Address</p>
              <p className='text-sm text-slate-600'>{profile?.pg_locations?.address || tenantAuth.pg?.address || 'N/A'}</p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <MapPin className='size-4 text-slate-400 mt-0.5' />
            <div className='flex-1'>
              <p className='text-sm font-medium text-slate-700'>City</p>
              <p className='text-sm text-slate-600'>{profile?.pg_locations?.city?.name || tenantAuth.pg?.city || 'N/A'}</p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <MapPin className='size-4 text-slate-400 mt-0.5' />
            <div className='flex-1'>
              <p className='text-sm font-medium text-slate-700'>State</p>
              <p className='text-sm text-slate-600'>{profile?.pg_locations?.state?.name || tenantAuth.pg?.state || 'N/A'}</p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <RefreshCw className='size-4 text-slate-400 mt-0.5' />
            <div className='flex-1'>
              <p className='text-sm font-medium text-slate-700'>Rent Cycle Type</p>
              <p className='text-sm text-slate-600'>{profile?.pg_locations?.rent_cycle_type || tenantAuth.pg?.rent_cycle_type || 'N/A'}</p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <LogIn className='size-4 text-slate-400 mt-0.5' />
            <div className='flex-1'>
              <p className='text-sm font-medium text-slate-700'>Check-in Date</p>
              <p className='text-sm text-slate-600'>
                {profile?.check_in_date 
                  ? new Date(profile.check_in_date).toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })
                  : (tenantAuth.tenant?.check_in_date
                    ? new Date(tenantAuth.tenant.check_in_date).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })
                    : 'N/A')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
