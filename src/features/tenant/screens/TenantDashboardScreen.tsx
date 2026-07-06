import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppSelector } from '@/store/hooks'
import { useGetTenantProfileQuery, useGetTenantTicketStatsQuery, useUpdateExpectedVacateDateMutation } from '../api/tenantPortalApi'
import { getCookie } from '@/lib/cookies'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Bed, Key, DollarSign, Calendar, Ticket, AlertCircle, Receipt, MapPin, Building, RefreshCw, LogIn, CheckCircle, Clock, Info, Phone } from 'lucide-react'
import { toast } from 'sonner'

export function TenantDashboardScreen() {
  const accessToken = getCookie('access_token')
  const tenantAuth = useAppSelector((state) => state.tenantAuth)
  
  // Vacate date modal state
  const [vacateDateModalOpen, setVacateDateModalOpen] = useState(false)
  const [newVacateDate, setNewVacateDate] = useState('')
  const [updateExpectedVacateDate, { isLoading: vacateLoading }] = useUpdateExpectedVacateDateMutation()

  const { data: profileData, isLoading: profileLoading, refetch: refetchProfile } = useGetTenantProfileQuery(undefined, {
    skip: !accessToken,
  })

  const { data: ticketStatsData } = useGetTenantTicketStatsQuery(undefined, {
    skip: !accessToken,
  })

  const profile = profileData?.data
  const ticketStats = ticketStatsData?.data

  const isPaid = profile?.payment_status === 'PAID'
  const isPending = profile?.payment_status === 'PENDING'

  const handleOpenVacateModal = () => {
    setNewVacateDate(profile?.expected_vacate_date
      ? new Date(profile.expected_vacate_date).toISOString().split('T')[0]
      : '')
    setVacateDateModalOpen(true)
  }

  const handleSaveVacateDate = async () => {
    try {
      await updateExpectedVacateDate({
        expected_vacate_date: newVacateDate || null
      }).unwrap()
      toast.success(newVacateDate ? 'Expected vacate date saved' : 'Expected vacate date cleared')
      setVacateDateModalOpen(false)
      refetchProfile()
    } catch (error) {
      toast.error('Failed to update expected vacate date')
    }
  }

  const formatAmount = (amount: number | string | undefined) => {
    if (amount === undefined || amount === null) return '₹0'
    return `₹${Number(amount).toLocaleString('en-IN')}`
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (profileLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-slate-500'>Loading...</div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Hero Status Card */}
      <Card className={`border-t-4 ${isPaid ? 'border-t-green-500' : isPending ? 'border-t-amber-500' : 'border-t-red-500'}`}>
        <CardContent className='p-6'>
          <div className='flex justify-between items-start mb-4'>
            <div>
              <h2 className='text-xl font-bold text-slate-900'>
                Hello, {profile?.name?.split(' ')[0] || tenantAuth.tenant?.name || 'Tenant'} 👋
              </h2>
              <p className='text-sm text-slate-500'>{profile?.pg_locations?.location_name || 'My PG'}</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPaid ? 'bg-green-100' : isPending ? 'bg-amber-100' : 'bg-red-100'}`}>
              <span className='text-lg font-bold text-slate-900'>
                {(profile?.name?.[0] || 'T').toUpperCase()}
              </span>
            </div>
          </div>
          <div className='h-px bg-slate-200 my-4' />
          <div className='flex justify-between items-center'>
            <div>
              <p className='text-xs text-slate-500 mb-1'>Due Amount</p>
              <p className='text-3xl font-bold text-slate-900'>{formatAmount(profile?.rent_due_amount)}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isPaid ? 'bg-green-100' : isPending ? 'bg-amber-100' : 'bg-red-100'}`}>
              {isPaid ? <CheckCircle className='w-4 h-4 text-green-600' /> : <Clock className='w-4 h-4 text-amber-600' />}
              <span className={`text-sm font-semibold ${isPaid ? 'text-green-600' : isPending ? 'text-amber-600' : 'text-red-600'}`}>
                {profile?.payment_status || 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className='grid grid-cols-3 gap-4'>
        <Card>
          <CardContent className='p-4 flex items-center gap-3'>
            <div className='w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center'>
              <Bed className='w-5 h-5 text-indigo-600' />
            </div>
            <div>
              <p className='text-xs text-slate-500'>Room</p>
              <p className='text-sm font-bold text-slate-900'>{profile?.rooms?.room_no || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 flex items-center gap-3'>
            <div className='w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center'>
              <Key className='w-5 h-5 text-green-600' />
            </div>
            <div>
              <p className='text-xs text-slate-500'>Bed</p>
              <p className='text-sm font-bold text-slate-900'>{profile?.beds?.bed_no || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 flex items-center gap-3'>
            <div className='w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center'>
              <DollarSign className='w-5 h-5 text-amber-600' />
            </div>
            <div>
              <p className='text-xs text-slate-500'>Rent</p>
              <p className='text-sm font-bold text-slate-900'>{formatAmount(profile?.beds?.bed_price)}/mo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expected Vacate Date */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3 flex-1'>
              <div className='w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center'>
                <Calendar className='w-5 h-5 text-purple-600' />
              </div>
              <div className='flex-1'>
                <p className='text-sm font-bold text-slate-900'>Expected Vacate Date</p>
                <p className={`text-sm ${profile?.expected_vacate_date ? 'text-purple-600 font-semibold' : 'text-slate-500'}`}>
                  {profile?.expected_vacate_date
                    ? formatDate(profile.expected_vacate_date)
                    : 'Not set'}
                </p>
              </div>
            </div>
            <Button
              onClick={handleOpenVacateModal}
              variant='outline'
              size='sm'
              className='bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100'
            >
              {profile?.expected_vacate_date ? 'Edit' : 'Set'}
            </Button>
          </div>
          <div className='mt-3 pt-3 border-t border-slate-100'>
            <p className='text-xs text-slate-500'>
              <Info className='w-3 h-3 inline mr-1 text-purple-600' />
              This helps your PG owner plan for new tenants. The date will be visible to your PG owner.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Stats */}
      {ticketStats?.overview && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Ticket className='w-5 h-5 text-indigo-600' />
              My Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-4 gap-4'>
              <div className='text-center'>
                <p className='text-2xl font-bold text-slate-900'>{ticketStats.overview.total}</p>
                <p className='text-xs text-slate-500 mt-1'>Total</p>
              </div>
              <div className='text-center'>
                <p className='text-2xl font-bold text-amber-600'>{ticketStats.overview.open}</p>
                <p className='text-xs text-slate-500 mt-1'>Open</p>
              </div>
              <div className='text-center'>
                <p className='text-2xl font-bold text-blue-600'>{ticketStats.overview.inProgress}</p>
                <p className='text-xs text-slate-500 mt-1'>In Progress</p>
              </div>
              <div className='text-center'>
                <p className='text-2xl font-bold text-green-600'>{ticketStats.overview.resolved}</p>
                <p className='text-xs text-slate-500 mt-1'>Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unpaid Alert */}
      {profile?.unpaid_months && profile.unpaid_months.length > 0 && (
        <Card className='border-l-4 border-l-red-500 border-red-200'>
          <CardContent className='p-4 flex items-center gap-4'>
            <div className='w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center'>
              <AlertCircle className='w-6 h-6 text-red-600' />
            </div>
            <div className='flex-1'>
              <p className='text-sm font-bold text-red-600'>
                Unpaid Month{profile.unpaid_months.length > 1 ? 's' : ''}
              </p>
              {profile.unpaid_months.map((m: { cycle_start: string; cycle_end: string }, i: number) => (
                <p key={i} className='text-xs text-slate-500 mt-1'>
                  {formatDate(m.cycle_start)} – {formatDate(m.cycle_end)}
                </p>
              ))}
            </div>
            <div className='bg-red-500 text-white rounded-lg px-3 py-1'>
              <p className='text-sm font-bold'>{profile.unpaid_months.length}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PG Details */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building className='w-5 h-5 text-indigo-600' />
            My PG
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
              <MapPin className='w-4 h-4 text-slate-400' />
              <span className='text-xs text-slate-500 w-16'>Address</span>
              <span className='text-sm font-medium text-slate-900 flex-1'>{profile?.pg_locations?.address || 'N/A'}</span>
            </div>
            <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
              <MapPin className='w-4 h-4 text-slate-400' />
              <span className='text-xs text-slate-500 w-16'>City</span>
              <span className='text-sm font-medium text-slate-900 flex-1'>{profile?.pg_locations?.city?.name || 'N/A'}</span>
            </div>
            <div className='flex items-center gap-3 py-2 border-b border-slate-100'>
              <RefreshCw className='w-4 h-4 text-slate-400' />
              <span className='text-xs text-slate-500 w-16'>Cycle Type</span>
              <span className='text-sm font-medium text-slate-900 flex-1'>{profile?.pg_locations?.rent_cycle_type || 'N/A'}</span>
            </div>
            <div className='flex items-center gap-3 py-2'>
              <LogIn className='w-4 h-4 text-slate-400' />
              <span className='text-xs text-slate-500 w-16'>Check-in</span>
              <span className='text-sm font-medium text-slate-900 flex-1'>{formatDate(profile?.check_in_date)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Receipt className='w-5 h-5 text-indigo-600' />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!profile?.rent_payments?.length ? (
            <div className='text-center py-8'>
              <Receipt className='w-10 h-10 text-slate-300 mx-auto mb-2' />
              <p className='text-sm text-slate-500'>No payments yet</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {profile.rent_payments.slice(0, 3).map((p, index) => (
                <div key={p.s_no} className={`flex items-center gap-3 py-3 ${index < 2 ? 'border-b border-slate-100' : ''}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.payment_method === 'GPAY' ? 'bg-sky-100' : 'bg-green-100'}`}>
                    {p.payment_method === 'GPAY' ? (
                      <Phone className='w-4 h-4 text-sky-600' />
                    ) : (
                      <DollarSign className='w-4 h-4 text-green-600' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-slate-900'>
                      {formatDate(p.tenant_rent_cycles?.cycle_start)} – {formatDate(p.tenant_rent_cycles?.cycle_end)}
                    </p>
                    <p className='text-xs text-slate-500'>{p.payment_method} · {formatDate(p.payment_date)}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-bold text-slate-900'>{formatAmount(p.amount_paid)}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      p.status === 'PAID' ? 'bg-green-100 text-green-600' : 
                      p.status === 'PARTIAL' ? 'bg-amber-100 text-amber-600' : 
                      'bg-red-100 text-red-600'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vacate Date Modal */}
      <Dialog open={vacateDateModalOpen} onOpenChange={setVacateDateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expected Vacate Date</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='p-3 bg-purple-50 rounded-lg border border-purple-200'>
              <p className='text-xs text-slate-600'>
                Select the date you plan to leave. This is different from the actual checkout date — it's for planning purposes only.
              </p>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='vacate-date'>Expected Vacate Date</Label>
              <Input
                id='vacate-date'
                type='date'
                value={newVacateDate}
                onChange={(e) => setNewVacateDate(e.target.value)}
              />
            </div>
            {newVacateDate && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setNewVacateDate('')}
                className='w-full bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
              >
                Clear Date
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setVacateDateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVacateDate} disabled={vacateLoading}>
              {vacateLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
