import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ThemeSwitch } from '@/components/theme-switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetTicketsQuery } from '@/store/tickets.api'

const STATUS_VARIANT: Record<string, any> = {
  OPEN: 'default',
  IN_PROGRESS: 'secondary',
  RESOLVED: 'outline',
  CLOSED: 'outline',
}

export function TicketsScreen() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')

  const queryArgs = useMemo(() => {
    return {
      page: 1,
      limit: 50,
      search: search || undefined,
      status: status || undefined,
    }
  }, [search, status])

  const { data, isLoading, isError, refetch } = useGetTicketsQuery(queryArgs)
  const items = data?.data?.data ?? []

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()}>
            Refresh
          </Button>
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h1 className='text-2xl font-bold'>Support Tickets</h1>
        </div>

        <div className='mt-4 flex flex-wrap items-center gap-3'>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search by ticket number, title, description'
            className='max-w-lg'
          />
          <Input
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder='Status (OPEN / IN_PROGRESS / RESOLVED / CLOSED)'
            className='max-w-xs'
          />
        </div>

        <div className='mt-4'>
          {isLoading ? (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              <Skeleton className='h-44 w-full' />
              <Skeleton className='h-44 w-full' />
              <Skeleton className='h-44 w-full' />
            </div>
          ) : isError ? (
            <div className='text-sm text-destructive'>Failed to load tickets</div>
          ) : items.length === 0 ? (
            <div className='text-sm text-muted-foreground'>No tickets found</div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {items.map((t) => (
                <Card key={t.s_no} className='overflow-hidden'>
                  <CardHeader className='space-y-2'>
                    <div className='flex items-start justify-between gap-3'>
                      <CardTitle className='text-lg leading-tight'>{t.title}</CardTitle>
                      <Badge variant={STATUS_VARIANT[t.status] ?? 'secondary'}>
                        {t.status}
                      </Badge>
                    </div>
                    <div className='text-xs text-muted-foreground'>#{t.ticket_number}</div>
                  </CardHeader>
                  <CardContent>
                    <div className='text-sm text-muted-foreground line-clamp-3'>
                      {t.description}
                    </div>

                    <div className='mt-4 flex items-center justify-between'>
                      <div className='text-xs text-muted-foreground'>
                        {new Date(t.created_at).toLocaleString()}
                      </div>
                      <Button asChild size='sm'>
                        <Link to={`/tickets/${t.s_no}`}>Open</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Tickets',
    href: '/tickets',
    isActive: true,
    disabled: false,
  },
]
