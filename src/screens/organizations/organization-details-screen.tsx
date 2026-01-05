import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ThemeSwitch } from '@/components/theme-switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetOrganizationDetailsQuery } from '@/store/organizations.api'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='text-base font-semibold'>{value}</div>
    </div>
  )
}

export function OrganizationDetailsScreen({ orgId }: { orgId: number }) {
  const { data, isLoading, isError } = useGetOrganizationDetailsQuery(orgId)
  const org = data?.data

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center gap-2'>
          <Button asChild variant='outline' size='sm'>
            <Link to='/organizations'>Back</Link>
          </Button>
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        {isLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-10 w-1/2' />
            <Skeleton className='h-44 w-full' />
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              <Skeleton className='h-44 w-full' />
              <Skeleton className='h-44 w-full' />
              <Skeleton className='h-44 w-full' />
            </div>
          </div>
        ) : isError || !org ? (
          <div className='text-sm text-destructive'>Failed to load organization details</div>
        ) : (
          <>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h1 className='text-2xl font-bold'>{org.name}</h1>
                {org.description ? (
                  <div className='mt-1 text-sm text-muted-foreground'>{org.description}</div>
                ) : null}
              </div>
              <Badge variant={org.status === 'ACTIVE' ? 'default' : 'secondary'}>{org.status}</Badge>
            </div>

            <Card className='mt-4'>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4 md:grid-cols-6'>
                  <Stat label='PGs' value={org.pg_locations_count} />
                  <Stat label='Rooms' value={org.rooms_count} />
                  <Stat label='Beds' value={org.beds_count} />
                  <Stat label='Employees' value={org.employees_count} />
                  <Stat label='Tenants' value={org.tenants_count} />
                </div>
              </CardContent>
            </Card>

            <div className='mt-6'>
              <h2 className='text-lg font-semibold'>PG Locations</h2>
              <div className='mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                {org.pg_locations.map((pg) => (
                  <Card key={pg.s_no} className='overflow-hidden'>
                    <CardHeader className='space-y-2'>
                      <div className='flex items-start justify-between gap-3'>
                        <CardTitle className='text-lg leading-tight'>
                          {pg.location_name}
                        </CardTitle>
                        <Badge variant={pg.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {pg.status ?? 'N/A'}
                        </Badge>
                      </div>
                      <div className='text-sm text-muted-foreground line-clamp-2'>
                        {pg.address}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className='grid grid-cols-3 gap-4'>
                        <Stat label='Rooms' value={pg.rooms_count} />
                        <Stat label='Beds' value={pg.beds_count} />
                        <Stat label='Employees' value={pg.employees_count} />
                        <Stat label='Tenants' value={pg.tenants_count} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {org.pg_locations.length === 0 ? (
                <div className='mt-4 text-sm text-muted-foreground'>No PG locations found</div>
              ) : null}
            </div>
          </>
        )}
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Organizations',
    href: '/organizations',
    isActive: false,
    disabled: false,
  },
] 
