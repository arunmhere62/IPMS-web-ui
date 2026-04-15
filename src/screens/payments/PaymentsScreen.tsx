import { ArrowDown, ArrowUp, ChevronRight, CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/form/page-header'

export function PaymentsScreen() {
  const items = [
    {
      title: 'Rent Payments',
      subtitle: 'Track monthly rent payments and statuses',
      icon: CreditCard,
      url: '/payments/rent',
    },
    {
      title: 'Advance Payments',
      subtitle: 'Manage advances paid by tenants',
      icon: ArrowUp,
      url: '/payments/advance',
    },
    {
      title: 'Refund Payments',
      subtitle: 'Manage refunds and settlement entries',
      icon: ArrowDown,
      url: '/payments/refund',
    },
  ]

  return (
    <div className='container mx-auto max-w-5xl px-3 py-6'>
      <PageHeader title='Payments' showBack={true} />

      <div className='mt-4 grid gap-3'>
        {items.map((it) => {
          const Icon = it.icon
          return (
            <Card key={it.url} className='overflow-hidden'>
              <CardContent className='p-0'>
                <Link
                  to={it.url}
                  className='flex items-center gap-3 p-4 transition hover:bg-muted/40'
                >
                  <div className='flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                    <Icon className='size-5' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-sm font-semibold'>
                      {it.title}
                    </div>
                    <div className='mt-1 line-clamp-2 text-xs text-muted-foreground'>
                      {it.subtitle}
                    </div>
                  </div>
                  <ChevronRight className='size-4 text-muted-foreground' />
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
