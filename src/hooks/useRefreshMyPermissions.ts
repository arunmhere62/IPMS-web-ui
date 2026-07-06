import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLazyGetMyPermissionsQuery } from '@/services/rbacApi'
import { useLazyGetSubscriptionStatusQuery } from '@/services/subscriptionApi'
import { useLazyGetAppPublicStatusQuery } from '@/services/appSettingsApi'
import {
  setPermissionsMap,
  setSubscription,
  setIsOnboardingComplete,
  setOnboardingFlags,
  clearPermissions,
} from '@/store/slices/rbacSlice'
import { setAppSettings } from '@/store/slices/appSettingsSlice'
import type { RootState } from '@/store/store'

type Options = {
  ttlMs?: number
}

export const useRefreshMyPermissions = (options?: Options) => {
  const ttlMs = options?.ttlMs ?? 10 * 60 * 1000

  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const loadedAt = useSelector(
    (state: RootState) => (state as any).rbac?.loadedAt ?? null
  )

  const [fetchMyPerms] = useLazyGetMyPermissionsQuery()
  const [fetchSubscriptionStatus] = useLazyGetSubscriptionStatusQuery()
  const [fetchAppPublicStatus] = useLazyGetAppPublicStatusQuery()

  const inFlightRef = useRef(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      dispatch(clearPermissions())
      return
    }

    if (inFlightRef.current) return
    inFlightRef.current = true
    try {
      const [permsData, subscriptionData, appSettingsData] =
        await Promise.allSettled([
          fetchMyPerms().unwrap(),
          fetchSubscriptionStatus().unwrap(),
          fetchAppPublicStatus().unwrap(),
        ])

      const permissionsMap =
        permsData.status === 'fulfilled'
          ? (permsData.value as any)?.permissions_map || {}
          : {}
      dispatch(setPermissionsMap(permissionsMap))

      const subscription =
        subscriptionData.status === 'fulfilled'
          ? (subscriptionData.value as any) ?? null
          : null
      dispatch(setSubscription(subscription))

      const appSettings =
        appSettingsData.status === 'fulfilled'
          ? (appSettingsData.value as any) ?? null
          : null
      dispatch(setAppSettings(appSettings))

      dispatch(setIsOnboardingComplete(null))
      dispatch(
        setOnboardingFlags({
          hasRooms: false,
          hasTenants: false,
        })
      )
    } catch {
      dispatch(setPermissionsMap({}))
    } finally {
      inFlightRef.current = false
    }
  }, [
    dispatch,
    fetchMyPerms,
    fetchSubscriptionStatus,
    fetchAppPublicStatus,
    isAuthenticated,
  ])

  const maybeRefresh = useCallback(async () => {
    if (!isAuthenticated) return

    if (loadedAt == null) {
      await refresh()
      return
    }

    const age = Date.now() - Number(loadedAt)
    if (typeof ttlMs === 'number' && !isNaN(ttlMs) && age >= ttlMs) {
      await refresh()
    }
  }, [isAuthenticated, loadedAt, refresh, ttlMs])

  useEffect(() => {
    if (!isAuthenticated) return
    maybeRefresh()
  }, [isAuthenticated, maybeRefresh])

  return { refresh, maybeRefresh }
}
