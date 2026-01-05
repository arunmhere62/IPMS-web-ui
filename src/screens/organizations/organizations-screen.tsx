import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ThemeSwitch } from '@/components/theme-switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetOrganizationsQuery } from '@/store/organizations.api'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='text-base font-semibold'>{value}</div>
    </div>
  )
}

export function OrganizationsScreen() {
  const { data, isLoading, isError } = useGetOrganizationsQuery({ page: 1, limit: 50 })
  const items = data?.data?.data ?? []

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center'>
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold'>Organizations</h1>
        </div>

        <div className='mt-4'>
          {isLoading ? (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              <Skeleton className='h-44 w-full' />
              <Skeleton className='h-44 w-full' />
              <Skeleton className='h-44 w-full' />
              <Skeleton className='h-44 w-full' />
              <Skeleton className='h-44 w-full' />
              <Skeleton className='h-44 w-full' />
            </div>
          ) : isError ? (
            <div className='text-sm text-destructive'>Failed to load organizations</div>
          ) : items.length === 0 ? (
            <div className='text-sm text-muted-foreground'>No organizations found</div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {items.map((org) => (
                <Card key={org.s_no} className='overflow-hidden'>
                  <CardHeader className='space-y-2'>
                    <div className='flex items-start justify-between gap-3'>
                      <CardTitle className='text-lg leading-tight'>{org.name}</CardTitle>
                      <Badge variant={org.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {org.status}
                      </Badge>
                    </div>
                    {org.description ? (
                      <div className='text-sm text-muted-foreground line-clamp-2'>
                        {org.description}
                      </div>
                    ) : null}
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-3 gap-4'>
                      <Stat label='PGs' value={org.pg_locations_count} />
                      <Stat label='Rooms' value={org.rooms_count} />
                      <Stat label='Beds' value={org.beds_count} />
                      <Stat label='Employees' value={org.employees_count} />
                      <Stat label='Tenants' value={org.tenants_count} />
                    </div>

                    <div className='mt-4 flex justify-end'>
                      <Button asChild size='sm'>
                        <Link to={`/organizations/${org.s_no}`}>
                          View details
                        </Link>
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
    title: 'Organizations',
    href: '/organizations',
    isActive: true,
    disabled: false,
  },
]
