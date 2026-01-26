import { useMemo } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/form/page-header'
import { type SubscriptionPlan } from '@/services/subscriptionApi'

type Pricing = {
  currency: string
  base_price: number
  cgst_amount: number
  sgst_amount: number
  total_price_including_gst: number
}

type LocationState = {
  title?: string
  paymentUrl?: string
  orderId?: string
  subscriptionId?: number
  plan?: SubscriptionPlan
  pricing?: Pricing
}

const formatDuration = (days: number) => {
  if (days === 30) return 'Monthly'
  if (days === 90) return 'Quarterly'
  if (days === 180) return 'Half-Yearly'
  if (days === 365) return 'Yearly'
  return `${days} Days`
}

const formatCurrencyAmount = (amount: number | string | null | undefined, currency?: string) => {
  const num = typeof amount === 'string' ? Number.parseFloat(amount) : (amount ?? 0)
  if (!Number.isFinite(num)) {
    return '—'
  }
  if (currency && currency.toUpperCase() !== 'INR') {
    return `${currency.toUpperCase()} ${num.toLocaleString()}`
  }
  return `₹${num.toLocaleString('en-IN')}`
}

export function SubscriptionConfirmScreen() {
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState

  const plan = state.plan
  const pricing = state.pricing
  const paymentUrl = state.paymentUrl

  const currency = pricing?.currency ?? plan?.currency
  const basePrice = pricing?.base_price
  const cgstAmount = pricing?.cgst_amount ?? plan?.gst_breakdown?.cgst_amount
  const sgstAmount = pricing?.sgst_amount ?? plan?.gst_breakdown?.sgst_amount
  const total =
    pricing?.total_price_including_gst
    ?? plan?.gst_breakdown?.total_price_including_gst
    ?? (plan?.price ? Number(plan.price) : undefined)

  const hasPayload = useMemo(() => Boolean(paymentUrl && plan), [paymentUrl, plan])

  if (!hasPayload) {
    return <Navigate to='/subscriptions' replace />
  }

  return (
    <div className='container mx-auto max-w-3xl px-3 py-6'>
      <PageHeader
        title={state.title || 'Confirm'}
        subtitle='Review plan details before payment'
        right={
          <Button asChild variant='outline' size='sm'>
            <Link to='/subscriptions'>Back</Link>
          </Button>
        }
      />

      <div className='mt-6 grid gap-4'>
        <Card>
          <CardContent className='p-5'>
            <div className='text-base font-semibold'>Plan Details</div>

            <div className='mt-4 grid gap-3'>
              <div>
                <div className='text-xs text-muted-foreground'>Plan</div>
                <div className='mt-1 text-lg font-semibold'>{plan?.name || '—'}</div>
              </div>

              <div className='grid gap-3 sm:grid-cols-2'>
                <div>
                  <div className='text-xs text-muted-foreground'>Duration</div>
                  <div className='mt-1 text-sm font-semibold'>
                    {typeof plan?.duration === 'number' ? formatDuration(plan.duration) : '—'}
                  </div>
                </div>
                <div>
                  <div className='text-xs text-muted-foreground'>Total (incl. GST)</div>
                  <div className='mt-1 text-lg font-semibold text-primary'>
                    {formatCurrencyAmount(total, currency)}
                  </div>
                </div>
              </div>

              {plan?.description ? (
                <div>
                  <div className='text-xs text-muted-foreground'>Description</div>
                  <div className='mt-1 text-sm text-foreground'>{plan.description}</div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-5'>
            <div className='text-base font-semibold'>GST Breakdown (18%)</div>

            <div className='mt-4 grid gap-3 text-sm'>
              <div className='flex items-center justify-between gap-3'>
                <div className='text-muted-foreground'>Base Amount</div>
                <div className='font-semibold'>{formatCurrencyAmount(basePrice, currency)}</div>
              </div>

              <div className='flex items-center justify-between gap-3'>
                <div className='text-muted-foreground'>CGST (9%)</div>
                <div className='font-semibold'>{formatCurrencyAmount(cgstAmount, currency)}</div>
              </div>

              <div className='flex items-center justify-between gap-3'>
                <div className='text-muted-foreground'>SGST (9%)</div>
                <div className='font-semibold'>{formatCurrencyAmount(sgstAmount, currency)}</div>
              </div>

              <div className='h-px w-full bg-border' />

              <div className='flex items-center justify-between gap-3'>
                <div className='font-semibold'>Total Payable</div>
                <div className='text-base font-semibold'>
                  {formatCurrencyAmount(total, currency)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end'>
          <Button asChild variant='outline'>
            <Link to='/subscriptions'>Cancel</Link>
          </Button>
          <Button
            onClick={() => {
              if (!paymentUrl) return
              window.open(String(paymentUrl), '_blank', 'noreferrer')
            }}
            disabled={!paymentUrl}
          >
            Proceed to Payment
          </Button>
        </div>
      </div>
    </div>
  )
}
