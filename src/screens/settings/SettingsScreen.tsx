import { useMemo, useState } from 'react'
import { useLogoutMutation } from '@/services/authApi'
import { baseApi } from '@/services/baseApi'
import { useGetSubscriptionStatusQuery } from '@/services/subscriptionApi'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout, type AuthUser } from '@/store/slices/authSlice'
import type { RootState } from '@/store/store'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import {
  CircleAlert,
  LogOut,
  RefreshCw,
  Settings,
  Ticket,
  User as UserIcon,
  HelpCircle,
  Shield,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tags,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { removeCookie } from '@/lib/cookies'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/form/page-header'

const getErrorMessage = (error: unknown): string | undefined => {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as FetchBaseQueryError).data
    if (data && typeof data === 'object' && 'message' in data) {
      return String(data.message)
    }
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message)
  }
  return undefined
}

const isSuperAdminUser = (user: AuthUser): boolean => {
  const roleNameRaw = user?.role_name ?? user?.roles?.role_name
  const roleName = String(roleNameRaw ?? '').toLowerCase()
  return (
    roleName === 'super_admin' ||
    roleName === 'superadmin' ||
    roleName === 'super admin'
  )
}

export function SettingsScreen() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const user = useAppSelector((s: RootState) => s.auth.user)
  const selectedPGLocationId = useAppSelector(
    (s: RootState) => s.pgLocations?.selectedPGLocationId
  )

  const isSuperAdmin = useMemo(() => isSuperAdminUser(user), [user])

  const {
    data: subscriptionStatus,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useGetSubscriptionStatusQuery(undefined, { skip: !isSuperAdmin })

  const [apiLogout, { isLoading: serverLoggingOut }] = useLogoutMutation()

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const subscriptionErrorMessage = getErrorMessage(subscriptionError)

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

  const userName = String(user?.name ?? 'User')
  const userPhone = user?.phone
  const userEmail = user?.email

  const handleRefreshSubscription = async () => {
    if (!isSuperAdmin) return
    await refetchSubscription()
  }

  return (
    <div className='container mx-auto max-w-5xl px-3 py-6'>
      <PageHeader
        title='Settings'
        subtitle='Manage your account & app preferences'
      />

      <div className='mt-4 grid gap-4'>
        {/* User Info Card */}
        <Card>
          <CardContent className='p-4'>
            <div className='flex flex-col items-center py-4 sm:flex-row sm:items-start sm:py-4'>
              <div className='mb-3 flex size-20 items-center justify-center rounded-full bg-primary text-3xl sm:mr-4 sm:mb-0'>
                <UserIcon className='size-10 text-primary-foreground' />
              </div>
              <div className='text-center sm:text-left'>
                <div className='text-xl font-bold'>{userName}</div>
                <div className='text-sm text-muted-foreground'>
                  {userPhone || userEmail}
                </div>
                {selectedPGLocationId ? (
                  <div className='mt-1 text-xs text-muted-foreground'>
                    Selected PG: #{selectedPGLocationId}
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card for Super Admin */}
        {isSuperAdmin ? (
          <Card>
            <CardContent className='p-4'>
              <div className='mb-3 flex items-center'>
                <div className='mr-3 flex size-10 items-center justify-center rounded-full bg-primary/10'>
                  <Settings className='size-5 text-primary' />
                </div>
                <div className='flex-1'>
                  <div className='text-base font-bold'>Subscription</div>
                  {subscriptionLoading ? (
                    <div className='mt-1 flex items-center text-sm text-muted-foreground'>
                      <div className='mr-2 size-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                      Loading...
                    </div>
                  ) : subscriptionStatus?.has_active_subscription ? (
                    <div className='mt-1 flex items-center text-sm text-green-600'>
                      <CheckCircle2 className='mr-1.5 size-3.5' />
                      <span className='font-semibold'>
                        Active -{' '}
                        {subscriptionStatus.subscription?.plan?.name ||
                          'Unknown Plan'}
                      </span>
                    </div>
                  ) : (
                    <div className='mt-1 flex items-center text-sm text-yellow-600'>
                      <AlertCircle className='mr-1.5 size-3.5' />
                      <span className='font-semibold'>
                        No Active Subscription
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight className='size-5 text-muted-foreground' />
              </div>

              {/* Days remaining with progress bar */}
              {subscriptionStatus?.has_active_subscription &&
                subscriptionStatus.days_remaining !== undefined && (
                  <div className='mb-3 rounded-lg p-2.5'>
                    <div className='mb-1.5 text-xs text-muted-foreground'>
                      {subscriptionStatus.days_remaining} days remaining
                    </div>
                    <div className='h-1 overflow-hidden rounded-full bg-border'>
                      <div
                        className='h-full bg-primary'
                        style={{
                          width: `${(subscriptionStatus.days_remaining / (subscriptionStatus.subscription?.plan?.duration || 30)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

              {/* Subscription action buttons */}
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleRefreshSubscription}
                  disabled={subscriptionLoading}
                  className='h-9'
                >
                  <RefreshCw className='mr-1.5 size-4' />
                  Refresh
                </Button>
                <Button asChild size='sm' className='h-9'>
                  <Link to='/subscriptions'>
                    <Tags className='mr-1.5 size-4' />
                    View Plans
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  size='sm'
                  className='h-9 border-primary text-primary hover:bg-primary/10'
                >
                  <Link to='/subscriptions/history'>
                    <Clock className='mr-1.5 size-4' />
                    History
                  </Link>
                </Button>
              </div>

              {subscriptionErrorMessage ? (
                <div className='mt-3'>
                  <Alert variant='destructive'>
                    <CircleAlert />
                    <AlertTitle>Subscription error</AlertTitle>
                    <AlertDescription>
                      {subscriptionErrorMessage}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {/* Settings Options */}
        <Card>
          <CardContent className='p-4'>
            <div className='divide-y'>
              <Button
                asChild
                variant='ghost'
                className='h-auto w-full justify-start px-0 py-4 hover:bg-transparent'
              >
                <Link to='/settings/profile'>
                  <div className='flex flex-1 items-center gap-3'>
                    <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10'>
                      <UserIcon className='size-4 text-primary' />
                    </div>
                    <span className='font-semibold'>Profile</span>
                  </div>
                  <ChevronRight className='size-5 text-muted-foreground' />
                </Link>
              </Button>
              <Button
                asChild
                variant='ghost'
                className='h-auto w-full justify-start px-0 py-4 hover:bg-transparent'
              >
                <Link to='/tickets'>
                  <div className='flex flex-1 items-center gap-3'>
                    <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10'>
                      <Ticket className='size-4 text-primary' />
                    </div>
                    <span className='font-semibold'>Report Issue</span>
                  </div>
                  <ChevronRight className='size-5 text-muted-foreground' />
                </Link>
              </Button>
              <Button
                asChild
                variant='ghost'
                className='h-auto w-full justify-start px-0 py-4 hover:bg-transparent'
              >
                <Link to='/privacy'>
                  <div className='flex flex-1 items-center gap-3'>
                    <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10'>
                      <Shield className='size-4 text-primary' />
                    </div>
                    <span className='font-semibold'>Privacy Policy</span>
                  </div>
                  <ChevronRight className='size-5 text-muted-foreground' />
                </Link>
              </Button>
              <Button
                asChild
                variant='ghost'
                className='h-auto w-full justify-start px-0 py-4 hover:bg-transparent'
              >
                <Link to='/faq'>
                  <div className='flex flex-1 items-center gap-3'>
                    <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10'>
                      <HelpCircle className='size-4 text-primary' />
                    </div>
                    <span className='font-semibold'>Help & Support</span>
                  </div>
                  <ChevronRight className='size-5 text-muted-foreground' />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          variant='destructive'
          className='w-full py-6 text-lg font-bold'
          onClick={() => setLogoutDialogOpen(true)}
          disabled={serverLoggingOut}
        >
          {serverLoggingOut ? (
            <>
              <div className='mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
              Logging out...
            </>
          ) : (
            <>
              <LogOut className='mr-2 size-5' />
              Logout
            </>
          )}
        </Button>

        <div className='text-center text-xs text-muted-foreground'>
          Version 1.0.0
        </div>
      </div>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={serverLoggingOut}>
              Cancel
            </AlertDialogCancel>
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
