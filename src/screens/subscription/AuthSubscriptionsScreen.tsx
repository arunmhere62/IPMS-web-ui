import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  useGetPlansQuery,
  useGetSubscriptionStatusQuery,
  useSubscribeToPlanMutation,
  useRenewSubscriptionMutation,
  type SubscriptionPlan,
} from '@/services/subscriptionApi'
import { Check, CheckCircle2, Clock, Crown, History, Sparkles, Zap, Flame } from 'lucide-react'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const formatPrice = (price: string | number, currency?: string) => {
  const n = typeof price === 'string' ? parseFloat(price) : price
  if (!Number.isFinite(n) || n <= 0) return 'Free'
  if (currency && currency.toUpperCase() !== 'INR') return `${currency.toUpperCase()} ${n.toLocaleString()}`
  return `₹${n.toLocaleString('en-IN')}`
}

const formatDuration = (days: number) => {
  if (days === 30) return '/month'
  if (days === 90) return '/quarter'
  if (days === 180) return '/6 months'
  if (days === 365) return '/year'
  return `/${days} days`
}

const getFeatures = (plan: SubscriptionPlan): string[] => {
  const list: string[] = Array.isArray(plan.features) ? [...plan.features] : []
  const lim = (label: string, v: number | null | undefined) => {
    if (v === undefined) return
    list.push(v === null ? `Unlimited ${label}` : `Up to ${v} ${label}`)
  }
  const l = plan.limits
  lim('PG Locations', 'max_pg_locations' in (l ?? {}) ? l?.max_pg_locations : plan.max_pg_locations ?? null)
  lim('Tenants', 'max_tenants' in (l ?? {}) ? l?.max_tenants : plan.max_tenants ?? null)
  lim('Rooms', 'max_rooms' in (l ?? {}) ? l?.max_rooms : plan.max_rooms ?? null)
  lim('Beds', 'max_beds' in (l ?? {}) ? l?.max_beds : plan.max_beds ?? null)
  lim('Employees', 'max_employees' in (l ?? {}) ? l?.max_employees : plan.max_employees ?? null)
  lim('Users', 'max_users' in (l ?? {}) ? l?.max_users : plan.max_users ?? null)
  lim('Invoices / Month', 'max_invoices_per_month' in (l ?? {}) ? l?.max_invoices_per_month : plan.max_invoices_per_month ?? null)
  lim('SMS / Month', 'max_sms_per_month' in (l ?? {}) ? l?.max_sms_per_month : plan.max_sms_per_month ?? null)
  lim('WhatsApp / Month', 'max_whatsapp_per_month' in (l ?? {}) ? l?.max_whatsapp_per_month : plan.max_whatsapp_per_month ?? null)
  return list
}

type RecordValue = Record<string, unknown>
const isRec = (v: unknown): v is RecordValue => Boolean(v) && typeof v === 'object' && !Array.isArray(v)

const readPaymentUrl = (value: unknown): string | null => {
  if (!isRec(value)) return null
  const d = value.payment_url
  if (typeof d === 'string' && d.length > 0) return d
  if (isRec(value.data)) return readPaymentUrl(value.data)
  return null
}

const readSubscriptionId = (value: unknown): number | null => {
  if (!isRec(value)) return null
  const sub = value.subscription
  if (isRec(sub)) {
    const n = Number((sub as any).s_no ?? (sub as any).id)
    if (Number.isFinite(n) && n > 0) return n
  }
  if (isRec(value.data)) return readSubscriptionId(value.data)
  return null
}

