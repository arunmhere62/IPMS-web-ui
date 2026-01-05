import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

import { PublicLayout } from '@/components/layout/public-layout'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
       
      </Route>
      <Route element={<AuthenticatedLayout />}>
       
      </Route>
      <Route path='*' element={<Navigate to='/home' replace />} />
    </Routes>
  )
}
