import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/store/store'
import { getCookie, removeCookie, setCookie } from '@/lib/cookies'
import { setCredentials, logout } from '@/store/slices/authSlice'

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL || '',
  responseHandler: async (response) => {
    const text = await response.text()
    if (!text) return null as any

    try {
      return JSON.parse(text)
    } catch {
      return { rawText: text } as any
    }
  },
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState
    const token = state.auth.accessToken || getCookie('access_token')
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const user: any = state.auth.user
    const userId =
      user?.s_no ??
      user?.id ??
      user?.user_id ??
      user?.userId ??
      getCookie('x_user_id')
    if (userId !== undefined && userId !== null && String(userId).length > 0) {
      headers.set('x-user-id', String(userId))
    }

    const organizationId =
      user?.organization_id ??
      user?.organizationId ??
      user?.org_id ??
      user?.orgId ??
      getCookie('x_organization_id') ??
      getCookie('x-organization-id')
    if (organizationId !== undefined && organizationId !== null && String(organizationId).length > 0) {
      headers.set('x-organization-id', String(organizationId))
    }

    const selectedPgLocationId = (state as any).pgLocations?.selectedPGLocationId
    const pgLocationId =
      selectedPgLocationId ||
      (getCookie('x_pg_location_id') || getCookie('x-pg-location-id') || getCookie('pg_location_id')) ||
      undefined
    if (pgLocationId) headers.set('x-pg-location-id', String(pgLocationId))

    return headers
  },
})

let refreshInFlight: Promise<{ accessToken: string; refreshToken?: string } | null> | null = null

const isAuthRefreshCall = (args: string | FetchArgs) => {
  const url = typeof args === 'string' ? args : args.url
  const path = (url || '').split('?')[0]
  return path === '/auth/refresh' || path.endsWith('/auth/refresh')
}

const refreshAccessToken = async (api: any) => {
  const state = api.getState() as RootState
  const refreshToken = state.auth.refreshToken || getCookie('refresh_token')
  const user = state.auth.user
  if (!refreshToken || !user) return null

  const refreshResult = await rawBaseQuery(
    {
      url: '/auth/refresh',
      method: 'POST',
      body: { refreshToken },
    },
    api,
    {}
  )

  if ('error' in refreshResult && refreshResult.error) return null

  const data: any = (refreshResult as any).data
  const inner =
    data && typeof data === 'object' && 'success' in data && 'statusCode' in data ? (data as any).data : data

  return {
    accessToken: inner?.accessToken ?? inner?.access_token,
    refreshToken: inner?.refreshToken ?? inner?.refresh_token,
  }
}

const refreshAccessTokenLocked = async (api: any) => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        return await refreshAccessToken(api)
      } finally {
        refreshInFlight = null
      }
    })()
  }

  return await refreshInFlight
}

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if ('error' in result && result.error && (result.error as any).status === 401 && !isAuthRefreshCall(args)) {
    const refreshed = await refreshAccessTokenLocked(api)

    if (refreshed?.accessToken) {
      setCookie('access_token', refreshed.accessToken)
      if (refreshed.refreshToken) setCookie('refresh_token', refreshed.refreshToken)

      const currentState = api.getState() as RootState
      const currentUser = currentState.auth.user
      if (currentUser) {
        api.dispatch(
          setCredentials({
            user: currentUser,
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken ?? currentState.auth.refreshToken ?? undefined,
          })
        )
      }

      result = await rawBaseQuery(args, api, extraOptions)
    } else {
      api.dispatch(logout())
      removeCookie('access_token')
      removeCookie('refresh_token')
      removeCookie('x_user_id')
    }
  }

  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Dashboard',
    'Tenants',
    'Tenant',
    'Employees',
    'Employee',
    'EmployeeStats',
    'Expenses',
    'Expense',
    'ExpenseStats',
    'Countries',
    'States',
    'Cities',
    'Organizations',
    'Organization',
    'OrganizationStats',
    'PGLocations',
    'PGLocation',
    'PGLocationDetails',
    'TenantPayments',
    'TenantPayment',
    'TenantPaymentGaps',
    'TenantPaymentNextDates',
    'AdvancePayments',
    'AdvancePayment',
    'RefundPayments',
    'RefundPayment',
    'Roles',
    'Role',
    'Rooms',
    'Room',
    'Beds',
    'Bed',
    'SubscriptionPlans',
    'CurrentSubscription',
    'SubscriptionStatus',
    'SubscriptionHistory',
    'Users',
    'User',
    'Tickets',
    'Ticket',
    'TicketStats',
    'Visitors',
    'Visitor',
    'VisitorStats',
    'S3Objects',
    'S3Object',
    'LegalRequiredStatus',
  ],
  endpoints: () => ({}),
})
