import { useState } from 'react'
import { useGetPublicPlansQuery, type SubscriptionPlan } from '@/services/subscriptionApi'
import { Check, Flame, LogIn, Sparkles, UserPlus, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppDialog } from '@/components/form/app-dialog'
import { Button } from '@/components/ui/button'

const formatPrice = (price: string | number, currency?: string) => {
  const n = typeof price === 'string' ? parseFloat(price) : price
  if (!Number.isFinite(n) || n <= 0) return 'Free'
  if (currency && currency.toUpperCase() !== 'INR') return `${currency.toUpperCase()} ${n.toLocaleString()}`
  return `₹${n.toLocaleString('en-IN')}`
}

const formatDuration = (days: number) => {
  if (days === 30) return '/mo'
  if (days === 90) return '/qtr'
  if (days === 180) return '/6mo'
  if (days === 365) return '/yr'
  return `/${days}d`
}

const getFeatures = (plan: SubscriptionPlan): string[] => {
  const list: string[] = Array.isArray(plan.features) ? [...plan.features] : []
  // null means unlimited — always show it; undefined means not applicable — skip
  const lim = (label: string, v: number | null | undefined) => {
    if (v === undefined) return
    list.push(v === null ? `Unlimited ${label}` : `Up to ${v} ${label}`)
  }
  const l = plan.limits
  // Use limits object values; fall back to top-level fields; treat missing as null (unlimited)
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

const CARD_THEMES = [
  {
    bg: 'from-slate-900 via-slate-800 to-slate-900',
    accent: 'from-violet-500 to-indigo-500',
    glow: 'shadow-violet-500/20',
    pill: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    check: 'text-violet-400',
    border: 'border-white/10',
  },
  {
    bg: 'from-rose-950 via-pink-900 to-rose-950',
    accent: 'from-rose-500 to-pink-500',
    glow: 'shadow-rose-500/30',
    pill: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    check: 'text-rose-400',
    border: 'border-rose-500/20',
  },
  {
    bg: 'from-amber-950 via-orange-900 to-amber-950',
    accent: 'from-amber-400 to-orange-500',
    glow: 'shadow-amber-500/20',
    pill: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    check: 'text-amber-400',
    border: 'border-amber-500/20',
  },
]

function PlanCard({ plan, recommended, idx, onGetStarted }: { plan: SubscriptionPlan; recommended: boolean; idx: number; onGetStarted: (planName: string) => void }) {
  const isFreePlan = Boolean(plan.is_free)
  const isTrialPlan = Boolean(plan.is_trial)
  const features = getFeatures(plan)
  const theme = CARD_THEMES[idx % CARD_THEMES.length]
  const Icon = idx === 0 ? Zap : idx === 1 ? Flame : Sparkles

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-3xl border ${theme.border} bg-gradient-to-br ${theme.bg} shadow-2xl ${theme.glow} transition-all duration-300 hover:-translate-y-1 hover:shadow-3xl ${recommended ? 'ring-2 ring-white/20' : ''}`}>

      {recommended && (
        <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${theme.accent}`} />
      )}

      <div className='p-6 sm:p-8'>
        <div className='flex items-start justify-between'>
          <div className={`flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.accent} shadow-lg`}>
            <Icon className='size-5 text-white' />
          </div>
          {recommended && (
            <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${theme.pill}`}>
              Most popular
            </span>
          )}
          {isTrialPlan && !recommended && (
            <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${theme.pill}`}>
              Free trial
            </span>
          )}
          {isFreePlan && !isTrialPlan && !recommended && (
            <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${theme.pill}`}>
              Free
            </span>
          )}
        </div>

        <div className='mt-5'>
          <h3 className='text-2xl font-black tracking-tight text-white'>{plan.name}</h3>
          {plan.description && (
            <p className='mt-1.5 text-sm leading-relaxed text-white/50'>{plan.description}</p>
          )}
        </div>

        <div className='mt-6'>
          <div className='flex items-end gap-1'>
            <span className={`bg-gradient-to-r bg-clip-text text-5xl font-black tracking-tight text-transparent ${theme.accent}`}>
              {formatPrice(plan.price, plan.currency)}
            </span>
            <span className='mb-1.5 text-base text-white/40'>{formatDuration(plan.duration)}</span>
          </div>
          {plan.gst_breakdown && plan.gst_breakdown.total_price_including_gst > 0 && (
            <div className='mt-1 text-xs text-white/30'>
              ₹{plan.gst_breakdown.total_price_including_gst.toLocaleString('en-IN')} incl. GST
              <span className='ml-1.5 opacity-60'>(CGST {plan.gst_breakdown.cgst_rate}% + SGST {plan.gst_breakdown.sgst_rate}%)</span>
            </div>
          )}
        </div>

        {features.length > 0 && (
          <div className='mt-7 space-y-3'>
            <div className='text-[10px] font-bold uppercase tracking-widest text-white/30'>What's included</div>
            {features.map((f, i) => (
              <div key={i} className='flex items-center gap-3'>
                <div className={`flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10`}>
                  <Check className={`size-3 ${theme.check}`} />
                </div>
                <span className='text-sm text-white/70'>{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`mx-6 mb-6 mt-auto h-px bg-gradient-to-r ${theme.accent} opacity-20`} />
      <div className='px-6 pb-6'>
        <button
          onClick={() => onGetStarted(plan.name)}
          className={`flex w-full items-center justify-center rounded-2xl bg-gradient-to-r ${theme.accent} py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl active:scale-95`}
        >
          Get Started
        </button>
        <div className='mt-3 text-center text-[11px] text-white/25'>Subscribe in the mobile app after signup</div>
      </div>
    </div>
  )
}

export function SubscriptionsScreen() {
  const { data: plans = [], isLoading } = useGetPublicPlansQuery()
  const navigate = useNavigate()
  const [loginPrompt, setLoginPrompt] = useState<{ open: boolean; planName: string }>({ open: false, planName: '' })

  const recommendedSno = plans.filter(p => p.is_active !== false).find(p =>
    p.name.toLowerCase().includes('premium')
  )?.s_no ?? plans.filter(p => !p.is_free && p.is_active !== false).sort((a, b) =>
    Number(b.price) - Number(a.price)
  )[0]?.s_no

  return (
    <div className='min-h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'>
      {/* Hero */}
      <div className='relative overflow-hidden px-4 pb-16 pt-16 text-center sm:pt-24'>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(120,40,200,0.25),transparent)]' />
        <div className='relative'>
          <div className='mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300'>
            <Sparkles className='size-3.5' />
            Simple, transparent pricing
          </div>
          <h1 className='text-4xl font-black tracking-tight text-white sm:text-6xl'>
            Pick your plan.
            <br />
            <span className='bg-gradient-to-r from-violet-400 via-pink-400 to-rose-400 bg-clip-text text-transparent'>
              Grow your PG.
            </span>
          </h1>
          <p className='mx-auto mt-4 max-w-md text-base text-white/50'>
            No hidden fees. Cancel anytime. Billing managed in the mobile app.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className='px-4 pb-20'>
        <div className='mx-auto max-w-5xl'>
          {isLoading ? (
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {[1, 2, 3].map(i => (
                <div key={i} className='h-96 animate-pulse rounded-3xl bg-white/5' />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className='rounded-3xl border border-white/10 bg-white/5 py-20 text-center'>
              <div className='text-base font-semibold text-white/60'>No plans available</div>
              <div className='mt-1 text-sm text-white/30'>Please check back later.</div>
            </div>
          ) : (
            <div className='grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {plans.map((p, i) => (
                <PlanCard
                  key={p.s_no}
                  plan={p}
                  recommended={p.s_no === recommendedSno}
                  idx={i}
                  onGetStarted={(planName) => setLoginPrompt({ open: true, planName })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Login prompt dialog */}
      <AppDialog
        open={loginPrompt.open}
        onOpenChange={(open) => setLoginPrompt(prev => ({ ...prev, open }))}
        title='Sign in to subscribe'
        size='sm'
        description={
          <>
            To subscribe to the <span className='font-semibold text-foreground'>{loginPrompt.planName}</span> plan,
            you need an account. It only takes a minute to get started.
          </>
        }
      >
        <div className='mt-2 flex flex-col gap-3'>
          <Button
            className='w-full'
            onClick={() => { navigate('/login') }}
          >
            <LogIn className='mr-2 size-4' />
            Login to your account
          </Button>
          <Button
            variant='outline'
            className='w-full'
            onClick={() => { navigate('/signup') }}
          >
            <UserPlus className='mr-2 size-4' />
            Create a new account
          </Button>
          <p className='text-center text-[11px] text-muted-foreground'>
            After signing up, download the mobile app to complete your subscription.
          </p>
        </div>
      </AppDialog>
    </div>
  )
}
