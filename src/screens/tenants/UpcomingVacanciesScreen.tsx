import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useGetUpcomingVacanciesQuery,
  type UpcomingVacancy,
} from '@/services/tenantsApi'
import { BedDouble, Calendar, Home, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/form/page-header'

const FILTER_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
]

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const daysUntil = (dateStr: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
}

function UrgencyBadge({ days }: { days: number }) {
  let bg = 'bg-green-100'
  let text = 'text-green-700'
  let label = `${days}d left`

  if (days <= 3) {
    bg = 'bg-red-100'
    text = 'text-red-700'
    label = days === 0 ? 'Today' : `${days}d left`
  } else if (days <= 7) {
    bg = 'bg-amber-100'
    text = 'text-amber-700'
  } else if (days <= 15) {
    bg = 'bg-sky-100'
    text = 'text-sky-700'
  }

  return (
    <span
      className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${bg} ${text}`}
    >
      {label}
    </span>
  )
}

export function UpcomingVacanciesScreen() {
  const navigate = useNavigate()
  const [days, setDays] = useState(30)

  const { data, isLoading, isFetching, refetch } = useGetUpcomingVacanciesQuery(
    { days }
  )
  const vacancies: UpcomingVacancy[] = data?.data ?? []

  return (
    <div className='container mx-auto max-w-4xl px-4 py-4'>
      <PageHeader
        title='Upcoming Vacancies'
        subtitle={`Beds going vacant in next ${days} days`}
        showBack={true}
      />

      {/* Filter chips */}
      <div className='mt-4 flex flex-wrap items-center gap-2'>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDays(opt.value)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              days === opt.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <Button
          variant='outline'
          size='sm'
          className='ml-auto'
          onClick={() => refetch()}
          disabled={isFetching}
        >
          Refresh
        </Button>
      </div>

      {/* Content */}
      <div className='mt-4'>
        {isLoading ? (
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={`skeleton-${i}`} className='py-0'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-2'>
                      <div className='h-4 w-32 animate-pulse rounded bg-muted' />
                      <div className='h-3 w-20 animate-pulse rounded bg-muted' />
                    </div>
                    <div className='h-5 w-16 animate-pulse rounded bg-muted' />
                  </div>
                  <div className='mt-3 flex gap-4 border-t border-border/30 pt-3'>
                    <div className='h-3 w-20 animate-pulse rounded bg-muted' />
                    <div className='h-3 w-20 animate-pulse rounded bg-muted' />
                    <div className='h-3 w-24 animate-pulse rounded bg-muted' />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : vacancies.length === 0 ? (
          <EmptyState
            emoji='🛏️'
            title='No Upcoming Vacancies'
            description={`No tenants are expected to vacate in the next ${days} days.`}
          />
        ) : (
          <>
            <p className='mb-3 text-xs text-muted-foreground'>
              {vacancies.length} bed{vacancies.length !== 1 ? 's' : ''} going
              vacant
            </p>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              {vacancies.map((v) => {
                const d = daysUntil(v.expected_vacate_date)
                return (
                  <Card
                    key={v.s_no}
                    className='cursor-pointer py-0 transition-colors hover:border-primary/50'
                    onClick={() => navigate(`/tenants/${v.s_no}`)}
                  >
                    <CardContent className='p-4'>
                      <div className='flex items-center justify-between gap-2'>
                        <div className='min-w-0 flex-1'>
                          <h3 className='truncate text-[15px] font-bold text-foreground'>
                            {v.name}
                          </h3>
                          {v.phone_no ? (
                            <p className='mt-0.5 flex items-center gap-1 text-xs text-muted-foreground'>
                              <Phone className='size-3' />
                              {v.phone_no}
                            </p>
                          ) : null}
                        </div>
                        <UrgencyBadge days={d} />
                      </div>

                      <div className='mt-2.5 flex flex-wrap items-center gap-4 border-t border-border/30 pt-2.5'>
                        <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                          <Home className='size-3.5' />
                          Room {v.rooms?.room_no ?? '—'}
                        </span>
                        <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                          <BedDouble className='size-3.5' />
                          Bed {v.beds?.bed_no ?? '—'}
                        </span>
                        <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                          <Calendar className='size-3.5' />
                          {formatDate(v.expected_vacate_date)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
