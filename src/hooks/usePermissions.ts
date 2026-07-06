import { useSelector } from 'react-redux'
import { Permission } from '@/config/rbac.config'
import { getBackendPermissionKeyCandidates } from '@/config/rbac-backend-map'
import type { RootState } from '@/store/store'

export const usePermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user)
  const userRole = (user?.role_name as string) ?? ''
  const isSuperAdmin =
    userRole === 'SUPER_ADMIN' || userRole.toLowerCase() === 'super_admin'
  const permissionsMap = useSelector(
    (state: RootState) => (state as any).rbac?.permissionsMap ?? {}
  )
  const loadedAt = useSelector(
    (state: RootState) => (state as any).rbac?.loadedAt ?? null
  )
  const isReady = loadedAt != null

  return {
    can: (permission: Permission): boolean => {
      if (isSuperAdmin) return true
      const keys = getBackendPermissionKeyCandidates(permission)
      return keys.some((k) => Boolean((permissionsMap as any)[k]))
    },

    canAny: (permissions: Permission[]): boolean => {
      if (isSuperAdmin) return true
      return permissions.some((p) => {
        const keys = getBackendPermissionKeyCandidates(p)
        return keys.some((k) => Boolean((permissionsMap as any)[k]))
      })
    },

    canAll: (permissions: Permission[]): boolean => {
      if (isSuperAdmin) return true
      return permissions.every((p) => {
        const keys = getBackendPermissionKeyCandidates(p)
        return keys.some((k) => Boolean((permissionsMap as any)[k]))
      })
    },

    canAccess: (): boolean => true,

    isReady,
    role: userRole,
    isSuperAdmin,
    isAdmin: userRole === 'ADMIN' || userRole.toLowerCase() === 'admin',
    user,
  }
}
