import { useEffect, useState } from 'react'
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
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)

  const playStoreUrl =
    ((import.meta as any).env?.VITE_PLAY_STORE_URL as string | undefined) ||
    'https://play.google.com/store'

  const {
    data: plansResponse,
    isLoading: plansLoading,
    error: plansError,
  } = useGetPlansQuery()

  const plans = plansResponse?.data || []

  useEffect(() => {
    const err: any = plansError
    if (!err) {
      setFetchError(null)
      return
    }
    setFetchError((err as any)?.data?.message || (err as any)?.message || 'Unable to load subscription plans.')
  }, [plansError])

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
    if (plan.max_pg_locations != null) included.push(`Up to ${plan.max_pg_locations} PG Locations`)
    if (plan.max_tenants != null) included.push(`Up to ${plan.max_tenants} Tenants`)
    if (plan.max_beds != null) included.push(`Up to ${plan.max_beds} Beds`)
    if (plan.max_rooms != null) included.push(`Up to ${plan.max_rooms} Rooms`)
    if (plan.max_employees != null) included.push(`Up to ${plan.max_employees} Employees`)
    if (plan.max_users != null) included.push(`Up to ${plan.max_users} Users`)
    return included
  }

  const handleSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan.s_no)
    setDownloadDialogOpen(true)
  }

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isSelected = selectedPlan === plan.s_no
    const isPremium = plan.name.toLowerCase().includes('premium')

    return (
      <Card
        key={plan.s_no}
        className={
          'flex h-full flex-col overflow-hidden py-4 ' +
          (isSelected ? 'ring-2 ring-primary ' : '') +
          (isPremium ? 'border-yellow-300 ' : '')
        }
      >
        <div className={isPremium ? 'bg-gradient-to-r from-neutral-950 to-neutral-800 px-6 py-5' : 'bg-muted px-6 py-5'}>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <div className='flex items-center gap-2'>
                <div className={isPremium ? 'text-base font-semibold text-white' : 'text-base font-semibold'}>
                  {plan.name}
                </div>
              </div>
              <div className={isPremium ? 'mt-1 text-sm text-white/80' : 'mt-1 text-sm text-muted-foreground'}>
                {plan.description}
              </div>
            </div>

            <Badge variant={isPremium ? 'default' : 'outline'} className='gap-1'>
              <Tag className='size-3' />
              {formatDuration(plan.duration)}
            </Badge>
          </div>

          <div className='mt-4 flex items-baseline gap-2'>
            <div className={isPremium ? 'text-3xl font-semibold text-white' : 'text-3xl font-semibold'}>
              {formatPrice(plan.price, plan.currency)}
            </div>
            <div className={isPremium ? 'text-sm text-white/70' : 'text-sm text-muted-foreground'}>
              / {formatDuration(plan.duration)}
            </div>
          </div>
        </div>

        <CardContent className='flex flex-1 flex-col pt-4'>
          <div className='text-sm font-semibold'>What&apos;s Included</div>
          <div className='mt-3 grid gap-2'>
            {getIncludedItems(plan)
              .slice(0, 5)
              .map((feature, idx) => (
                <div key={`${plan.s_no}-${idx}`} className='flex items-start gap-2 text-sm'>
                  <CheckCircle2 className='mt-0.5 size-4 text-emerald-600' />
                  <div className='text-muted-foreground'>{feature}</div>
                </div>
              ))}
          </div>

          <div className='mt-auto pt-5'>
            <Button
              type='button'
              className='w-full'
              onClick={() => handleSubscribe(plan)}
              disabled={plansLoading}
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
      <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <div className='text-2xl font-semibold'>Subscription Plans</div>
          <div className='mt-1 text-sm text-muted-foreground'>Choose the perfect plan for your business.</div>
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
          <div className='rounded-lg border bg-card px-4 py-6 text-sm text-muted-foreground'>
            Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <div className='rounded-lg border bg-card px-4 py-6 text-sm text-muted-foreground'>
            No plans available.
          </div>
        ) : (
          <>
            <div className='mb-4 flex items-center justify-center'>
              <Badge variant='secondary'>{plans.length} Plans Available</Badge>
            </div>
            <div className='grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3'>
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
              To subscribe, please download our mobile app from Google Play Store.
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
