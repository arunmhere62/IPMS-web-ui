import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getCookie, setCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { Header } from '@/components/layout/header'
import { ThemeSwitch } from '@/components/theme-switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGetPGLocationsQuery } from '@/services/pgLocationsApi'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setSelectedPGLocation } from '@/store/slices/pgLocationSlice'
import type { PGLocation } from '@/types'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const location = useLocation()
  const accessToken = getCookie('access_token')

  const dispatch = useAppDispatch()
  const selectedPGLocationId = useAppSelector((s) => (s as any).pgLocations?.selectedPGLocationId) as
    | number
    | null

  const { data: pgLocationsResponse } = useGetPGLocationsQuery(undefined)

  const pgLocations: PGLocation[] = Array.isArray((pgLocationsResponse as any)?.data)
    ? ((pgLocationsResponse as any).data as PGLocation[])
    : Array.isArray(pgLocationsResponse)
      ? (pgLocationsResponse as any as PGLocation[])
      : []

  const activePg =
    pgLocations.find((l) => l.s_no === selectedPGLocationId) ||
    (selectedPGLocationId ? undefined : pgLocations[0])

  const ensureSelectedPg = (id: number | null) => {
    dispatch(setSelectedPGLocation(id))
    if (id) setCookie('x_pg_location_id', String(id))
  }

  if (!accessToken) {
    return <Navigate to='/login' replace state={{ from: location.pathname }} />
  }

  useEffect(() => {
    if (!selectedPGLocationId && pgLocations.length > 0) {
      ensureSelectedPg(pgLocations[0].s_no)
    }
  }, [pgLocations.length, selectedPGLocationId])

  const defaultOpen = getCookie('sidebar_state') !== 'false'
  return (
    <LayoutProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <SkipToMain />
        <AppSidebar />
        <SidebarInset
          className={cn(
            // Set content container, so we can use container queries
            '@container/content',

            // If layout is fixed, set the height
            // to 100svh to prevent overflow
            'has-data-[layout=fixed]:h-svh',

            // If layout is fixed and sidebar is inset,
            // set the height to 100svh - spacing (total margins) to prevent overflow
            'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
          )}
        >
          <Header fixed>
            <div className='flex w-full items-center gap-3'>
              <div className='text-sm font-semibold'>Dashboard</div>
              <div className='ms-auto flex items-center'>
                {pgLocations.length > 0 ? (
                  <Select
                    value={String(activePg?.s_no ?? '')}
                    onValueChange={(v) => {
                      const id = Number(v)
                      if (Number.isFinite(id) && id > 0) ensureSelectedPg(id)
                    }}
                  >
                    <SelectTrigger className='me-3 w-[220px] max-w-[55vw]'>
                      <SelectValue placeholder='Select PG' />
                    </SelectTrigger>
                    <SelectContent>
                      {pgLocations.map((l) => (
                        <SelectItem key={l.s_no} value={String(l.s_no)}>
                          {l.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                <ThemeSwitch />
              </div>
            </div>
          </Header>
          {children ?? <Outlet />}
        </SidebarInset>
      </SidebarProvider>
    </LayoutProvider>
  )
}
