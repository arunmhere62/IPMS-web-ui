import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AlertCircle, Clock, Rocket, ArrowRight } from 'lucide-react'

export interface SubscriptionInfo {
  has_active_plan?: boolean
  is_trial?: boolean
  is_free_plan?: boolean
  days_remaining?: number
  plan_name?: string
}

interface TrialBannerProps {
  subscription?: SubscriptionInfo | null
  onUpgrade?: () => void
  className?: string
}

export function TrialBanner({
  subscription,
  onUpgrade,
  className,
}: TrialBannerProps) {
  const show =
    subscription &&
    subscription.has_active_plan &&
    subscription.is_trial &&
    !subscription.is_free_plan

  if (!show) return null

  const days = subscription.days_remaining ?? 0
  const planName = subscription.plan_name ?? 'Trial'
  const urgency = days <= 3 ? 'critical' : days <= 7 ? 'warning' : 'info'

  const config = {
    critical: {
      container: 'bg-red-50 border-red-300',
      iconBg: 'bg-red-100',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      badge: 'bg-red-600 text-white',
      title: 'text-red-900',
      subtitle: 'text-red-800',
      btn: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      container: 'bg-rose-50 border-rose-300',
      iconBg: 'bg-rose-100',
      icon: Clock,
      iconColor: 'text-rose-600',
      badge: 'bg-rose-600 text-white',
      title: 'text-rose-900',
      subtitle: 'text-rose-800',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    info: {
      container: 'bg-red-50/80 border-red-200',
      iconBg: 'bg-red-100',
      icon: Rocket,
      iconColor: 'text-red-500',
      badge: 'bg-red-500 text-white',
      title: 'text-red-900',
      subtitle: 'text-red-800',
      btn: 'bg-red-500 hover:bg-red-600 text-white',
    },
  }[urgency]

  const daysLabel =
    days === 0 ? 'Expires today' : days === 1 ? '1 day left' : `${days} days left`

  const Icon = config.icon

  return (
    <div
      className={cn(
        'border-b shadow-sm',
        config.container,
        className
      )}
    >
      <div className='flex items-center gap-3 px-4 py-2.5'>
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            config.iconBg
          )}
        >
          <Icon className={cn('size-5', config.iconColor)} />
        </div>
        <div className='flex-1 min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className={cn('text-sm font-bold', config.title)}>
              {planName} Plan
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                config.badge
              )}
            >
              <Clock className='size-3' />
              {daysLabel}
            </span>
          </div>
          <div className={cn('text-xs font-medium', config.subtitle)}>
            {days <= 3
              ? 'Upgrade now to avoid losing access'
              : 'Upgrade to unlock all features'}
          </div>
        </div>
        <Button
          size='sm'
          className={cn('shrink-0 gap-1', config.btn)}
          onClick={onUpgrade}
        >
          Upgrade
          <ArrowRight className='size-3.5' />
        </Button>
      </div>
    </div>
  )
}
