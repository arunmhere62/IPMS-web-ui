import { Link } from 'react-router-dom'
import {
  Bell,
  Building2,
  CreditCard,
  LayoutDashboard,
  Shield,
  Users,
  Wrench,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function PublicHome() {
  const quickAccess = [
    {
      title: 'Dashboard',
      description: 'Track occupancy, revenue, pending tasks, and key metrics.',
      url: '/',
      icon: LayoutDashboard,
      badge: 'Login required',
    },
    {
      title: 'Tenants',
      description: 'Manage check-ins, profiles, payments, and history.',
      url: '/',
      icon: Users,
      badge: 'Login required',
    },
    {
      title: 'Payments',
      description: 'Collect rent, track dues, and view payment reports.',
      url: '/',
      icon: CreditCard,
      badge: 'Login required',
    },
    {
      title: 'Organization & PG',
      description: 'Configure your organization, locations, rooms, and roles.',
      url: '/',
      icon: Building2,
      badge: 'Login required',
    },
    {
      title: 'Tickets',
      description: 'Raise and track maintenance requests & issues.',
      url: '/',
      icon: Wrench,
      badge: 'Login required',
    },
    {
      title: 'Notifications',
      description: 'Stay updated with alerts and reminders.',
      url: '/',
      icon: Bell,
      badge: 'Login required',
    },
    {
      title: 'Subscriptions',
      description: 'Manage your plan. Web redirects to Play Store for billing.',
      url: '/subscriptions',
      icon: Shield,
      badge: 'Available',
    },
  ]

  return (
    <div className='container mx-auto max-w-6xl px-4 py-10'>
      <div className='grid gap-8 lg:grid-cols-2 lg:items-center'>
        <div>
          <Badge variant='secondary' className='mb-4'>
            Property Management
          </Badge>
          <div className='text-3xl font-semibold leading-tight sm:text-4xl'>
            IPMS — Modern PG & Property Management, simplified.
          </div>
          <div className='mt-3 text-base text-muted-foreground'>
            Track tenants, payments, rooms, tickets, staff, and compliance — all in one place.
            Get started in minutes and scale across multiple locations.
          </div>

          <div className='mt-6 flex flex-wrap gap-3'>
            <Button asChild>
              <Link to='/login'>Login</Link>
            </Button>
            <Button asChild variant='outline'>
              <Link to='/signup'>Create account</Link>
            </Button>
          </div>

          <div className='mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3'>
            <div className='rounded-lg border bg-card px-4 py-3'>
              <div className='text-sm font-semibold'>Faster operations</div>
              <div className='mt-1 text-xs text-muted-foreground'>Automate recurring tasks & reduce manual work.</div>
            </div>
            <div className='rounded-lg border bg-card px-4 py-3'>
              <div className='text-sm font-semibold'>Accurate billing</div>
              <div className='mt-1 text-xs text-muted-foreground'>Track rent cycles, payments, and dues.</div>
            </div>
            <div className='rounded-lg border bg-card px-4 py-3'>
              <div className='text-sm font-semibold'>Secure & role-based</div>
              <div className='mt-1 text-xs text-muted-foreground'>RBAC permissions for teams and admins.</div>
            </div>
          </div>
        </div>

        <div className='rounded-2xl border bg-gradient-to-br from-muted/40 via-background to-background p-6'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Card className='py-4'>
              <CardHeader className='pb-0'>
                <CardTitle className='text-base'>Tenant Management</CardTitle>
                <CardDescription>Onboarding, profiles, occupancy & history.</CardDescription>
              </CardHeader>
            </Card>
            <Card className='py-4'>
              <CardHeader className='pb-0'>
                <CardTitle className='text-base'>Rooms & Beds</CardTitle>
                <CardDescription>Inventory, allocations, and pricing setup.</CardDescription>
              </CardHeader>
            </Card>
            <Card className='py-4'>
              <CardHeader className='pb-0'>
                <CardTitle className='text-base'>Tickets</CardTitle>
                <CardDescription>Track issues and maintenance progress.</CardDescription>
              </CardHeader>
            </Card>
            <Card className='py-4'>
              <CardHeader className='pb-0'>
                <CardTitle className='text-base'>Reports</CardTitle>
                <CardDescription>Dashboard insights and performance trends.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      <div className='mt-10 grid gap-3'>
        <div className='text-xl font-semibold'>Quick access</div>
        <div className='text-sm text-muted-foreground'>
          Jump into the main modules. If you are not logged in, you will be redirected to login.
        </div>
      </div>

      <div className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {quickAccess.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title} className='py-4'>
              <CardHeader className='gap-2'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex items-center gap-2'>
                    <div className='flex size-9 items-center justify-center rounded-md border bg-background'>
                      <Icon className='size-4 text-muted-foreground' />
                    </div>
                    <div>
                      <CardTitle className='text-base'>{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </div>

                  <Badge variant={item.badge === 'Available' ? 'default' : 'outline'}>
                    {item.badge}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant='outline' className='w-full'>
                  <Link to={item.url}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className='mt-10 rounded-2xl border bg-card p-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <div className='text-lg font-semibold'>Ready to manage your PG professionally?</div>
            <div className='mt-1 text-sm text-muted-foreground'>
              Create your account and start with your first location today.
            </div>
          </div>
          <div className='flex flex-wrap gap-3'>
            <Button asChild>
              <Link to='/signup'>Get started</Link>
            </Button>
            <Button asChild variant='outline'>
              <Link to='/login'>Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
