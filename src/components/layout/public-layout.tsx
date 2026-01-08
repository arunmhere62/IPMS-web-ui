import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getCookie } from '@/lib/cookies'
import { PublicHeader } from '@/components/layout/public-header'

export function PublicLayout() {
  const location = useLocation()
  const isEmbedded = new URLSearchParams(location.search).get('embed') === '1'
  const isHome = location.pathname === '/home'

  const accessToken = getCookie('access_token')

  if (!isEmbedded && accessToken) {
    return <Navigate to='/' replace />
  }

  if (isEmbedded) {
    return <Outlet />
  }

  return (
    <div
      className={
        isHome
          ? "relative overflow-hidden bg-[radial-gradient(1200px_circle_at_15%_5%,rgba(37,99,235,0.16),transparent_55%),radial-gradient(900px_circle_at_85%_15%,rgba(16,185,129,0.12),transparent_52%),radial-gradient(700px_circle_at_55%_95%,rgba(168,85,247,0.10),transparent_55%),linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,1))]"
          : undefined
      }
    >
      {isHome ? (
        <>
          <div className='pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl' />
          <div className='pointer-events-none absolute -right-24 top-40 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl' />
          <div className='pointer-events-none absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-3xl' />
        </>
      ) : null}

      <div className={isHome ? 'relative' : undefined}>
        <PublicHeader />

        <Outlet />
      </div>
    </div>
  )
}
