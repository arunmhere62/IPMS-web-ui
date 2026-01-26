import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleAlert, LogOut, RefreshCw, Settings, Ticket, User } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/form/page-header'

import { baseApi } from '@/services/baseApi'
import { useLogoutMutation } from '@/services/authApi'
import { useGetSubscriptionStatusQuery } from '@/services/subscriptionApi'
import { logout } from '@/store/slices/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { removeCookie } from '@/lib/cookies'

type ErrorLike = {
  data?: {
    message?: string
  }
  message?: string
}

const isSuperAdminUser = (user: any): boolean => {
  const roleNameRaw = user?.role_name ?? user?.roles?.role_name
  const roleName = String(roleNameRaw ?? '').toLowerCase()
  return roleName === 'super_admin' || roleName === 'superadmin' || roleName === 'super admin'
}

export function SettingsScreen() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const user = useAppSelector((s) => s.auth.user)
  const selectedPGLocationId = useAppSelector((s) => (s as any).pgLocations?.selectedPGLocationId)

  const isSuperAdmin = useMemo(() => isSuperAdminUser(user), [user])

  const {
    data: subscriptionStatus,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useGetSubscriptionStatusQuery(undefined, { skip: !isSuperAdmin })

  const [apiLogout, { isLoading: serverLoggingOut }] = useLogoutMutation()

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const subscriptionErrorMessage =
    (subscriptionError as ErrorLike | undefined)?.data?.message || (subscriptionError as ErrorLike | undefined)?.message

  const handleLogout = async () => {
    try {
      try {
        await apiLogout().unwrap()
      } catch {
        // best-effort
      }
    } finally {
      dispatch(logout())
      dispatch(baseApi.util.resetApiState())
      removeCookie('access_token')
      removeCookie('refresh_token')
      removeCookie('x_user_id')
      removeCookie('x_organization_id')
      removeCookie('x-organization-id')
      removeCookie('x_pg_location_id')
      removeCookie('x-pg-location-id')
      navigate('/login', { replace: true })
    }
  }

  const userName = String((user as any)?.name ?? 'User')
  const userPhone = (user as any)?.phone
  const userEmail = (user as any)?.email

  const initials = useMemo(() => {
    const parts = userName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
    const first = parts[0]?.[0] ?? 'U'
    const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1]
    return `${first}${second ?? ''}`.toUpperCase()
  }, [userName])

  return (
    <div className='container mx-auto max-w-5xl px-3 py-6'>
      <PageHeader title='Settings' subtitle='Manage your account & app preferences' />

      <div className='mt-4 grid gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-3'>
                <div className='flex size-14 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground'>
                  {initials}
                </div>
                <div className='min-w-0'>
                  <div className='truncate text-base font-semibold'>{userName}</div>
                  <div className='mt-1 text-xs text-muted-foreground'>{userPhone || userEmail || ''}</div>
                  {selectedPGLocationId ? (
                    <div className='mt-1 text-xs text-muted-foreground'>Selected PG: #{selectedPGLocationId}</div>
                  ) : null}
                </div>
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                <Button asChild variant='outline' size='sm'>
                  <Link to='/settings/profile'>
                    <User className='me-2 size-4' />
                    Profile
                  </Link>
                </Button>
                <Button variant='destructive' size='sm' onClick={() => setLogoutDialogOpen(true)}>
                  <LogOut className='me-2 size-4' />
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isSuperAdmin ? (
          <Card>
            <CardContent className='p-4'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div>
                  <div className='flex items-center gap-2 text-sm font-semibold'>
                    <Settings className='size-4 text-primary' />
                    Subscription
                  </div>
                  <div className='mt-1 text-xs text-muted-foreground'>Current subscription status</div>
                </div>

                <div className='flex items-center gap-2'>
                  <Button variant='outline' size='sm' onClick={() => void refetchSubscription()} disabled={subscriptionLoading}>
                    <RefreshCw className='me-2 size-4' />
                    Refresh
                  </Button>
                  <Button asChild size='sm'>
                    <Link to='/subscriptions'>View Plans</Link>
                  </Button>
                  <Button asChild variant='outline' size='sm'>
                    <Link to='/subscriptions/history'>History</Link>
                  </Button>
                </div>
              </div>

              {subscriptionErrorMessage ? (
                <div className='mt-3'>
                  <Alert variant='destructive'>
                    <CircleAlert />
                    <AlertTitle>Subscription error</AlertTitle>
                    <AlertDescription>{subscriptionErrorMessage}</AlertDescription>
                  </Alert>
                </div>
              ) : null}

              <div className='mt-4 flex flex-wrap items-center gap-2'>
                {subscriptionLoading ? <Badge variant='secondary'>Loading…</Badge> : null}
                {!subscriptionLoading ? (
                  <>
                    <Badge variant={subscriptionStatus?.has_active_subscription ? 'default' : 'outline'}>
                      {subscriptionStatus?.has_active_subscription ? 'Active' : 'No Active Subscription'}
                    </Badge>
                    {subscriptionStatus?.subscription?.plan?.name ? (
                      <Badge variant='secondary'>{subscriptionStatus.subscription.plan.name}</Badge>
                    ) : null}
                    {typeof subscriptionStatus?.days_remaining === 'number' ? (
                      <Badge variant='outline'>{subscriptionStatus.days_remaining} days remaining</Badge>
                    ) : null}
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className='p-4'>
            <div className='text-sm font-semibold'>Options</div>
            <div className='mt-3 grid gap-2'>
              <Button asChild variant='outline' className='justify-start'>
                <Link to='/settings/profile'>
                  <User className='me-2 size-4' />
                  Profile
                </Link>
              </Button>
              <Button asChild variant='outline' className='justify-start'>
                <Link to='/tickets'>
                  <Ticket className='me-2 size-4' />
                  Report Issue
                </Link>
              </Button>
              <Button asChild variant='outline' className='justify-start'>
                <Link to='/privacy'>Privacy Policy</Link>
              </Button>
              <Button asChild variant='outline' className='justify-start'>
                <Link to='/faq'>Help & Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className='text-center text-xs text-muted-foreground'>Version 1.0.0</div>
      </div>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to logout?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={serverLoggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setLogoutDialogOpen(false)
                await handleLogout()
              }}
              disabled={serverLoggingOut}
            >
              {serverLoggingOut ? 'Logging out…' : 'Logout'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
