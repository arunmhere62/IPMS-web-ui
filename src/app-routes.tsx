import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

import { PublicLayout } from '@/components/layout/public-layout'
import { LoginScreen } from '@/screens/auth/LoginScreen'
import { SignupScreen } from '@/screens/auth/SignupScreen'
import { HomePage } from '@/screens/HomePage'
import { PublicHome } from '@/screens/PublicHome'
import { SubscriptionsScreen } from '@/screens/subscription/SubscriptionsScreen'
import { FaqScreen } from '@/screens/faq/FaqScreen'
import { TermsScreen } from '@/screens/public/TermsScreen'
import { PrivacyScreen } from '@/screens/public/PrivacyScreen'
import { PGLocationsScreen } from '@/screens/pg-locations/PGLocationsScreen'
import { PGDetailsScreen } from '@/screens/pg-locations/PGDetailsScreen'
import { EmployeesScreen } from '@/screens/employees/EmployeesScreen'
import { BedsScreen } from '@/screens/beds/BedsScreen'
import { RoomsScreen } from '@/screens/rooms/RoomsScreen'
import { RoomDetailsScreen } from '@/screens/rooms/RoomDetailsScreen'
import { TenantsScreen } from '@/screens/tenants/TenantsScreen'
import { TenantDetailsScreen } from '@/screens/tenants/TenantDetailsScreen'
import { TenantFormScreen } from '@/screens/tenants/TenantFormScreen'
import { VisitorsScreen } from '@/screens/visitors/VisitorsScreen'
import { VisitorDetailsScreen } from '@/screens/visitors/VisitorDetailsScreen'
import { VisitorFormScreen } from '@/screens/visitors/VisitorFormScreen'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path='/home' element={<PublicHome />} />
        <Route path='/login' element={<LoginScreen />} />
        <Route path='/signup' element={<SignupScreen />} />
        <Route path='/subscriptions' element={<SubscriptionsScreen />} />
        <Route path='/faq' element={<FaqScreen />} />
        <Route path='/terms' element={<TermsScreen />} />
        <Route path='/privacy' element={<PrivacyScreen />} />
      </Route>
      <Route element={<AuthenticatedLayout />}>
        <Route path='/' element={<HomePage />} />
        <Route path='/pg-locations' element={<PGLocationsScreen />} />
        <Route path='/pg-locations/:id' element={<PGDetailsScreen />} />
        <Route path='/employees' element={<EmployeesScreen />} />
        <Route path='/tenants' element={<TenantsScreen />} />
        <Route path='/tenants/new' element={<TenantFormScreen />} />
        <Route path='/tenants/:id' element={<TenantDetailsScreen />} />
        <Route path='/tenants/:id/edit' element={<TenantFormScreen />} />
        <Route path='/visitors' element={<VisitorsScreen />} />
        <Route path='/visitors/new' element={<VisitorFormScreen />} />
        <Route path='/visitors/:id' element={<VisitorDetailsScreen />} />
        <Route path='/visitors/:id/edit' element={<VisitorFormScreen />} />
        <Route path='/rooms' element={<RoomsScreen />} />
        <Route path='/rooms/:id' element={<RoomDetailsScreen />} />
        <Route path='/beds' element={<BedsScreen />} />
        <Route path='/faq' element={<FaqScreen />} />
      </Route>
      <Route path='*' element={<Navigate to='/home' replace />} />
    </Routes>
  )
}
