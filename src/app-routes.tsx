import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { DashboardScreen } from '@/screens/dashboard/dashboard-screen'
import { OrganizationsScreen } from '@/screens/organizations/organizations-screen'
import { OrganizationDetailsRoute } from '@/screens/organizations/organization-details-route'
import { SubscriptionPlansListScreen } from '@/screens/subscription-plans/subscription-plans-list-screen'
import { SubscriptionPlanCreateScreen } from '@/screens/subscription-plans/subscription-plan-create-screen'
import { SubscriptionPlanDetailsScreen } from '@/screens/subscription-plans/subscription-plan-details-screen'
import { PermissionsScreen } from '@/screens/permissions/permissions-screen'
import { RolesScreen } from '@/screens/roles/roles-screen'
import { RolePermissionsScreen } from '@/screens/role-permissions/role-permissions-screen'
import { LegalDocumentsScreen } from '@/screens/legal-documents/legal-documents-screen'
import { LoginScreen } from '@/screens/auth/login-screen'
import { OtpScreen } from '@/screens/auth/otp-screen'
import { FaqScreen } from '@/screens/faq/faq-screen'
import { TicketsScreen } from '@/screens/tickets/tickets-screen'
import { TicketDetailsScreen } from '@/screens/tickets/ticket-details-screen'
import { PublicHomeScreen } from '@/screens/public/home-screen'
import { PrivacyScreen } from '@/screens/public/privacy-screen'
import { TermsScreen } from '@/screens/public/terms-screen'
import { PublicLayout } from '@/components/layout/public-layout'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path='/login' element={<LoginScreen />} />
        <Route path='/login/otp' element={<OtpScreen />} />
        <Route path='/home' element={<PublicHomeScreen />} />
        <Route path='/faq' element={<FaqScreen />} />
        <Route path='/terms' element={<TermsScreen />} />
        <Route path='/privacy' element={<PrivacyScreen />} />
      </Route>
      <Route element={<AuthenticatedLayout />}>
        <Route path='/' element={<DashboardScreen />} />
        <Route path='/organizations' element={<OrganizationsScreen />} />
        <Route path='/organizations/:orgId' element={<OrganizationDetailsRoute />} />
        <Route path='/subscription-plans' element={<SubscriptionPlansListScreen />} />
        <Route path='/subscription-plans/new' element={<SubscriptionPlanCreateScreen />} />
        <Route path='/subscription-plans/:id' element={<SubscriptionPlanDetailsScreen />} />
        <Route path='/legal-documents' element={<LegalDocumentsScreen />} />
        <Route path='/tickets' element={<TicketsScreen />} />
        <Route path='/tickets/:id' element={<TicketDetailsScreen />} />
        <Route path='/permissions' element={<PermissionsScreen />} />
        <Route path='/roles' element={<RolesScreen />} />
        <Route path='/role-permissions' element={<RolePermissionsScreen />} />
      </Route>
      <Route path='*' element={<Navigate to='/home' replace />} />
    </Routes>
  )
}