function PlanCard({
  plan, recommended, idx, isActive, isExpired,
  busy, onSubscribe, onRenew, actionLoading,
}: {
  plan: SubscriptionPlan
  recommended: boolean
  idx: number
  isActive: boolean
  isExpired: boolean
  busy: boolean
  actionLoading: boolean
  onSubscribe: () => void
  onRenew: () => void
}) {
  const isFreePlan = Boolean(plan.is_free)
  const isTrialPlan = Boolean(plan.is_trial)
  const features = getFeatures(plan)
  const Icon = idx === 0 ? Zap : idx === 1 ? Flame : Sparkles

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md ${
      isActive ? 'border-emerald-500 ring-2 ring-emerald-500/20' : recommended ? 'border-primary ring-2 ring-primary/15' : 'border-border'
    }`}>

      {/* Top accent bar */}
      <div className={`h-1 w-full ${isActive ? 'bg-emerald-500' : recommended ? 'bg-primary' : 'bg-muted'}`} />

      <div className='p-5 sm:p-6'>
        {/* Icon + badges row */}
        <div className='flex items-start justify-between gap-2'>
          <div className={`flex size-10 items-center justify-center rounded-xl ${
            isActive ? 'bg-emerald-50 text-emerald-600' : recommended ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          }`}>
            <Icon className='size-5' />
          </div>
          <div className='flex flex-wrap justify-end gap-1.5'>
            {isActive && (
              <Badge className='bg-emerald-500 text-white text-[10px]'>
                <CheckCircle2 className='mr-1 size-3' /> Active
              </Badge>
            )}
            {isExpired && <Badge variant='destructive' className='text-[10px]'>Expired</Badge>}
            {recommended && !isActive && <Badge className='bg-primary text-white text-[10px]'><Sparkles className='mr-1 size-3' />Popular</Badge>}
            {isTrialPlan && !isActive && <Badge variant='secondary' className='text-[10px]'>Trial</Badge>}
            {isFreePlan && !isTrialPlan && !isActive && <Badge variant='secondary' className='text-[10px]'>Free</Badge>}
          </div>
        </div>

        {/* Name & description */}
        <div className='mt-4'>
          <h3 className='text-lg font-bold text-foreground'>{plan.name}</h3>
          {plan.description && (
            <p className='mt-1 text-sm text-muted-foreground'>{plan.description}</p>
          )}
        </div>

        {/* Price */}
        <div className='mt-4 flex items-end gap-1.5'>
          <span className={`text-4xl font-black tracking-tight ${isActive ? 'text-emerald-600' : 'text-foreground'}`}>
            {formatPrice(plan.price, plan.currency)}
          </span>
          <span className='mb-1 text-sm text-muted-foreground'>{formatDuration(plan.duration)}</span>
        </div>
        {plan.gst_breakdown && plan.gst_breakdown.total_price_including_gst > 0 && (
          <p className='mt-1 text-xs text-muted-foreground'>
            ₹{plan.gst_breakdown.total_price_including_gst.toLocaleString('en-IN')} incl. GST
            <span className='ml-1 opacity-70'>(CGST {plan.gst_breakdown.cgst_rate}% + SGST {plan.gst_breakdown.sgst_rate}%)</span>
          </p>
        )}

        {/* Divider */}
        <div className='my-5 h-px bg-border' />

        {/* Features */}
        {features.length > 0 && (
          <div className='space-y-2.5'>
            <p className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>What's included</p>
            {features.map((f, i) => (
              <div key={i} className='flex items-center gap-2.5'>
                <Check className={`size-4 shrink-0 ${isActive ? 'text-emerald-500' : 'text-primary'}`} />
                <span className='text-sm text-foreground'>{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action */}
      <div className='mt-auto px-5 pb-5 sm:px-6 sm:pb-6'>
        {isActive ? (
          <div className='flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700'>
            <CheckCircle2 className='size-4' /> Your current plan
          </div>
        ) : isExpired ? (
          <Button onClick={onRenew} disabled={busy || actionLoading} className='w-full'>
            {actionLoading ? 'Processing…' : 'Renew Plan'}
          </Button>
        ) : (
          <Button
            onClick={onSubscribe}
            disabled={busy || actionLoading}
            className='w-full'
            variant={recommended ? 'default' : 'outline'}
          >
            {actionLoading ? 'Processing…' : 'Subscribe'}
          </Button>
        )}
      </div>
    </div>
  )
}

export function AuthSubscriptionsScreen() {
  const navigate = useNavigate()
  const [actionPlanId, setActionPlanId] = useState<number | null>(null)

  const { data: plansResponse, isLoading: plansLoading } = useGetPlansQuery()
  const { data: subscriptionStatus, isLoading: statusLoading, refetch: refetchStatus } = useGetSubscriptionStatusQuery()
  const [subscribeToPlan, { isLoading: subscribing }] = useSubscribeToPlanMutation()
  const [renewSubscription, { isLoading: renewing }] = useRenewSubscriptionMutation()

  const plans = useMemo(() => plansResponse?.data ?? [], [plansResponse])

  const status = subscriptionStatus as any
  const hasActive = Boolean(status?.has_active_subscription)
  const daysLeft = typeof status?.days_remaining === 'number' ? status.days_remaining : null
  const currentSub = status?.subscription as any
  const currentPlanId = Number(currentSub?.plan_id ?? currentSub?.plan?.s_no ?? NaN)
  const currentSubId = Number(currentSub?.s_no ?? currentSub?.id ?? NaN)
  const currentPlanName = currentSub?.plan?.name ?? currentSub?.subscription_plans?.name ?? null

  const recommendedSno = useMemo(() => {
    const active = plans.filter(p => p.is_active !== false)
    return active.find(p => p.name.toLowerCase().includes('premium'))?.s_no
      ?? active.filter(p => !p.is_free).sort((a, b) => Number(b.price) - Number(a.price))[0]?.s_no
  }, [plans])

  const busy = plansLoading || statusLoading || subscribing || renewing

  const handleSubscribe = async (planId: number) => {
    try {
      setActionPlanId(planId)
      const result: unknown = await subscribeToPlan({ planId }).unwrap()
      const paymentUrl = readPaymentUrl(result)
      const subscriptionId = readSubscriptionId(result)
      const plan = plans.find(p => p.s_no === planId)
      if (paymentUrl) {
        navigate('/subscriptions/confirm', {
          state: { title: hasActive ? 'Confirm Upgrade' : 'Confirm Subscription', paymentUrl, subscriptionId, plan },
        })
      } else {
        showSuccessAlert('Subscription initiated successfully')
      }
      void refetchStatus()
    } catch (e) {
      showErrorAlert(e, 'Subscription Error')
    } finally {
      setActionPlanId(null)
    }
  }

  const handleRenew = async (subId: number, planId: number) => {
    try {
      setActionPlanId(planId)
      const result: unknown = await renewSubscription({ subscriptionId: subId }).unwrap()
      const paymentUrl = readPaymentUrl(result)
      if (paymentUrl) {
        window.open(String(paymentUrl), '_blank', 'noreferrer')
        showSuccessAlert('Continue payment in the opened tab')
      } else {
        showSuccessAlert('Renewal initiated successfully')
      }
      void refetchStatus()
    } catch (e) {
      showErrorAlert(e, 'Renew Error')
    } finally {
      setActionPlanId(null)
    }
  }

  return (
    <div className='container mx-auto max-w-5xl px-4 py-8'>

      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center gap-2'>
          <Sparkles className='size-5 text-primary' />
          <h1 className='text-2xl font-bold text-foreground'>Subscription Plans</h1>
        </div>
        <p className='mt-1 text-sm text-muted-foreground'>Choose the plan that fits your PG. Billing is managed in the mobile app.</p>
      </div>

      {/* Active subscription banner */}
      {!statusLoading && hasActive && (
        <div className='mb-6 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex size-9 items-center justify-center rounded-lg bg-emerald-100'>
              <Crown className='size-4 text-emerald-600' />
            </div>
            <div>
              <p className='text-sm font-semibold text-emerald-800'>
                {currentPlanName ? `Active: ${currentPlanName}` : 'Active Subscription'}
              </p>
              {daysLeft !== null && (
                <p className='flex items-center gap-1 text-xs text-emerald-600'>
                  <Clock className='size-3' /> {daysLeft} days remaining
                </p>
              )}
            </div>
          </div>
          <Button asChild variant='outline' size='sm' className='border-emerald-300 text-emerald-700 hover:bg-emerald-100'>
            <Link to='/subscriptions/history'>
              <History className='mr-1.5 size-3.5' /> View History
            </Link>
          </Button>
        </div>
      )}

      {/* No active banner */}
      {!statusLoading && !hasActive && (
        <div className='mb-6 flex items-center justify-between rounded-xl border bg-muted/40 p-4'>
          <p className='text-sm text-muted-foreground'>No active subscription</p>
          <Button asChild variant='ghost' size='sm'>
            <Link to='/subscriptions/history'>
              <History className='mr-1.5 size-3.5' /> History
            </Link>
          </Button>
        </div>
      )}

      {/* Plans */}
      {plansLoading ? (
        <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {[1, 2, 3].map(i => (
            <div key={i} className='h-80 animate-pulse rounded-2xl border bg-muted/30' />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className='rounded-2xl border bg-muted/20 py-16 text-center'>
          <p className='text-sm font-semibold text-foreground'>No plans available</p>
          <p className='mt-1 text-xs text-muted-foreground'>Please check back later.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {plans.map((p, i) => {
            const isCurrentActive = hasActive && Number.isFinite(currentPlanId) && p.s_no === currentPlanId
            const isCurrentExpired = !hasActive && Number.isFinite(currentPlanId) && p.s_no === currentPlanId && Number.isFinite(currentSubId) && currentSubId > 0
            return (
              <PlanCard
                key={p.s_no}
                plan={p}
                recommended={p.s_no === recommendedSno}
                idx={i}
                isActive={isCurrentActive}
                isExpired={isCurrentExpired}
                busy={busy}
                actionLoading={actionPlanId === p.s_no && (subscribing || renewing)}
                onSubscribe={() => void handleSubscribe(p.s_no)}
                onRenew={() => void handleRenew(currentSubId, p.s_no)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
