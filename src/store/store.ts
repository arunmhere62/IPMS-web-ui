import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer, { logout } from './slices/authSlice'
import pgLocationReducer, { resetPGLocation } from './slices/pgLocationSlice'
import { baseApi } from '@/services/baseApi'
import { publicSubscriptionApi } from '@/services/subscriptionApi'

const rootReducer = combineReducers({
  auth: authReducer,
  pgLocations: pgLocationReducer,
  [baseApi.reducerPath]: baseApi.reducer,
  [publicSubscriptionApi.reducerPath]: publicSubscriptionApi.reducer,
})

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'pgLocations'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

// On logout: reset pgLocations slice and purge persisted localStorage
const logoutMiddleware = () => (next: (action: unknown) => unknown) => (action: unknown) => {
  const result = next(action)
  if ((action as { type?: string }).type === logout.type) {
    store.dispatch(resetPGLocation())
    store.dispatch(baseApi.util.resetApiState())
    store.dispatch(publicSubscriptionApi.util.resetApiState())
    setTimeout(() => persistor.purge(), 0)
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
    }).concat(logoutMiddleware).concat(baseApi.middleware).concat(publicSubscriptionApi.middleware),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
