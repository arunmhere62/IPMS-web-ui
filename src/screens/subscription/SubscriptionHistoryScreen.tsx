import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, History, RefreshCw } from 'lucide-react'
import { useGetSubscriptionHistoryQuery, type UserSubscription } from '@/services/subscriptionApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type ErrorLike = { data?: { message?: string; error?: string }; message?: string; error?: string }

const toDateLabel = (value?: string) => {
  const d = new Date(String(value ?? ''))
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const moneyLabel = (value: unknown) => {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN')}` : '—'
}

const statusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (status === 'ACTIVE') return 'default'
  if (status === 'EXPIRED' || status === 'CANCELLED') return 'destructive'
  if (status === 'PENDING') return 'secondary'
  return 'outline'
}

export function SubscriptionHistoryScreen() {
  const { data: historyResponse, isLoading, error, refetch } = useGetSubscriptionHistoryQuery()
  const history: UserSubscription[] = useMemo(() => historyResponse?.data ?? [], [historyResponse])

  const fetchError = useMemo(() => {
    if (!error) return null
    const e = error as ErrorLike
    return e.data?.message ?? e.data?.error ?? e.message ?? e.error ?? 'Unable to load history.'
  }, [error])

  return (
    <div className='container mx-auto max-w-4xl px-4 py-8'>

      {/* Header */}
      <div className='mb-8 flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10'>
            <History className='size-5 text-primary' />
          </div>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>Subscription History</h1>
            <p className='text-sm text-muted-foreground'>Your past and current subscriptions</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={() => void refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-1.5 size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild variant='outline' size='sm'>
            <Link to='/subscriptions/manage'>
              <ArrowLeft className='mr-1.5 size-3.5' />
              Back to Plans
            </Link>
          </Button>
        </div>
      </div>

      {/* Error */}
      {fetchError && (
        <div className='mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'>
          {fetchError}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {[1, 2, 3].map(i => (
            <div key={i} className='h-52 animate-pulse rounded-2xl border bg-muted/30' />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className='rounded-2xl border bg-muted/20 py-16 text-center'>
          <div className='mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted'>
            <History className='size-7 text-muted-foreground' />
          </div>
          <p className='mt-4 text-sm font-semibold text-foreground'>No history yet</p>
          <p className='mt-1 text-xs text-muted-foreground'>Subscribe to a plan to see it here.</p>
          <Button asChild className='mt-5'>
            <Link to='/subscriptions/manage'>View Plans</Link>
          </Button>
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {history.map((item) => {
            const plan: any = (item as any).plan ?? (item as any).subscription_plans
            const planName = String(plan?.name ?? 'Unknown Plan')
            const planDesc = String(plan?.description ?? '')
            const amount = (item as any).amount_paid ?? plan?.price
            const duration = plan?.duration
            const statusKey = String(item.status ?? '').toUpperCase()
            const isActive = statusKey === 'ACTIVE'

            return (
              <div
                key={String(item.s_no ?? item.id)}
                className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
                  isActive ? 'border-emerald-400 ring-2 ring-emerald-400/20' : 'border-border'
                }`}
              >
                {/* Top accent bar */}
                <div className={`h-1 w-full ${isActive ? 'bg-emerald-500' : 'bg-muted'}`} />

                <div className='flex flex-1 flex-col gap-4 p-5'>
                  {/* Plan name + status */}
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-bold text-foreground'>{planName}</p>
                      {planDesc && planDesc !== 'null' && (
                        <p className='mt-0.5 line-clamp-1 text-xs text-muted-foreground'>{planDesc}</p>
                      )}
                    </div>
                    <Badge variant={statusBadgeVariant(statusKey)} className='shrink-0 text-[10px]'>
                      {statusKey || '—'}
                    </Badge>
                  </div>

                  {/* Amount */}
                  <div className={`text-2xl font-black tracking-tight ${isActive ? 'text-emerald-600' : 'text-foreground'}`}>
                    {moneyLabel(amount)}
                  </div>

                  {/* Detail rows */}
                  <div className='space-y-2 rounded-xl border bg-muted/30 p-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-muted-foreground'>Start</span>
                      <span className='text-xs font-semibold text-foreground'>{toDateLabel(item.start_date)}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-muted-foreground'>End</span>
                      <span className='text-xs font-semibold text-foreground'>{toDateLabel(item.end_date)}</span>
                    </div>
                    {typeof duration === 'number' && (
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-muted-foreground'>Duration</span>
                        <span className='text-xs font-semibold text-foreground'>{duration} days</span>
                      </div>
                    )}
                    {item.payment_status && (
                      <div className='flex items-center justify-between border-t border-border pt-2'>
                        <span className='text-xs text-muted-foreground'>Payment</span>
                        <span className='text-xs font-semibold text-foreground'>{String(item.payment_status)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
