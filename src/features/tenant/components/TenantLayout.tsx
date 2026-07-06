import { Outlet } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { Navigate } from 'react-router-dom'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Header } from '@/components/layout/header'
import { SkipToMain } from '@/components/skip-to-main'
import { getTenantSidebarData } from './tenant-sidebar-data'
import { TenantSidebar } from './TenantSidebar'

export function TenantLayout() {
  const accessToken = getCookie('access_token')
  const ownerAuth = useAppSelector((s) => s.auth)
  const tenantAuth = useAppSelector((s) => s.tenantAuth)

  const isOwner = ownerAuth.isAuthenticated
  const isTenant = tenantAuth.isAuthenticated

  // Route protection: owners cannot access tenant routes
  if (isOwner) {
    return <Navigate to='/' replace />
  }

  // Tenants must be authenticated to access tenant routes
  if (!accessToken || !isTenant) {
    return <Navigate to='/tenant-login' replace />
  }

  const sidebarData = getTenantSidebarData()
  const displayName = tenantAuth.tenant?.name || 'Tenant'
  const displayEmail = tenantAuth.tenant?.email || tenantAuth.tenant?.phone || ''

  const navUser = {
    name: displayName,
    email: displayEmail,
    avatar: '',
  }

  const defaultOpen = getCookie('sidebar_state') !== 'false'

  return (
    <LayoutProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <SkipToMain />
        <TenantSidebar data={sidebarData} user={navUser} />
        <SidebarInset
          className={cn(
            'has-[[data-variant=inset]]:bg-slate-50',
            'min-h-screen'
          )}
        >
          <Header fixed>
            <div className='flex w-full items-center gap-2 sm:gap-3'>
              <div className='ms-auto flex items-center gap-2 sm:gap-3'>
                {/* Add tenant-specific header items here if needed */}
              </div>
            </div>
          </Header>
          <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </LayoutProvider>
  )
}
