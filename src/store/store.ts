import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer, { logout } from './slices/authSlice'
import tenantAuthReducer, { tenantLogout, resetTenantAuth } from '../features/tenant/store/tenantAuthSlice'
import pgLocationReducer, { resetPGLocation } from './slices/pgLocationSlice'
import rbacReducer, { clearPermissions } from './slices/rbacSlice'
import appSettingsReducer, { clearAppSettings } from './slices/appSettingsSlice'
import { baseApi } from '@/services/baseApi'
import { publicSubscriptionApi } from '@/services/subscriptionApi'
import { tenantBaseApi } from '@/features/tenant/api/tenantPortalApi'

const rootReducer = combineReducers({
  auth: authReducer,
  tenantAuth: tenantAuthReducer,
  pgLocations: pgLocationReducer,
  rbac: rbacReducer,
  appSettings: appSettingsReducer,
  [baseApi.reducerPath]: baseApi.reducer,
  [publicSubscriptionApi.reducerPath]: publicSubscriptionApi.reducer,
  [tenantBaseApi.reducerPath]: tenantBaseApi.reducer,
})

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'pgLocations', 'tenantAuth'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

// On logout: reset pgLocations slice and purge persisted localStorage
const logoutMiddleware = () => (next: (action: unknown) => unknown) => (action: unknown) => {
  const result = next(action)
  if ((action as { type?: string }).type === logout.type) {
    // Owner logout - clear owner-specific data AND tenant data to prevent conflicts
    store.dispatch(resetPGLocation())
    store.dispatch(clearPermissions())
    store.dispatch(clearAppSettings())
    store.dispatch(resetTenantAuth()) // Clear tenant auth state on owner logout
    store.dispatch(baseApi.util.resetApiState())
    store.dispatch(publicSubscriptionApi.util.resetApiState())
    store.dispatch(tenantBaseApi.util.resetApiState())
    setTimeout(() => persistor.purge(), 0)
  }
  if ((action as { type?: string }).type === tenantLogout.type) {
    // Tenant logout - clear tenant-specific data and RTK cache
    store.dispatch(tenantBaseApi.util.resetApiState())
    store.dispatch(baseApi.util.resetApiState())
    store.dispatch(publicSubscriptionApi.util.resetApiState())
  }
  return result
}

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(logoutMiddleware).concat(baseApi.middleware).concat(publicSubscriptionApi.middleware).concat(tenantBaseApi.middleware),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
