import { HomePage } from '@/screens/HomePage'
import { PublicHome } from '@/screens/PublicHome'
import { LoginScreen } from '@/screens/auth/LoginScreen'
import { SignupScreen } from '@/screens/auth/SignupScreen'
import { RoleSelectionScreen } from '@/screens/auth/RoleSelectionScreen'
import { TenantLoginScreen } from '@/screens/auth/TenantLoginScreen'
import { TenantDashboardScreen } from '@/features/tenant/screens/TenantDashboardScreen'
import { TenantPGDetailsScreen } from '@/features/tenant/screens/TenantPGDetailsScreen'
import { TenantRoomScreen } from '@/features/tenant/screens/TenantRoomScreen'
import { TenantPaymentsScreen } from '@/features/tenant/screens/TenantPaymentsScreen'
import { TenantTicketsScreen } from '@/features/tenant/screens/TenantTicketsScreen'
import { TenantSettingsScreen } from '@/features/tenant/screens/TenantSettingsScreen'
import { EmployeeDetailsScreen } from '@/screens/employees/EmployeeDetailsScreen'
import { EmployeePermissionOverridesScreen } from '@/screens/employees/EmployeePermissionOverridesScreen'
import { EmployeesScreen } from '@/screens/employees/EmployeesScreen'
import { ExpensesScreen } from '@/screens/expenses/ExpensesScreen'
import { FaqScreen } from '@/screens/faq/FaqScreen'
import { AdvancePaymentsScreen } from '@/screens/payments/AdvancePaymentsScreen'
import { PaymentsScreen } from '@/screens/payments/PaymentsScreen'
import { RefundPaymentsScreen } from '@/screens/payments/RefundPaymentsScreen'
import { RentPaymentsScreen } from '@/screens/payments/RentPaymentsScreen'
import { PGDetailsScreen } from '@/screens/pg-locations/PGDetailsScreen'
import { PGLocationsScreen } from '@/screens/pg-locations/PGLocationsScreen'
import { AboutUsScreen } from '@/screens/public/AboutUsScreen'
import { ContactUsScreen } from '@/screens/public/ContactUsScreen'
import { PrivacyScreen } from '@/screens/public/PrivacyScreen'
import { RefundPolicyScreen } from '@/screens/public/RefundPolicyScreen'
import { SoftwareServicesScreen } from '@/screens/public/SoftwareServicesScreen'
import { TermsScreen } from '@/screens/public/TermsScreen'
import { QuickSetupScreen } from '@/screens/QuickSetupScreen'
import { RoomDetailsScreen } from '@/screens/rooms/RoomDetailsScreen'
import { RoomElectricityBillsScreen } from '@/screens/rooms/RoomElectricityBillsScreen'
import { RoomsScreen } from '@/screens/rooms/RoomsScreen'
import { SettingsScreen } from '@/screens/settings/SettingsScreen'
import { UserProfileScreen } from '@/screens/settings/UserProfileScreen'
import { AuthSubscriptionsScreen } from '@/screens/subscription/AuthSubscriptionsScreen'
import { SubscriptionConfirmScreen } from '@/screens/subscription/SubscriptionConfirmScreen'
import { SubscriptionHistoryScreen } from '@/screens/subscription/SubscriptionHistoryScreen'
import { SubscriptionsScreen } from '@/screens/subscription/SubscriptionsScreen'
import { TenantDetailsScreen } from '@/screens/tenants/TenantDetailsScreen'
import { TenantFormScreen } from '@/screens/tenants/TenantFormScreen'
import { TenantsScreen } from '@/screens/tenants/TenantsScreen'
import { UpcomingVacanciesScreen } from '@/screens/tenants/UpcomingVacanciesScreen'
import { TicketsScreen } from '@/screens/tickets/TicketsScreen'
import { VisitorDetailsScreen } from '@/screens/visitors/VisitorDetailsScreen'
import { VisitorFormScreen } from '@/screens/visitors/VisitorFormScreen'
import { VisitorsScreen } from '@/screens/visitors/VisitorsScreen'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { PublicLayout } from '@/components/layout/public-layout'
import { TenantLayout } from '@/features/tenant/components/TenantLayout'

