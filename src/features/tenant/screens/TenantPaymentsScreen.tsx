import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGetTenantProfileQuery } from '../api/tenantPortalApi'
import { getCookie } from '@/lib/cookies'
import { Receipt, Wallet, ArrowDownLeft, Info, Calendar } from 'lucide-react'

export function TenantPaymentsScreen() {
  const accessToken = getCookie('access_token')

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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      PAID: { bg: 'bg-green-100 text-green-600', text: 'PAID' },
      PARTIAL: { bg: 'bg-amber-100 text-amber-600', text: 'PARTIAL' },
      PENDING: { bg: 'bg-red-100 text-red-600', text: 'PENDING' },
    }
    const config = statusConfig[status] || { bg: 'bg-slate-100 text-slate-600', text: status }
    return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${config.bg}`}>{config.text}</span>
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-slate-500'>Loading...</div>
      </div>
    )
  }

  const rentPayments = profile?.rent_payments || []
  const advancePayments = profile?.advance_payments || []
  const refundPayments = profile?.refund_payments || []

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-slate-900'>Payments</h1>
        <p className='text-slate-500'>View your payment history and dues</p>
      </div>

      {/* Summary Chips */}
      <div className='grid grid-cols-3 gap-4'>
        <Card className='bg-blue-50 border-blue-200'>
          <CardContent className='p-4 text-center'>
            <p className='text-2xl font-bold text-slate-900'>{rentPayments.length}</p>
            <p className='text-xs font-semibold text-blue-600 mt-1'>Rent</p>
          </CardContent>
        </Card>
        <Card className='bg-purple-50 border-purple-200'>
          <CardContent className='p-4 text-center'>
            <p className='text-2xl font-bold text-slate-900'>{advancePayments.length}</p>
            <p className='text-xs font-semibold text-purple-600 mt-1'>Advance</p>
          </CardContent>
        </Card>
        <Card className='bg-green-50 border-green-200'>
          <CardContent className='p-4 text-center'>
            <p className='text-2xl font-bold text-slate-900'>{refundPayments.length}</p>
            <p className='text-xs font-semibold text-green-600 mt-1'>Refunds</p>
          </CardContent>
        </Card>
      </div>

      {/* Rent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Receipt className='w-5 h-5 text-blue-600' />
            Rent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!rentPayments.length ? (
            <div className='text-center py-8'>
              <Receipt className='w-10 h-10 text-slate-300 mx-auto mb-2' />
              <p className='text-sm text-slate-500'>No rent payments found</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {rentPayments.map((p) => (
                <div key={p.s_no} className='flex items-center gap-3 py-3 border-b border-slate-100 last:border-0'>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.payment_method === 'GPAY' ? 'bg-sky-100' : 'bg-green-100'}`}>
                    <span className={`text-xs font-bold ${p.payment_method === 'GPAY' ? 'text-sky-600' : 'text-green-600'}`}>
                      {p.payment_method === 'GPAY' ? 'GPay' : 'Cash'}
                    </span>
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-slate-900'>
                      {formatDate(p.tenant_rent_cycles?.cycle_start)} – {formatDate(p.tenant_rent_cycles?.cycle_end)}
                    </p>
                    <p className='text-xs text-slate-500'>{p.payment_method} · {formatDate(p.payment_date)}</p>
                    {p.remarks && <p className='text-xs text-slate-400 italic mt-1'>"{p.remarks}"</p>}
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-bold text-slate-900'>{formatAmount(p.amount_paid)}</p>
                    {getStatusBadge(p.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advance Payments */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Wallet className='w-5 h-5 text-purple-600' />
            Advance Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!advancePayments.length ? (
            <div className='text-center py-8'>
              <Wallet className='w-10 h-10 text-slate-300 mx-auto mb-2' />
              <p className='text-sm text-slate-500'>No advance payments</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {advancePayments.map((p) => (
                <div key={p.s_no} className='flex items-center gap-3 py-3 border-b border-slate-100 last:border-0'>
                  <div className='w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center'>
                    <span className='text-xs font-bold text-purple-600'>Adv</span>
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-slate-900'>{formatDate(p.payment_date)}</p>
                    <p className='text-xs text-slate-500'>{p.payment_method}</p>
                    {p.remarks && <p className='text-xs text-slate-400 italic mt-1'>"{p.remarks}"</p>}
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-bold text-purple-600'>{formatAmount(p.amount_paid)}</p>
                    {getStatusBadge(p.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refunds */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ArrowDownLeft className='w-5 h-5 text-green-600' />
            Refunds
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!refundPayments.length ? (
            <div className='text-center py-8'>
              <ArrowDownLeft className='w-10 h-10 text-slate-300 mx-auto mb-2' />
              <p className='text-sm text-slate-500'>No refunds found</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {refundPayments.map((p) => (
                <div key={p.s_no} className='flex items-center gap-3 py-3 border-b border-slate-100 last:border-0'>
                  <div className='w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center'>
                    <span className='text-xs font-bold text-green-600'>Ref</span>
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-slate-900'>{formatDate(p.payment_date)}</p>
                    <p className='text-xs text-slate-500'>{p.payment_method}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-bold text-green-600'>{formatAmount(p.amount_paid)}</p>
                    {getStatusBadge(p.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Flags */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Info className='w-5 h-5 text-slate-600' />
            Payment Flags
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-slate-600'>Rent Paid</span>
            <span className={`text-sm font-semibold ${profile?.is_rent_paid ? 'text-green-600' : 'text-red-600'}`}>
              {profile?.is_rent_paid ? '✓ Yes' : '✗ No'}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-slate-600'>Advance Paid</span>
            <span className={`text-sm font-semibold ${profile?.is_advance_paid ? 'text-green-600' : 'text-red-600'}`}>
              {profile?.is_advance_paid ? '✓ Yes' : '✗ No'}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-slate-600'>Partial Rent</span>
            <span className={`text-sm font-semibold ${profile?.is_rent_partial ? 'text-amber-600' : 'text-slate-600'}`}>
              {profile?.is_rent_partial ? 'Yes' : 'No'}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-slate-600'>Partial Due</span>
            <span className={`text-sm font-semibold ${(profile?.partial_due_amount ?? 0) > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
              {formatAmount(profile?.partial_due_amount ?? 0)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Rent Cycles */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='w-5 h-5 text-slate-600' />
            Rent Cycles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!profile?.tenant_rent_cycles?.length ? (
            <div className='text-center py-8'>
              <Calendar className='w-10 h-10 text-slate-300 mx-auto mb-2' />
              <p className='text-sm text-slate-500'>No rent cycles</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {profile.tenant_rent_cycles.map((c, i) => {
                const paid = profile.rent_payments?.some((p) => p.cycle_id === c.s_no && p.status === 'PAID')
                return (
                  <div key={c.s_no} className='flex items-center gap-3 py-3 border-b border-slate-100 last:border-0'>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${paid ? 'bg-green-100' : 'bg-red-100'}`}>
                      <span className={`text-sm font-bold ${paid ? 'text-green-600' : 'text-red-600'}`}>{i + 1}</span>
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm font-medium text-slate-900'>
                        {formatDate(c.cycle_start)} – {formatDate(c.cycle_end)}
                      </p>
                      <p className='text-xs text-slate-500'>{c.cycle_type}</p>
                    </div>
                    {getStatusBadge(paid ? 'PAID' : 'PENDING')}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
