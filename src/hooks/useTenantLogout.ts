import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { tenantLogout } from '@/features/tenant/store/tenantAuthSlice'
import { clearTenantCookies } from '@/lib/cookies'

export function useTenantLogout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  return async () => {
    // Clear tenant auth state
    dispatch(tenantLogout())
    
    // Clear all tenant-specific cookies
    clearTenantCookies()
    
    // Navigate to tenant login
    navigate('/tenant-login', { replace: true })
  }
}
