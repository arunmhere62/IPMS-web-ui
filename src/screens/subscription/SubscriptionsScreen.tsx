import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronDown, CircleAlert, Sparkles, Tag } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

import {
  type SubscriptionPlan,
  useGetPlansQuery,
  useGetSubscriptionStatusQuery,
  useRenewSubscriptionMutation,
  useSubscribeToPlanMutation,
} from '@/services/subscriptionApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const readNumberField = (obj: RecordValue, key: string): number | null => {
  const raw = obj[key]
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : null
}

const readStringField = (obj: RecordValue, key: string): string | null => {
  const raw = obj[key]
  return typeof raw === 'string' && raw.length > 0 ? raw : null
}

const readPaymentUrl = (value: unknown): string | null => {
  if (!isRecord(value)) return null
  const direct = value.payment_url
  if (typeof direct === 'string' && direct.length > 0) return direct
  if (isRecord(value.data)) return readPaymentUrl(value.data)
  return null
}

const readPlan = (value: unknown): SubscriptionPlan | null => {
  if (!isRecord(value)) return null
  const maybePlan = value.plan
  if (isRecord(maybePlan)) return maybePlan as unknown as SubscriptionPlan
  if (isRecord(value.data)) return readPlan(value.data)
  return null
}

const readPricing = (
  value: unknown
):
  | {
      currency: string
      base_price: number
      cgst_amount: number
      sgst_amount: number
      total_price_including_gst: number
    }
  | null => {
  if (!isRecord(value)) return null
  const maybePricing = value.pricing
  if (isRecord(maybePricing)) {
    const currency = readStringField(maybePricing, 'currency')
    const base_price = readNumberField(maybePricing, 'base_price')
    const cgst_amount = readNumberField(maybePricing, 'cgst_amount')
    const sgst_amount = readNumberField(maybePricing, 'sgst_amount')
    const total_price_including_gst = readNumberField(maybePricing, 'total_price_including_gst')

    if (
      currency
      && base_price !== null
      && cgst_amount !== null
      && sgst_amount !== null
      && total_price_including_gst !== null
    ) {
      return {
        currency,
        base_price,
        cgst_amount,
        sgst_amount,
        total_price_including_gst,
      }
    }
  }
  if (isRecord(value.data)) return readPricing(value.data)
  return null
}

const readOrderId = (value: unknown): string | null => {
  if (!isRecord(value)) return null
  const direct = value.order_id
  if (typeof direct === 'string' && direct.length > 0) return direct
  if (isRecord(value.data)) return readOrderId(value.data)
  return null
}

const readSubscriptionId = (value: unknown): number | null => {
  if (!isRecord(value)) return null
  const maybeSub = value.subscription
  if (isRecord(maybeSub)) {
    const direct = readNumberField(maybeSub, 's_no') ?? readNumberField(maybeSub, 'id')
    if (direct !== null) return direct
  }
  if (isRecord(value.data)) return readSubscriptionId(value.data)
  return null
}