export function AppRoutes() {
  return (
    <Routes>
      {/* Authenticated routes first - includes hybrid policy pages */}
      <Route element={<AuthenticatedLayout />}>
        <Route path='/' element={<HomePage />} />
        <Route path='/quick-setup' element={<QuickSetupScreen />} />
        <Route path='/pg-locations' element={<PGLocationsScreen />} />
        <Route path='/pg-locations/:id' element={<PGDetailsScreen />} />
        <Route path='/employees' element={<EmployeesScreen />} />
        <Route path='/employees/:id' element={<EmployeeDetailsScreen />} />
        <Route path='/employees/:id/permissions' element={<EmployeePermissionOverridesScreen />} />
        <Route path='/tenants' element={<TenantsScreen />} />
        <Route path='/tenants/upcoming-vacancies' element={<UpcomingVacanciesScreen />} />
        <Route path='/tenants/new' element={<TenantFormScreen />} />
        <Route path='/tenants/:id' element={<TenantDetailsScreen />} />
        <Route path='/tenants/:id/edit' element={<TenantFormScreen />} />
        <Route path='/tenants/:id/rent-payments' element={<RentPaymentsScreen />} />
        <Route path='/tenants/:id/advance-payments' element={<AdvancePaymentsScreen />} />
        <Route path='/tenants/:id/refund-payments' element={<RefundPaymentsScreen />} />
        <Route path='/visitors' element={<VisitorsScreen />} />
        <Route path='/visitors/new' element={<VisitorFormScreen />} />
        <Route path='/visitors/:id' element={<VisitorDetailsScreen />} />
        <Route path='/visitors/:id/edit' element={<VisitorFormScreen />} />
        <Route path='/settings' element={<SettingsScreen />} />
        <Route path='/settings/profile' element={<UserProfileScreen />} />
        <Route path='/tickets' element={<TicketsScreen />} />
        <Route path='/rooms' element={<RoomsScreen />} />
        <Route path='/rooms/:id' element={<RoomDetailsScreen />} />
        <Route
          path='/rooms/:id/electricity-bills'
          element={<RoomElectricityBillsScreen />}
        />
        <Route path='/payments' element={<PaymentsScreen />} />
        <Route path='/payments/rent' element={<RentPaymentsScreen />} />
        <Route path='/payments/advance' element={<AdvancePaymentsScreen />} />
        <Route path='/payments/refund' element={<RefundPaymentsScreen />} />
        <Route path='/expenses' element={<ExpensesScreen />} />
        <Route
          path='/subscriptions/manage'
          element={<AuthSubscriptionsScreen />}
        />
        <Route
          path='/subscriptions/confirm'
          element={<SubscriptionConfirmScreen />}
        />
        <Route
          path='/subscriptions/history'
          element={<SubscriptionHistoryScreen />}
        />
        {/* Dashboard policy pages - shown inside app with sidebar */}
        <Route path='/dashboard/faq' element={<FaqScreen />} />
        <Route path='/dashboard/about' element={<AboutUsScreen />} />
        <Route path='/dashboard/terms' element={<TermsScreen />} />
        <Route path='/dashboard/privacy' element={<PrivacyScreen />} />
        <Route
          path='/dashboard/refund-policy'
          element={<RefundPolicyScreen />}
        />
        <Route path='/dashboard/contact' element={<ContactUsScreen />} />
        <Route
          path='/dashboard/software-services'
          element={<SoftwareServicesScreen />}
        />
      </Route>
      {/* Public routes - for logged-out users */}
      <Route element={<PublicLayout />}>
        <Route path='/home' element={<PublicHome />} />
        <Route path='/login' element={<RoleSelectionScreen />} />
        <Route path='/owner-login' element={<LoginScreen />} />
        <Route path='/tenant-login' element={<TenantLoginScreen />} />
        <Route path='/signup' element={<SignupScreen />} />
        <Route path='/faq' element={<FaqScreen />} />
        <Route path='/about' element={<AboutUsScreen />} />
        <Route path='/terms' element={<TermsScreen />} />
        <Route path='/privacy' element={<PrivacyScreen />} />
        <Route path='/refund-policy' element={<RefundPolicyScreen />} />
        <Route path='/contact' element={<ContactUsScreen />} />
        <Route path='/software-services' element={<SoftwareServicesScreen />} />
        <Route path='/subscriptions' element={<SubscriptionsScreen />} />
      </Route>
      {/* Tenant routes - for tenant portal */}
      <Route element={<TenantLayout />}>
        <Route path='/tenant-dashboard' element={<TenantDashboardScreen />} />
        <Route path='/tenant-dashboard/pg-details' element={<TenantPGDetailsScreen />} />
        <Route path='/tenant-dashboard/room' element={<TenantRoomScreen />} />
        <Route path='/tenant-dashboard/payments' element={<TenantPaymentsScreen />} />
        <Route path='/tenant-dashboard/tickets' element={<TenantTicketsScreen />} />
        <Route path='/tenant-dashboard/settings' element={<TenantSettingsScreen />} />
      </Route>
      <Route path='*' element={<Navigate to='/login' replace />} />
    </Routes>
  )
}
