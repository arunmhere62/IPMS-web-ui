import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppSelector } from '@/store/hooks'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useLogoutMutation } from '@/services/authApi'
import { useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/slices/authSlice'
import { toast } from 'sonner'

export function TenantDashboardScreen() {
  const user = useAppSelector((state) => state.auth.user)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [logoutMutation] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap()
      dispatch(logout())
      toast.success('Logged out successfully')
      navigate('/role-selection')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900'>Tenant Dashboard</h1>
          <p className='text-slate-500'>View your PG details and manage your account</p>
        </div>
        <Button variant='outline' onClick={handleLogout}>
          <LogOut className='mr-2 size-4' />
          Logout
        </Button>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name || 'Tenant'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2 text-sm text-slate-600'>
              <p><strong>Phone:</strong> {user?.phone || 'N/A'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
              <p><strong>Status:</strong> {user?.status || 'Active'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My PG Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-slate-500'>
              PG details will be displayed here once integrated with the backend.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-slate-500'>
              Payment history and upcoming payments will be displayed here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
