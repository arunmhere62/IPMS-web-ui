import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetSubscriptionPlanByIdQuery } from '@/store/subscription-plans.api'

export function SubscriptionPlanDetailsScreen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const planId = Number(id)

  const { data, isLoading, isError } = useGetSubscriptionPlanByIdQuery(planId, {
    skip: !Number.isFinite(planId),
  })

  const plan = data?.data

  const featuresText = useMemo(() => {
    if (!plan?.features) return '—'
    try {
      return JSON.stringify(plan.features, null, 2)
    } catch {
      return String(plan.features)
    }
  }, [plan?.features])

  if (!Number.isFinite(planId)) {
    return <div className='p-4'>Invalid plan id</div>
  }

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className='mb-4 flex items-center justify-between gap-2'>
          <div className='text-lg font-semibold'>Subscription Plan Details</div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' onClick={() => navigate('/subscription-plans')}>
              Back
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className='h-44 w-full' />
        ) : isError || !plan ? (
          <div className='text-sm text-destructive'>Failed to load plan</div>
        ) : (
          <div className='grid gap-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-xl'>{plan.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {plan.description ? (
                  <div className='mb-4 text-sm text-muted-foreground'>{plan.description}</div>
                ) : null}

                <div className='grid gap-3 md:grid-cols-2'>
                  <Detail label='Status' value={plan.is_active ? 'Active' : 'Inactive'} />
                  <Detail label='Duration' value={`${plan.duration} days`} />
                  <Detail label='Price' value={`${plan.currency} ${String(plan.price)}`} />
                  <Detail label='Max PG Locations' value={plan.max_pg_locations ?? '—'} />
                  <Detail label='Max Rooms' value={plan.max_rooms ?? '—'} />
                  <Detail label='Max Beds' value={plan.max_beds ?? '—'} />
                  <Detail label='Max Tenants' value={plan.max_tenants ?? '—'} />
                  <Detail label='Max Employees' value={plan.max_employees ?? '—'} />
                  <Detail label='Max Users' value={plan.max_users ?? '—'} />
                  <Detail
                    label='Max Invoices / Month'
                    value={plan.max_invoices_per_month ?? '—'}
                  />
                  <Detail label='Max SMS / Month' value={plan.max_sms_per_month ?? '—'} />
                  <Detail
                    label='Max WhatsApp / Month'
                    value={plan.max_whatsapp_per_month ?? '—'}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className='max-h-[420px] overflow-auto rounded-md border bg-muted p-3 text-xs'>
                  {featuresText}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </Main>
    </>
  )
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='font-semibold'>{value}</div>
    </div>
  )
}

const topNav = [
  {
    title: 'Subscription Plans',
    href: '/subscription-plans',
    isActive: false,
    disabled: false,
  },
]
