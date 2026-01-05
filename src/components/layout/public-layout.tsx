import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getCookie } from '@/lib/cookies'
import { PublicHeader } from '@/components/layout/public-header'

export function PublicLayout() {
  const location = useLocation()
  const isEmbedded = new URLSearchParams(location.search).get('embed') === '1'

  const accessToken = getCookie('access_token')

  if (!isEmbedded && accessToken) {
    return <Navigate to='/' replace />
  }

  if (isEmbedded) {
    return <Outlet />
  }

  return (
    <div>
      <PublicHeader />

      <Outlet />
    </div>
  )
}
