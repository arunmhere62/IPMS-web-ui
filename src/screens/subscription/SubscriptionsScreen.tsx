import { useMemo, useState } from 'react'
import { CheckCircle2, CircleAlert, Tag } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import {
  type SubscriptionPlan,
  useGetPlansQuery,
} from '@/services/subscriptionApi'

export function SubscriptionsScreen() {
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)

  const {
    data: plansResponse,
    isLoading: plansLoading,
    error: plansError,
  } = useGetPlansQuery()

  const playStoreUrl = (() => {
    const meta = import.meta as unknown as { env?: Record<string, unknown> }
    const value = meta.env?.VITE_PLAY_STORE_URL
    return typeof value === 'string' && value.length > 0
      ? value
      : 'https://play.google.com/store'
  })()

  const plans = plansResponse?.data || []

  const apiErrorMessage = useMemo(() => {
    const err = plansError
    if (!err) return null

    const maybe = err as unknown as {
      data?: { message?: string } | { error?: string } | unknown
      message?: string
      error?: string
    }

    const fromData = (maybe.data as { message?: string; error?: string } | undefined)?.message
      ?? (maybe.data as { message?: string; error?: string } | undefined)?.error

    return fromData || maybe.message || maybe.error || 'Unable to load subscription plans.'
  }, [plansError])

  const fetchError = apiErrorMessage

  const formatPrice = (price: string | number, currency?: string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (!Number.isFinite(numPrice) || numPrice <= 0) return 'Free'
    if (currency && currency.toUpperCase() !== 'INR') {
      return `${currency.toUpperCase()} ${numPrice.toLocaleString()}`
    }
    return `₹${numPrice.toLocaleString('en-IN')}`
  }

  const formatDuration = (days: number) => {
    if (days === 30) return 'Monthly'
    if (days === 90) return 'Quarterly'
    if (days === 180) return 'Half-Yearly'
    if (days === 365) return 'Yearly'
    return `${days} Days`
  }

  const getIncludedItems = (plan: SubscriptionPlan): string[] => {
    const included: string[] = Array.isArray(plan.features) ? [...plan.features] : []

    const limitLine = (label: string, value: number | null | undefined) => {
      if (value === undefined) return
      if (value === null) {
        included.push(`Unlimited ${label}`)
        return
      }
      included.push(`Up to ${value} ${label}`)
    }

    const limits = plan.limits

    limitLine('PG Locations', limits?.max_pg_locations ?? plan.max_pg_locations)
    limitLine('Tenants', limits?.max_tenants ?? plan.max_tenants)
    limitLine('Rooms', limits?.max_rooms ?? plan.max_rooms)
    limitLine('Beds', limits?.max_beds ?? plan.max_beds)
    limitLine('Employees', limits?.max_employees ?? plan.max_employees)
    limitLine('Users', limits?.max_users ?? plan.max_users)
    limitLine('Invoices / Month', limits?.max_invoices_per_month ?? plan.max_invoices_per_month)
    limitLine('SMS / Month', limits?.max_sms_per_month ?? plan.max_sms_per_month)
    limitLine('WhatsApp / Month', limits?.max_whatsapp_per_month ?? plan.max_whatsapp_per_month)

    return included
  }

  const handleSubscribe = () => {
    setDownloadDialogOpen(true)
  }

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isPremium = plan.name.toLowerCase().includes('premium')
    const isFreePlan = Boolean(plan.is_free)
    const isTrialPlan = Boolean(plan.is_trial)
    const isActivePlan = plan.is_active !== false

    const included = getIncludedItems(plan)

    return (
      <Card
        key={plan.s_no}
        className={
          'group relative flex h-full flex-col overflow-hidden border bg-card shadow-sm transition ' +
          'hover:shadow-md ' +
          (isPremium ? 'border-yellow-300/80 ' : '')
        }
      >
        <div
          className={
            'w-full px-6 pb-5 pt-6 text-left ' +
            (isPremium
              ? 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800'
              : 'bg-gradient-to-br from-muted/60 to-muted')
          }
        >
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <div className={isPremium ? 'truncate text-lg font-semibold text-white' : 'truncate text-lg font-semibold'}>
                  {plan.name}
                </div>
                {isTrialPlan ? (
                  <Badge variant='outline' className={isPremium ? 'border-white/30 text-white/90' : ''}>
                    TRIAL
                  </Badge>
                ) : null}
                {isFreePlan ? (
                  <Badge variant='secondary' className={isPremium ? 'bg-white/15 text-white' : ''}>
                    FREE
                  </Badge>
                ) : null}
                {!isActivePlan ? <Badge variant='destructive'>INACTIVE</Badge> : null}
              </div>
              <div className={isPremium ? 'mt-2 line-clamp-2 text-sm text-white/75' : 'mt-2 line-clamp-2 text-sm text-muted-foreground'}>
                {plan.description}
              </div>
            </div>

            <Badge
              variant={isPremium ? 'default' : 'outline'}
              className={
                'shrink-0 gap-1 ' +
                (isPremium ? 'border-white/20 bg-white/10 text-white hover:bg-white/10' : '')
              }
            >
              <Tag className='size-3' />
              {formatDuration(plan.duration)}
            </Badge>
          </div>

          <div className='mt-5 flex items-end justify-between gap-4'>
            <div className='flex items-baseline gap-2'>
              {isFreePlan ? (
                <>
                  <div className={isPremium ? 'text-base font-semibold text-white/60 line-through' : 'text-base font-semibold text-muted-foreground line-through'}>
                    {formatPrice(plan.price, plan.currency)}
                  </div>
                  <div className={isPremium ? 'text-4xl font-semibold tracking-tight text-white' : 'text-4xl font-semibold tracking-tight'}>
                    Free
                  </div>
                </>
              ) : (
                <div className={isPremium ? 'text-4xl font-semibold tracking-tight text-white' : 'text-4xl font-semibold tracking-tight'}>
                  {formatPrice(plan.price, plan.currency)}
                </div>
              )}
              <div className={isPremium ? 'pb-1 text-sm text-white/70' : 'pb-1 text-sm text-muted-foreground'}>
                / {formatDuration(plan.duration)}
              </div>
            </div>
          </div>
        </div>

        <CardContent className='flex flex-1 flex-col pt-4'>
          <div className='flex items-center justify-between gap-3'>
            <div className='text-sm font-semibold'>Included</div>
            <div className='text-xs text-muted-foreground'>{included.length} items</div>
          </div>

          <div className='mt-3 grid gap-2'>
            {included.length === 0 ? (
              <div className='text-sm text-muted-foreground'>No feature details provided.</div>
            ) : (
              <div className='grid gap-2 sm:grid-cols-1'>
                {included.map((feature, idx) => (
                  <div key={`${plan.s_no}-${idx}`} className='flex items-start gap-2 rounded-md border bg-background/60 px-3 py-2 text-sm'>
                    <CheckCircle2 className='mt-0.5 size-4 text-emerald-600' />
                    <div className='min-w-0 text-muted-foreground'>{feature}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='mt-auto pt-5'>
            <Button
              type='button'
              className='w-full'
              onClick={handleSubscribe}
              disabled={plansLoading || !isActivePlan}
            >
              Subscribe Now
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='container mx-auto max-w-7xl px-4 py-10'>
      <div className='overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <div className='text-2xl font-semibold tracking-tight sm:text-3xl'>Subscription Plans</div>
            <div className='mt-2 max-w-2xl text-sm text-muted-foreground'>
              Pick a plan that fits your needs. Subscription checkout is available in the mobile app.
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Badge variant='secondary'>{plans.length} Plans</Badge>
            <Badge variant='outline'>Monthly / Yearly supported</Badge>
          </div>
        </div>
      </div>

      <div className='mt-6'>
        {fetchError ? (
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Error Loading Subscription Plans</AlertTitle>
            <AlertDescription>
              <p>{fetchError}</p>
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className='mt-8'>
        {plansLoading ? (
          <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='h-[420px] rounded-xl border bg-card/60 p-6'>
                <div className='h-5 w-40 rounded bg-muted' />
                <div className='mt-3 h-4 w-64 rounded bg-muted' />
                <div className='mt-6 h-10 w-48 rounded bg-muted' />
                <div className='mt-6 grid gap-2'>
                  <div className='h-9 rounded bg-muted' />
                  <div className='h-9 rounded bg-muted' />
                  <div className='h-9 rounded bg-muted' />
                </div>
                <div className='mt-8 h-10 rounded bg-muted' />
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className='rounded-lg border bg-card px-4 py-6 text-sm text-muted-foreground'>
            No plans available.
          </div>
        ) : (
          <>
            <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
              {plans.map((p) => (
                <div key={p.s_no} className='h-full'>
                  {renderPlanCard(p)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AlertDialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Subscribe from Mobile App</AlertDialogTitle>
            <AlertDialogDescription>
              To subscribe, please download our mobile app and complete the subscription from there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(playStoreUrl, '_blank', 'noreferrer')
              }}
            >
              Open Play Store
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
