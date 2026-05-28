import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/slices/authSlice'
import { useLogoutMutation } from '@/services/authApi'
import { clearAuthCookies } from '@/lib/cookies'

export function useLogout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [apiLogout] = useLogoutMutation()

  return async () => {
    try {
      await apiLogout().unwrap()
    } catch {
      // best-effort server logout
    } finally {
      dispatch(logout())    // triggers logoutMiddleware: resets Redux, RTK cache, persistor.purge
      clearAuthCookies()    // clears all auth-related cookies
      navigate('/login', { replace: true })
    }
  }
}
