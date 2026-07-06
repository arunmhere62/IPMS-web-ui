import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppSelector } from '@/store/hooks'
import { useGetTenantProfileQuery } from '../api/tenantPortalApi'
import { getCookie } from '@/lib/cookies'
import { Bed, Key, DollarSign } from 'lucide-react'

export function TenantRoomScreen() {
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
        <h1 className='text-2xl font-bold text-slate-900'>My Room</h1>
        <p className='text-slate-500'>View your room and bed details</p>
      </div>

      <div className='grid gap-6 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Bed className='size-5' />
              Room Number
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold text-slate-900'>
              {profile?.rooms?.room_no || tenantAuth.tenant?.room_no || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Key className='size-5' />
              Bed Number
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold text-slate-900'>
              {profile?.beds?.bed_no || tenantAuth.tenant?.bed_no || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <DollarSign className='size-5' />
              Bed Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold text-slate-900'>
              {profile?.beds?.bed_price ? `₹${profile.beds.bed_price}/mo` : (tenantAuth.tenant?.bed_price ? `₹${tenantAuth.tenant.bed_price}/mo` : 'N/A')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-2'>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              profile?.payment_status === 'PAID' || tenantAuth.tenant?.payment_status === 'PAID'
                ? 'bg-green-100 text-green-800' 
                : profile?.payment_status === 'PENDING' || tenantAuth.tenant?.payment_status === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}>
              {profile?.payment_status || tenantAuth.tenant?.payment_status || 'N/A'}
            </span>
          </div>
          {(profile?.rent_due_amount !== undefined || tenantAuth.tenant?.rent_due_amount !== undefined) && (
            <p className='mt-2 text-sm text-slate-600'>
              Due Amount: ₹{profile?.rent_due_amount ?? tenantAuth.tenant?.rent_due_amount ?? 0}
            </p>
          )}
          {profile?.pending_months && profile.pending_months > 0 && (
            <p className='mt-1 text-sm text-red-600'>
              Pending Months: {profile.pending_months}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
