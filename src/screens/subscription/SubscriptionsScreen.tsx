import { useMemo, useState } from 'react'
import {
  type SubscriptionPlan,
  useGetPlansQuery,
  useGetSubscriptionStatusQuery,
  useRenewSubscriptionMutation,
  useSubscribeToPlanMutation,
} from '@/services/subscriptionApi'
import { CheckCircle2, ChevronDown, CircleAlert, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { PageHeader } from '@/components/form/page-header'

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
): {
  currency: string
  base_price: number
  cgst_amount: number
  sgst_amount: number
  total_price_including_gst: number
} | null => {
  if (!isRecord(value)) return null
  const maybePricing = value.pricing
  if (isRecord(maybePricing)) {
    const currency = readStringField(maybePricing, 'currency')
    const base_price = readNumberField(maybePricing, 'base_price')
    const cgst_amount = readNumberField(maybePricing, 'cgst_amount')
    const sgst_amount = readNumberField(maybePricing, 'sgst_amount')
    const total_price_including_gst = readNumberField(
      maybePricing,
      'total_price_including_gst'
    )

    if (
      currency &&
      base_price !== null &&
      cgst_amount !== null &&
      sgst_amount !== null &&
      total_price_including_gst !== null
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
    const direct =
      readNumberField(maybeSub, 's_no') ?? readNumberField(maybeSub, 'id')
    if (direct !== null) return direct
  }
  if (isRecord(value.data)) return readSubscriptionId(value.data)
  return null
}

export function SubscriptionsScreen() {
  const navigate = useNavigate()
  const [expandedPlans, setExpandedPlans] = useState<Record<number, boolean>>(
    {}
  )
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

  const [subscribeToPlan, { isLoading: subscribing }] =
    useSubscribeToPlanMutation()
  const [renewSubscription, { isLoading: renewing }] =
    useRenewSubscriptionMutation()

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
          price: Number.parseFloat(
            typeof p.price === 'string' ? p.price : String(p.price)
          ),
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

    const fromData =
      (maybe.data as { message?: string; error?: string } | undefined)
        ?.message ??
      (maybe.data as { message?: string; error?: string } | undefined)?.error

    return (
      fromData ||
      maybe.message ||
      maybe.error ||
      'Unable to load subscription plans.'
    )
  }, [plansError, statusError])

  const fetchError = apiErrorMessage

  const currentSubscription = isRecord(subscriptionStatus)
    ? subscriptionStatus.subscription
    : undefined

  const currentPlanObj: RecordValue | null =
    isRecord(currentSubscription) && isRecord(currentSubscription.plan)
      ? (currentSubscription.plan as RecordValue)
      : null

  const currentPlanIdFromPlanObj = currentPlanObj
    ? readNumberField(currentPlanObj, 's_no')
    : null

  const currentPlanId = Number(
    isRecord(currentSubscription)
      ? (currentSubscription.plan_id ?? currentPlanIdFromPlanObj ?? undefined)
      : NaN
  )
  const hasActiveSubscription = Boolean(
    isRecord(subscriptionStatus)
      ? subscriptionStatus.has_active_subscription
      : false
  )
  const currentSubscriptionId = Number(
    isRecord(currentSubscription)
      ? (currentSubscription.s_no ?? currentSubscription.id ?? NaN)
      : NaN
  )

  const busy = plansLoading || statusLoading || subscribing || renewing

  const handleSubscribeOrUpgrade = async (planId: number) => {
    try {
      setActionPlanId(planId)
      const result: unknown = await subscribeToPlan({ planId }).unwrap()
      const paymentUrl = readPaymentUrl(result)

      const plan =
        readPlan(result) ?? plans.find((p) => p.s_no === planId) ?? undefined
      const pricing = readPricing(result) ?? undefined
      const orderId = readOrderId(result) ?? undefined
      const subscriptionId = readSubscriptionId(result) ?? undefined

      if (paymentUrl) {
        navigate('/subscriptions/confirm', {
          state: {
            title: hasActiveSubscription
              ? 'Confirm Upgrade'
              : 'Confirm Subscription',
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
    if (!Number.isFinite(currentSubscriptionId) || currentSubscriptionId <= 0)
      return
    try {
      setActionPlanId(currentPlanId)
      const result: unknown = await renewSubscription({
        subscriptionId: currentSubscriptionId,
      }).unwrap()
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
    const included: string[] = Array.isArray(plan.features)
      ? [...plan.features]
      : []

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
    limitLine(
      'Invoices / Month',
      limits?.max_invoices_per_month ?? plan.max_invoices_per_month
    )
    limitLine(
      'SMS / Month',
      limits?.max_sms_per_month ?? plan.max_sms_per_month
    )
    limitLine(
      'WhatsApp / Month',
      limits?.max_whatsapp_per_month ?? plan.max_whatsapp_per_month
    )

    return included
  }

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isPremium = plan.name.toLowerCase().includes('premium')
    const isFreePlan = Boolean(plan.is_free)
    const isTrialPlan = Boolean(plan.is_trial)
    const isActivePlan = plan.is_active !== false
    const isRecommended = plan.s_no === recommendedPlanSno
    const isCurrentPlan =
      Number.isFinite(currentPlanId) && plan.s_no === currentPlanId
    const actionLoading =
      Boolean(actionPlanId) &&
      actionPlanId === plan.s_no &&
      (subscribing || renewing)

    const included = getIncludedItems(plan)
    const defaultVisibleCount = 4
    const visible = included.slice(0, defaultVisibleCount)
    const hidden = included.slice(defaultVisibleCount)
    const isExpanded = Boolean(expandedPlans[plan.s_no])

    return (
      <div
        key={plan.s_no}
        className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl ${
          isRecommended
            ? 'border-primary bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-xl shadow-primary/20 sm:scale-105'
            : isPremium
              ? 'border-yellow-400/60 bg-gradient-to-br from-yellow-50/60 via-orange-50/40 to-yellow-50/60 shadow-lg'
              : 'border-slate-200 bg-white shadow-md hover:shadow-lg'
        } ${!isActivePlan ? 'opacity-60 grayscale' : ''} `}
      >
        {isRecommended && (
          <div className='absolute top-0 right-0 rounded-bl-xl bg-gradient-to-l from-primary to-primary/90 px-4 py-1.5 text-[11px] font-bold text-white shadow-lg'>
            MOST POPULAR
          </div>
        )}

        <div className='p-4 sm:p-5'>
          <div className='text-center'>
            <h3
              className={`inline-block rounded-xl px-4 py-2 text-xl font-black tracking-tight sm:text-2xl ${isRecommended ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg' : isPremium ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg' : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900'}`}
            >
              {plan.name}
            </h3>
            <p className='mt-3 line-clamp-2 text-xs text-slate-600'>
              {plan.description}
            </p>
          </div>

          <div className='mt-5 text-center'>
            <div className='inline-flex items-baseline gap-1 rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-2'>
              {isFreePlan ? (
                <span className='text-3xl font-black text-slate-900 sm:text-4xl'>
                  FREE
                </span>
              ) : (
                <>
                  <span className='text-3xl font-black text-slate-900 sm:text-4xl'>
                    {formatPrice(plan.price, plan.currency)}
                  </span>
                </>
              )}
              <span className='text-sm font-semibold text-slate-500'>
                /{formatDuration(plan.duration).toLowerCase()}
              </span>
            </div>
          </div>

          <div className='mt-4 flex flex-wrap justify-center gap-2'>
            {isRecommended && (
              <Badge className='bg-primary px-2.5 py-1 text-xs font-bold text-white shadow-md'>
                <Sparkles className='mr-1.5 size-3' />
                Recommended
              </Badge>
            )}
            {isCurrentPlan && hasActiveSubscription && (
              <Badge className='bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-md'>
                <CheckCircle2 className='mr-1.5 size-3' />
                Active
              </Badge>
            )}
            {isTrialPlan && (
              <Badge
                variant='outline'
                className='border-2 px-2.5 py-1 text-xs font-bold'
              >
                TRIAL
              </Badge>
            )}
            {isFreePlan && (
              <Badge
                variant='secondary'
                className='px-2.5 py-1 text-xs font-bold'
              >
                FREE
              </Badge>
            )}
            {!isActivePlan && (
              <Badge
                variant='destructive'
                className='px-2.5 py-1 text-xs font-bold'
              >
                INACTIVE
              </Badge>
            )}
          </div>

          <div className='mt-6'>
            <div className='mb-4 text-center'>
              <span
                className={`inline-block rounded-lg px-3 py-1 text-xs font-black tracking-wider uppercase ${isRecommended ? 'bg-primary/10 text-primary' : isPremium ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'}`}
              >
                What's Included
              </span>
            </div>
            <div className='space-y-3'>
              {included.length === 0 ? (
                <div className='rounded-lg bg-slate-50 py-4 text-center text-xs text-slate-500'>
                  No features listed
                </div>
              ) : (
                <>
                  {visible.map((feature, idx) => (
                    <div
                      key={`${plan.s_no}-v-${idx}`}
                      className={`flex items-start gap-3 rounded-lg p-2.5 transition-all ${isRecommended ? 'hover:bg-primary/5' : isPremium ? 'hover:bg-yellow-50/50' : 'hover:bg-slate-50'}`}
                    >
                      <div
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full shadow-sm ${isPremium ? 'bg-gradient-to-br from-yellow-400 to-orange-400' : isRecommended ? 'bg-gradient-to-br from-primary to-primary/80' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'}`}
                      >
                        <CheckCircle2 className='size-3 text-white' />
                      </div>
                      <span className='text-xs leading-relaxed font-semibold text-slate-700'>
                        {feature}
                      </span>
                    </div>
                  ))}
                  {hidden.length > 0 && (
                    <Collapsible
                      open={isExpanded}
                      onOpenChange={(open) =>
                        setExpandedPlans(open ? { [plan.s_no]: true } : {})
                      }
                    >
                      <CollapsibleContent className='space-y-3'>
                        {hidden.map((feature, idx) => (
                          <div
                            key={`${plan.s_no}-h-${idx}`}
                            className={`flex items-start gap-3 rounded-lg p-2.5 transition-all ${isRecommended ? 'hover:bg-primary/5' : isPremium ? 'hover:bg-yellow-50/50' : 'hover:bg-slate-50'}`}
                          >
                            <div
                              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full shadow-sm ${isPremium ? 'bg-gradient-to-br from-yellow-400 to-orange-400' : isRecommended ? 'bg-gradient-to-br from-primary to-primary/80' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'}`}
                            >
                              <CheckCircle2 className='size-3 text-white' />
                            </div>
                            <span className='text-xs leading-relaxed font-semibold text-slate-700'>
                              {feature}
                            </span>
                          </div>
                        ))}
                      </CollapsibleContent>
                      <CollapsibleTrigger asChild>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='mt-2 h-8 w-full text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        >
                          {isExpanded
                            ? 'Show less'
                            : `Show all ${included.length} features`}
                          <ChevronDown
                            className={`ml-1.5 size-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </Collapsible>
                  )}
                </>
              )}
            </div>
          </div>

          <div className='mt-6'>
            {isCurrentPlan &&
            !hasActiveSubscription &&
            Number.isFinite(currentSubscriptionId) &&
            currentSubscriptionId > 0 ? (
              <Button
                className='w-full rounded-xl py-3 text-sm font-bold shadow-xl transition-all hover:scale-105 hover:shadow-2xl'
                onClick={handleRenew}
                disabled={busy || actionLoading}
              >
                {actionLoading ? 'Processing…' : 'Renew Now'}
              </Button>
            ) : isCurrentPlan && hasActiveSubscription ? (
              <Button
                className='w-full rounded-xl bg-slate-200 py-3 text-sm font-bold text-slate-600'
                disabled
              >
                Current Plan
              </Button>
            ) : (
              <Button
                className={`w-full rounded-xl py-3 text-sm font-bold shadow-xl transition-all hover:scale-105 hover:shadow-2xl ${
                  isRecommended
                    ? 'bg-gradient-to-r from-primary to-primary/90 text-white hover:from-primary hover:to-primary/80'
                    : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-900 hover:to-black'
                } `}
                onClick={() => handleSubscribeOrUpgrade(plan.s_no)}
                disabled={busy || actionLoading}
              >
                {actionLoading
                  ? 'Processing…'
                  : hasActiveSubscription
                    ? 'Upgrade Now'
                    : 'Get Started'}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8'>
      <PageHeader
        title='Subscription Plans'
        showBack={true}
        right={
          <div className='hidden items-center gap-2 sm:flex'>
            <Button
              asChild
              variant='outline'
              size='sm'
              className='text-xs font-bold'
            >
              <Link to='/subscriptions/history'>View History</Link>
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => void refetchStatus()}
              disabled={statusLoading}
              className='text-xs font-bold'
            >
              Refresh Status
            </Button>
          </div>
        }
      />

      <div className='mb-6 sm:mb-8'>
        <p className='mt-2 max-w-2xl text-sm text-slate-600'>
          Choose the perfect plan for your business. Scale effortlessly as you
          grow.
        </p>

        <div className='mt-4 flex flex-wrap items-center gap-2'>
          <Badge
            variant={hasActiveSubscription ? 'default' : 'outline'}
            className={`px-3 py-1 text-xs font-bold ${hasActiveSubscription ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 text-slate-700'}`}
          >
            {statusLoading
              ? 'Loading…'
              : hasActiveSubscription
                ? '✓ Active Subscription'
                : 'No Active Subscription'}
          </Badge>
          {currentPlanObj && readStringField(currentPlanObj, 'name') ? (
            <Badge variant='secondary' className='px-3 py-1 text-xs font-bold'>
              {String(readStringField(currentPlanObj, 'name'))}
            </Badge>
          ) : null}
          {isRecord(subscriptionStatus) &&
          typeof subscriptionStatus.days_remaining === 'number' ? (
            <Badge
              variant='outline'
              className='border-2 border-slate-300 px-3 py-1 text-xs font-bold text-slate-700'
            >
              {Number(subscriptionStatus.days_remaining)} days remaining
            </Badge>
          ) : null}
        </div>
      </div>

      {fetchError ? (
        <Alert variant='destructive' className='mb-4 sm:mb-6'>
          <CircleAlert className='size-4' />
          <AlertTitle className='text-sm font-bold'>
            Error Loading Subscription Plans
          </AlertTitle>
          <AlertDescription className='text-xs'>
            <p>{fetchError}</p>
          </AlertDescription>
        </Alert>
      ) : null}

      {plansLoading ? (
        <div className='grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='h-[340px] rounded-xl border-2 border-slate-200 bg-white p-3 shadow-md sm:h-[380px] sm:p-4'
            >
              <div className='h-5 w-20 rounded bg-slate-200 sm:h-6 sm:w-24' />
              <div className='mt-2 h-2.5 w-full rounded bg-slate-200 sm:mt-3 sm:h-3' />
              <div className='mt-4 h-8 w-28 rounded bg-slate-200 sm:mt-6 sm:h-10 sm:w-32' />
              <div className='mt-4 space-y-1.5 sm:mt-6 sm:space-y-2'>
                <div className='h-6 rounded bg-slate-200 sm:h-8' />
                <div className='h-6 rounded bg-slate-200 sm:h-8' />
                <div className='h-6 rounded bg-slate-200 sm:h-8' />
                <div className='h-6 rounded bg-slate-200 sm:h-8' />
              </div>
              <div className='mt-4 h-8 rounded bg-slate-200 sm:mt-6 sm:h-10' />
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className='rounded-xl border-2 border-slate-200 bg-white px-4 py-8 text-center shadow-md sm:px-6 sm:py-10'>
          <div className='text-sm font-bold text-slate-900'>
            No plans available
          </div>
          <div className='mt-1 text-xs text-slate-600'>
            Please check back later or contact support.
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3'>
          {plans.map((p) => (
            <div key={p.s_no}>{renderPlanCard(p)}</div>
          ))}
        </div>
      )}

      {/* Mobile-only action buttons */}
      <div className='mt-6 flex justify-center gap-2 sm:hidden'>
        <Button
          asChild
          variant='outline'
          size='sm'
          className='text-xs font-bold'
        >
          <Link to='/subscriptions/history'>View History</Link>
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => void refetchStatus()}
          disabled={statusLoading}
          className='text-xs font-bold'
        >
          Refresh
        </Button>
      </div>
    </div>
  )
}
