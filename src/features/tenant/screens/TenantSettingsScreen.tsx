import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppSelector } from '@/store/hooks'
import { useGetTenantProfileQuery } from '../api/tenantPortalApi'
import { getCookie } from '@/lib/cookies'
import { User, Phone, Mail, LogOut, Image, FileText, MapPin, Map, Home, LogIn, LogOut as LogOutIcon, Briefcase, Building, Bed, Key, DollarSign, RefreshCw } from 'lucide-react'
import { useTenantLogout } from '@/hooks/useTenantLogout'

export function TenantSettingsScreen() {
  const accessToken = getCookie('access_token')
  const tenantAuth = useAppSelector((state) => state.tenantAuth)
  const handleLogout = useTenantLogout()

  const { data: profileData, isLoading } = useGetTenantProfileQuery(undefined, {
    skip: !accessToken,
  })

  const profile = profileData?.data

  const formatAmount = (amount: number | string | undefined) => {
    if (amount === undefined || amount === null) return '₹0'
    return `₹${Number(amount).toLocaleString('en-IN')}`
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

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
        <h1 className='text-2xl font-bold text-slate-900'>Settings</h1>
        <p className='text-slate-500'>Manage your account settings</p>
      </div>

      {/* Profile Hero */}
      <Card className='bg-gradient-to-r from-indigo-600 to-indigo-800 text-white border-0'>
        <CardContent className='p-6 text-center'>
          <div className='w-20 h-20 rounded-full bg-white/25 flex items-center justify-center mx-auto mb-4'>
            <span className='text-4xl font-bold text-white'>
              {(profile?.name?.[0] || tenantAuth.tenant?.name?.[0] || 'T').toUpperCase()}
            </span>
          </div>
          <h2 className='text-2xl font-bold mb-1'>{profile?.name || tenantAuth.tenant?.name || 'N/A'}</h2>
          <p className='text-white/80 mb-3'>{profile?.phone_no || tenantAuth.tenant?.phone || 'N/A'}</p>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            profile?.status === 'ACTIVE' ? 'bg-green-500' : 'bg-amber-500'
          }`}>
            {profile?.status || tenantAuth.tenant?.status || 'N/A'}
          </span>
        </CardContent>
      </Card>

      {/* Photos */}
      {profile?.images && profile.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Image className='w-5 h-5 text-indigo-600' />
              My Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex gap-3 overflow-x-auto pb-2'>
              {profile.images.map((uri, i) => (
                <img key={i} src={uri} alt={`Photo ${i + 1}`} className='w-28 h-32 rounded-lg object-cover flex-shrink-0' />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {profile?.proof_documents && profile.proof_documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='w-5 h-5 text-indigo-600' />
              ID / Proof Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex gap-3 overflow-x-auto pb-2'>
              {profile.proof_documents.map((uri, i) => (
                <img key={i} src={uri} alt={`Document ${i + 1}`} className='w-28 h-32 rounded-lg object-cover flex-shrink-0' />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='w-5 h-5 text-indigo-600' />
            Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
            <Phone className='w-4 h-4 text-slate-400' />
            <span className='text-xs text-slate-500 w-20'>Phone</span>
            <span className='text-sm font-medium text-slate-900 flex-1'>{profile?.phone_no || tenantAuth.tenant?.phone || 'N/A'}</span>
          </div>
          <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
            <Phone className='w-4 h-4 text-slate-400' />
            <span className='text-xs text-slate-500 w-20'>WhatsApp</span>
            <span className='text-sm font-medium text-slate-900 flex-1'>{profile?.whatsapp_number || 'N/A'}</span>
          </div>
          <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
            <Mail className='w-4 h-4 text-slate-400' />
            <span className='text-xs text-slate-500 w-20'>Email</span>
            <span className='text-sm font-medium text-slate-900 flex-1'>{profile?.email || tenantAuth.tenant?.email || 'N/A'}</span>
          </div>
          <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
            <Briefcase className='w-4 h-4 text-slate-400' />
            <span className='text-xs text-slate-500 w-20'>Occupation</span>
            <span className='text-sm font-medium text-slate-900 flex-1'>{profile?.occupation || 'N/A'}</span>
          </div>
          <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
            <MapPin className='w-4 h-4 text-slate-400' />
            <span className='text-xs text-slate-500 w-20'>City</span>
            <span className='text-sm font-medium text-slate-900 flex-1'>{profile?.city?.name || 'N/A'}</span>
          </div>
          <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
            <Map className='w-4 h-4 text-slate-400' />
            <span className='text-xs text-slate-500 w-20'>State</span>
            <span className='text-sm font-medium text-slate-900 flex-1'>{profile?.state?.name || 'N/A'}</span>
          </div>
          <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
            <Home className='w-4 h-4 text-slate-400' />
            <span className='text-xs text-slate-500 w-20'>Address</span>
            <span className='text-sm font-medium text-slate-900 flex-1'>{profile?.tenant_address || 'N/A'}</span>
          </div>
          <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
            <LogIn className='w-4 h-4 text-slate-400' />
            <span className='text-xs text-slate-500 w-20'>Check-in</span>
            <span className='text-sm font-medium text-slate-900 flex-1'>{formatDate(profile?.check_in_date)}</span>
          </div>
          <div className='flex items-center gap-3 py-2'>
            <LogOutIcon className='w-4 h-4 text-slate-400' />
            <span className='text-xs text-slate-500 w-20'>Check-out</span>
            <span className='text-sm font-medium text-slate-900 flex-1'>{formatDate(profile?.check_out_date)}</span>
          </div>
        </CardContent>
      </Card>

      {/* PG Details */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building className='w-5 h-5 text-indigo-600' />
            PG Details
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
            <Building className='w-4 h-4 text-slate-400' />
            <span className='text-xs text-slate-500 w-20'>PG Name</span>
            <span className='text-sm font-medium text-slate-900 flex-1'>{profile?.pg_locations?.location_name || tenantAuth.pg?.location_name || 'N/A'}</span>
          </div>
          <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
            <MapPin className='w-4 h-4 text-slate-400' />
            <span className='text-xs text-slate-500 w-20'>Address</span>
            <span className='text-sm font-medium text-slate-900 flex-1'>{profile?.pg_locations?.address || tenantAuth.pg?.address || 'N/A'}</span>
          </div>
          <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
            <Bed className='w-4 h-4 text-slate-400' />
            <span className='text-xs text-slate-500 w-20'>Room</span>
            <span className='text-sm font-medium text-slate-900 flex-1'>{profile?.rooms?.room_no || tenantAuth.tenant?.room_no || 'N/A'}</span>
          </div>
          <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
            <Key className='w-4 h-4 text-slate-400' />
            <span className='text-xs text-slate-500 w-20'>Bed</span>
            <span className='text-sm font-medium text-slate-900 flex-1'>{profile?.beds?.bed_no || tenantAuth.tenant?.bed_no || 'N/A'}</span>
          </div>
          <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
            <DollarSign className='w-4 h-4 text-slate-400' />
            <span className='text-xs text-slate-500 w-20'>Bed Price</span>
            <span className='text-sm font-medium text-slate-900 flex-1'>{formatAmount(profile?.beds?.bed_price)}</span>
          </div>
          <div className='flex items-center gap-3 py-2'>
            <RefreshCw className='w-4 h-4 text-slate-400' />
            <span className='text-xs text-slate-500 w-20'>Rent Cycle</span>
            <span className='text-sm font-medium text-slate-900 flex-1'>{profile?.pg_locations?.rent_cycle_type || tenantAuth.pg?.rent_cycle_type || 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Allocation History */}
      {profile?.tenant_allocations && profile.tenant_allocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Key className='w-5 h-5 text-indigo-600' />
              Allocation History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {profile.tenant_allocations.map((allocation) => (
                <div key={allocation.s_no} className='flex items-center gap-3 py-3 border-b border-slate-100 last:border-0'>
                  <div className='w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center'>
                    <Bed className='w-4 h-4 text-indigo-600' />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-slate-900'>
                      {allocation.rooms?.room_no} · {allocation.beds?.bed_no}
                    </p>
                    <p className='text-xs text-slate-500'>
                      From {formatDate(allocation.effective_from)}
                      {allocation.effective_to ? ` to ${formatDate(allocation.effective_to)}` : ' (current)'}
                    </p>
                  </div>
                  <p className='text-sm font-bold text-slate-900'>{formatAmount(allocation.bed_price_snapshot)}/mo</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logout Button */}
      <Button onClick={handleLogout} className='w-full bg-red-600 hover:bg-red-700 gap-2'>
        <LogOut className='w-4 h-4' />
        Logout
      </Button>
    </div>
  )
}
