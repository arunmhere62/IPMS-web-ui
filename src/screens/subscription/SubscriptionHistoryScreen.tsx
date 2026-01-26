import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, CircleAlert, History, RefreshCw } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/form/page-header'

import { useGetSubscriptionHistoryQuery, type UserSubscription } from '@/services/subscriptionApi'

type ErrorLike = {
  data?: {
    message?: string
    error?: string
  }
  message?: string
  error?: string
}

const toDateLabel = (value?: string) => {
  const s = String(value ?? '')
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s.includes('T') ? s.split('T')[0] : s
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const moneyLabel = (value: unknown) => {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

const statusVariant = (status?: string) => {
  const s = String(status ?? '').toUpperCase()
  if (s === 'ACTIVE') return 'default'
  if (s === 'EXPIRED') return 'destructive'
  if (s === 'PENDING') return 'secondary'
  if (s === 'CANCELLED') return 'outline'
  return 'outline'
}

export function SubscriptionHistoryScreen() {
  const {
    data: historyResponse,
    isLoading,
    error,
    refetch,
  } = useGetSubscriptionHistoryQuery()

  const history: UserSubscription[] = useMemo(() => historyResponse?.data ?? [], [historyResponse])

  const fetchErrorMessage = useMemo(() => {
    if (!error) return null
    const e = error as ErrorLike
    const fromData = e.data?.message ?? e.data?.error
    return fromData ?? e.message ?? e.error ?? 'Unable to load subscription history.'
  }, [error])

  return (
    <div className='container mx-auto max-w-6xl px-3 py-6'>
      <PageHeader
        title='Subscription History'
        subtitle='Your previous subscriptions'
        right={
          <>
            <Button asChild variant='outline' size='sm'>
              <Link to='/subscriptions'>
                <ChevronLeft className='me-1 size-4' />
                Back
              </Link>
            </Button>
            <Button variant='outline' size='sm' onClick={() => void refetch()}>
              <RefreshCw className='me-2 size-4' />
              Refresh
            </Button>
          </>
        }
      />

      {fetchErrorMessage ? (
        <div className='mt-6'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load history</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      <div className='mt-4'>
        {isLoading ? (
          <div className='rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>Loading...</div>
        ) : history.length === 0 ? (
          <div className='rounded-md border bg-card px-3 py-8 text-center'>
            <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-muted'>
              <History className='size-6 text-muted-foreground' />
            </div>
            <div className='mt-3 text-base font-semibold'>No History</div>
            <div className='mt-1 text-xs text-muted-foreground'>No subscription history found.</div>
            <div className='mt-4'>
              <Button asChild>
                <Link to='/subscriptions'>View Plans</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {history.map((item) => {
              const plan: any = (item as any).plan ?? (item as any).subscription_plans
              const planName = String(plan?.name ?? 'Unknown Plan')
              const planDesc = String(plan?.description ?? '')
              const amount = (item as any).amount_paid ?? plan?.price
              const duration = plan?.duration

              return (
                <Card key={String(item.s_no ?? item.id)} className='h-full'>
                  <CardContent className='flex h-full flex-col gap-2 p-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <div className='truncate text-base font-semibold'>{planName}</div>
                        {planDesc ? <div className='mt-1 line-clamp-2 text-xs text-muted-foreground'>{planDesc}</div> : null}
                      </div>
                      <Badge variant={statusVariant(item.status) as any} className='shrink-0'>
                        {String(item.status ?? '')}
                      </Badge>
                    </div>

                    <div className='mt-2 rounded-md border bg-background/50 p-3 text-sm'>
                      <div className='flex items-center justify-between gap-3'>
                        <div className='text-xs text-muted-foreground'>Start</div>
                        <div className='text-xs font-semibold'>{toDateLabel(item.start_date)}</div>
                      </div>
                      <div className='mt-2 flex items-center justify-between gap-3'>
                        <div className='text-xs text-muted-foreground'>End</div>
                        <div className='text-xs font-semibold'>{toDateLabel(item.end_date)}</div>
                      </div>
                      <div className='mt-2 flex items-center justify-between gap-3'>
                        <div className='text-xs text-muted-foreground'>Amount</div>
                        <div className='text-sm font-semibold text-primary'>{moneyLabel(amount)}</div>
                      </div>
                      {typeof duration === 'number' ? (
                        <div className='mt-2 flex items-center justify-between gap-3'>
                          <div className='text-xs text-muted-foreground'>Duration</div>
                          <div className='text-xs font-semibold'>{duration} days</div>
                        </div>
                      ) : null}
                    </div>

                    {item.payment_status ? (
                      <div className='mt-auto flex items-center justify-between gap-2 pt-1'>
                        <div className='text-xs text-muted-foreground'>Payment</div>
                        <Badge variant='outline'>{String(item.payment_status)}</Badge>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