export function SubscriptionsScreen() {
  const navigate = useNavigate()
  const [expandedPlans, setExpandedPlans] = useState<Record<number, boolean>>({})
  const [actionPlanId, setActionPlanId] = useState<number | null>(null)

  const {
    data: plansResponse,
    isLoading: plansLoading,
    error: plansError,
  } = useGetPlansQuery()

  const {
    data: subscriptionStatus,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useGetSubscriptionStatusQuery()

  const [subscribeToPlan, { isLoading: subscribing }] = useSubscribeToPlanMutation()
  const [renewSubscription, { isLoading: renewing }] = useRenewSubscriptionMutation()

  const plans = useMemo(() => plansResponse?.data || [], [plansResponse])

  const recommendedPlanSno = useMemo(() => {
    const active = plans.filter((p) => p.is_active !== false)
    const premium = active.find((p) => p.name.toLowerCase().includes('premium'))
    if (premium) return premium.s_no

    const paid = active.filter((p) => !p.is_free)
    if (paid.length > 0) {
      const withNumericPrice = paid
        .map((p) => ({
          s_no: p.s_no,
          price: Number.parseFloat(typeof p.price === 'string' ? p.price : String(p.price)),
        }))
        .filter((p) => Number.isFinite(p.price))
        .sort((a, b) => b.price - a.price)

      if (withNumericPrice.length > 0) return withNumericPrice[0].s_no
      return paid[0].s_no
    }

    return active[0]?.s_no
  }, [plans])

  const apiErrorMessage = useMemo(() => {
    const err = plansError || statusError
    if (!err) return null

    const maybe = err as unknown as {
      data?: { message?: string } | { error?: string } | unknown
      message?: string
      error?: string
    }

    const fromData = (maybe.data as { message?: string; error?: string } | undefined)?.message
      ?? (maybe.data as { message?: string; error?: string } | undefined)?.error

    return fromData || maybe.message || maybe.error || 'Unable to load subscription plans.'
  }, [plansError, statusError])

  const fetchError = apiErrorMessage

  const currentSubscription = isRecord(subscriptionStatus) ? subscriptionStatus.subscription : undefined

  const currentPlanObj: RecordValue | null =
    isRecord(currentSubscription) && isRecord(currentSubscription.plan)
      ? (currentSubscription.plan as RecordValue)
      : null

  const currentPlanIdFromPlanObj = currentPlanObj ? readNumberField(currentPlanObj, 's_no') : null

  const currentPlanId = Number(
    isRecord(currentSubscription)
      ? (currentSubscription.plan_id ?? currentPlanIdFromPlanObj ?? undefined)
      : NaN
  )
  const hasActiveSubscription = Boolean(isRecord(subscriptionStatus) ? subscriptionStatus.has_active_subscription : false)
  const currentSubscriptionId = Number(
    isRecord(currentSubscription) ? (currentSubscription.s_no ?? currentSubscription.id ?? NaN) : NaN
  )

  const busy = plansLoading || statusLoading || subscribing || renewing

  const handleSubscribeOrUpgrade = async (planId: number) => {
    try {
      setActionPlanId(planId)
      const result: unknown = await subscribeToPlan({ planId }).unwrap()
      const paymentUrl = readPaymentUrl(result)

      const plan = readPlan(result) ?? plans.find((p) => p.s_no === planId) ?? undefined
      const pricing = readPricing(result) ?? undefined
      const orderId = readOrderId(result) ?? undefined
      const subscriptionId = readSubscriptionId(result) ?? undefined

      if (paymentUrl) {
        navigate('/subscriptions/confirm', {
          state: {
            title: hasActiveSubscription ? 'Confirm Upgrade' : 'Confirm Subscription',
            paymentUrl,
            orderId,
            subscriptionId,
            plan,
            pricing,
          },
        })
      } else {
        showSuccessAlert('Subscription initiated successfully')
      }
      void refetchStatus()
    } catch (e: unknown) {
      showErrorAlert(e, 'Subscription Error')
    } finally {
      setActionPlanId(null)
    }
  }

  const handleRenew = async () => {
    if (!Number.isFinite(currentSubscriptionId) || currentSubscriptionId <= 0) return
    try {
      setActionPlanId(currentPlanId)
      const result: unknown = await renewSubscription({ subscriptionId: currentSubscriptionId }).unwrap()
      const paymentUrl = readPaymentUrl(result)
      if (paymentUrl) {
        window.open(String(paymentUrl), '_blank', 'noreferrer')
        showSuccessAlert('Continue payment in the opened page')
      } else {
        showSuccessAlert('Renewal initiated successfully')
      }
      void refetchStatus()
    } catch (e: unknown) {
      showErrorAlert(e, 'Renew Error')
    } finally {
      setActionPlanId(null)
    }
  }

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

  

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isPremium = plan.name.toLowerCase().includes('premium')
    const isFreePlan = Boolean(plan.is_free)
    const isTrialPlan = Boolean(plan.is_trial)
    const isActivePlan = plan.is_active !== false
    const isRecommended = plan.s_no === recommendedPlanSno
    const isCurrentPlan = Number.isFinite(currentPlanId) && plan.s_no === currentPlanId
    const actionLoading = Boolean(actionPlanId) && actionPlanId === plan.s_no && (subscribing || renewing)

    const included = getIncludedItems(plan)
    const defaultVisibleCount = 4
    const visible = included.slice(0, defaultVisibleCount)
    const hidden = included.slice(defaultVisibleCount)
    const isExpanded = Boolean(expandedPlans[plan.s_no])

    return (
      <Card
        key={plan.s_no}
        className={
          'group relative flex flex-col overflow-hidden border bg-white/70 shadow-sm backdrop-blur transition ' +
          'hover:-translate-y-0.5 hover:shadow-md ' +
          (isPremium ? 'border-yellow-300/70 ' : 'border-primary/10 ') +
          (isRecommended ? 'ring-2 ring-primary/35 ring-offset-2 ring-offset-background ' : '')
        }
      >
        <div
          className={
            'pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 ' +
            (isPremium
              ? 'bg-[radial-gradient(700px_circle_at_0%_0%,rgba(250,204,21,0.18),transparent_55%)]'
              : 'bg-[radial-gradient(700px_circle_at_0%_0%,rgba(37,99,235,0.12),transparent_55%)]')
          }
        />

        <div className='w-full px-6 pb-4 pt-5 text-left'>
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <div className='truncate text-base font-semibold sm:text-lg'>{plan.name}</div>
                {isRecommended ? (
                  <Badge className='gap-1'>
                    <Sparkles className='size-3' />
                    Recommended
                  </Badge>
                ) : null}
                {isCurrentPlan && hasActiveSubscription ? (
                  <Badge className='gap-1'>
                    <CheckCircle2 className='size-3' />
                    Active
                  </Badge>
                ) : null}
                {isTrialPlan ? (
                  <Badge variant='outline'>TRIAL</Badge>
                ) : null}
                {isFreePlan ? (
                  <Badge variant='secondary'>FREE</Badge>
                ) : null}
                {!isActivePlan ? <Badge variant='destructive'>INACTIVE</Badge> : null}
              </div>
              <div className='mt-1 line-clamp-2 text-sm text-muted-foreground'>
                {plan.description}
              </div>
            </div>

            <Badge variant={isPremium ? 'default' : 'outline'} className='shrink-0 gap-1'>
              <Tag className='size-3' />
              {formatDuration(plan.duration)}
            </Badge>
          </div>

          <div className='mt-4 flex flex-wrap items-end justify-between gap-4'>
            <div className='flex items-baseline gap-2'>
              {isFreePlan ? (
                <div>
                  <div className='text-sm font-semibold text-muted-foreground line-through'>
                    {formatPrice(plan.price, plan.currency)}
                  </div>
                  <div className='text-3xl font-semibold tracking-tight sm:text-4xl'>Free</div>
                </div>
              ) : (
                <div className='text-3xl font-semibold tracking-tight sm:text-4xl'>
                  {formatPrice(plan.price, plan.currency)}
                </div>
              )}
              <div className='pb-1 text-xs text-muted-foreground sm:text-sm'>
                / {formatDuration(plan.duration)}
              </div>
            </div>
          </div>
        </div>
        <CardContent className='flex flex-1 flex-col pt-4'>
          <div className='flex items-center justify-between gap-3'>
            <div className='text-sm font-semibold'>Top features</div>
            <div className='text-xs text-muted-foreground'>{included.length} items</div>
          </div>

          <div className='mt-3 grid gap-2'>
            {included.length === 0 ? (
              <div className='text-sm text-muted-foreground'>No feature details provided.</div>
            ) : (
              <>
                <div className='grid gap-2'>
                  {visible.map((feature, idx) => (
                    <div
                      key={`${plan.s_no}-v-${idx}`}
                      className='flex items-start gap-2 px-1 py-1 text-sm'
                    >
                      <CheckCircle2 className='mt-0.5 size-4 text-emerald-600' />
                      <div className='min-w-0 text-muted-foreground'>{feature}</div>
                    </div>
                  ))}
                </div>

                {hidden.length > 0 ? (
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={(open) =>
                      setExpandedPlans(open ? { [plan.s_no]: true } : {})
                    }
                  >
                    <CollapsibleContent className='mt-2 grid gap-2'>
                      {hidden.map((feature, idx) => (
                        <div
                          key={`${plan.s_no}-h-${idx}`}
                          className='flex items-start gap-2 px-1 py-1 text-sm'
                        >
                          <CheckCircle2 className='mt-0.5 size-4 text-emerald-600' />
                          <div className='min-w-0 text-muted-foreground'>{feature}</div>
                        </div>
                      ))}
                    </CollapsibleContent>

                    <div className='mt-3 flex items-center justify-between gap-3'>
                      <CollapsibleTrigger asChild>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='h-8 px-2 text-muted-foreground hover:text-foreground'
                        >
                          {isExpanded ? 'Show less' : `See all features (${included.length})`}
                          <ChevronDown
                            className={
                              'ml-1 size-4 transition-transform ' +
                              (isExpanded ? 'rotate-180' : '')
                            }
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </Collapsible>
                ) : null}
              </>
            )}
          </div>

          <div className='mt-6 flex flex-col gap-3'>
            {isCurrentPlan && !hasActiveSubscription && Number.isFinite(currentSubscriptionId) && currentSubscriptionId > 0 ? (
              <Button className='w-full' onClick={handleRenew} disabled={busy || actionLoading}>
                {actionLoading ? 'Processing…' : 'Renew'}
              </Button>
            ) : isCurrentPlan && hasActiveSubscription ? (
              <Button className='w-full' variant='secondary' disabled>
                Current Plan
              </Button>
            ) : (
              <Button
                className='w-full'
                onClick={() => handleSubscribeOrUpgrade(plan.s_no)}
                variant={isRecommended ? 'default' : 'outline'}
                disabled={busy || actionLoading}
              >
                {actionLoading ? 'Processing…' : hasActiveSubscription ? 'Upgrade' : 'Subscribe'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const backgroundDecorators = (
    <>
      <div className='pointer-events-none absolute -right-24 top-40 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl' />
      <div className='pointer-events-none absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-3xl' />
    </>
  )

  return (
    <div className='relative overflow-x-hidden'>
      {backgroundDecorators}

      <div className='container mx-auto max-w-6xl px-3 py-8 sm:py-12'>
        <div className='relative overflow-hidden rounded-3xl border border-primary/10 bg-[radial-gradient(900px_circle_at_20%_0%,rgba(37,99,235,0.14),transparent_55%),radial-gradient(900px_circle_at_85%_70%,rgba(16,185,129,0.10),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.50))] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-10'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <div className='text-2xl font-semibold tracking-tight sm:text-3xl'>Subscription Plans</div>
              <div className='mt-2 max-w-2xl text-sm text-muted-foreground'>
                Pick a plan that fits your needs. Subscription checkout is available in the mobile app.
              </div>
              <div className='mt-3 flex flex-wrap items-center gap-2'>
                <Badge variant={hasActiveSubscription ? 'default' : 'outline'}>
                  {statusLoading ? 'Status…' : hasActiveSubscription ? 'Active' : 'No Active Subscription'}
                </Badge>
                {currentPlanObj && readStringField(currentPlanObj, 'name') ? (
                  <Badge variant='secondary'>{String(readStringField(currentPlanObj, 'name'))}</Badge>
                ) : null}
                {isRecord(subscriptionStatus) && typeof subscriptionStatus.days_remaining === 'number' ? (
                  <Badge variant='outline'>{Number(subscriptionStatus.days_remaining)} days remaining</Badge>
                ) : null}
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='secondary'>{plans.length} Plans</Badge>
              <Badge variant='outline'>Monthly / Yearly supported</Badge>
              <Button asChild variant='outline' size='sm'>
                <Link to='/subscriptions/history'>History</Link>
              </Button>
              <Button variant='outline' size='sm' onClick={() => void refetchStatus()} disabled={statusLoading}>
                Refresh
              </Button>
            </div>
          </div>

          <div className='mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3'>
            <div className='rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur'>
              <div className='font-semibold text-foreground'>Subscribe via mobile</div>
              <div className='mt-1 text-xs text-muted-foreground'>Checkout happens in the Android app.</div>
            </div>
            <div className='rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur'>
              <div className='font-semibold text-foreground'>Includes invoices & reminders</div>
              <div className='mt-1 text-xs text-muted-foreground'>Rent, advance/refund, WhatsApp/SMS.</div>
            </div>
            <div className='rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur'>
              <div className='font-semibold text-foreground'>Scale as you grow</div>
              <div className='mt-1 text-xs text-muted-foreground'>Multi-PG ready with clear limits.</div>
            </div>
          </div>
        </div>
      </div>

      <div className='container mx-auto max-w-6xl px-3'>
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

        <div className='mt-10'>
          {plansLoading ? (
            <div className='grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className='h-[420px] rounded-2xl border bg-white/60 p-6 backdrop-blur'>
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
            <div className='rounded-2xl border bg-white/70 px-4 py-6 text-sm text-muted-foreground backdrop-blur'>
              No plans available.
            </div>
          ) : (
            <div className='grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3'>
              {plans.map((p) => (
                <div key={p.s_no}>{renderPlanCard(p)}</div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
