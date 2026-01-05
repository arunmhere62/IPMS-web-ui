import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

import { PublicLayout } from '@/components/layout/public-layout'
import { LoginScreen } from '@/screens/auth/LoginScreen'
import { SignupScreen } from '@/screens/auth/SignupScreen'
import { HomePage } from '@/screens/HomePage'
import { PublicHome } from '@/screens/PublicHome'
import { SubscriptionsScreen } from '@/screens/subscription/SubscriptionsScreen'
import { TermsScreen } from '@/screens/public/TermsScreen'
import { PrivacyScreen } from '@/screens/public/PrivacyScreen'
import { PGLocationsScreen } from '@/screens/pg-locations/PGLocationsScreen'
import { PGDetailsScreen } from '@/screens/pg-locations/PGDetailsScreen'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path='/home' element={<PublicHome />} />
        <Route path='/login' element={<LoginScreen />} />
        <Route path='/signup' element={<SignupScreen />} />
        <Route path='/subscriptions' element={<SubscriptionsScreen />} />
        <Route path='/terms' element={<TermsScreen />} />
        <Route path='/privacy' element={<PrivacyScreen />} />
      </Route>
      <Route element={<AuthenticatedLayout />}>
        <Route path='/' element={<HomePage />} />
        <Route path='/pg-locations' element={<PGLocationsScreen />} />
        <Route path='/pg-locations/:id' element={<PGDetailsScreen />} />
      </Route>
      <Route path='*' element={<Navigate to='/home' replace />} />
    </Routes>
  )
}
