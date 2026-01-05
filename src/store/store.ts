import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer from './slices/authSlice'
import pgLocationReducer from './slices/pgLocationSlice'
import { baseApi } from '@/services/baseApi'

const rootReducer = combineReducers({
  auth: authReducer,
  pgLocations: pgLocationReducer,
  [baseApi.reducerPath]: baseApi.reducer,
})

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'pgLocations'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
