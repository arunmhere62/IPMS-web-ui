import {

  createApi,

  fetchBaseQuery,

  type BaseQueryFn,

  type FetchArgs,

  type FetchBaseQueryError,

} from '@reduxjs/toolkit/query/react'

import type { BaseQueryApi } from '@reduxjs/toolkit/query'

import type { RootState } from '@/store/store'

import { getCookie, setCookie, clearAuthCookies } from '@/lib/cookies'

import { setCredentials, logout } from '@/store/slices/authSlice'



const API_BASE_URL = (import.meta.env as Record<string, string | undefined>).VITE_API_BASE_URL



// Token shape returned by jwt.service.ts generateTokens(), wrapped in ResponseUtil.success()
type RefreshData = {
  access_token: string
  refresh_token: string
  token_type: 'Bearer'
  expires_in: number
}

type ApiEnvelope = {
  success: boolean
  statusCode: number
  message: string
  data: unknown
}

const isApiEnvelope = (v: unknown): v is ApiEnvelope =>
  typeof v === 'object' && v !== null && 'success' in v && 'statusCode' in v && 'data' in v

const unwrapEnvelope = (v: unknown): unknown => {
  if (isApiEnvelope(v)) return v.data
  return v
}



const rawBaseQuery = fetchBaseQuery({

  baseUrl: API_BASE_URL || '',

  responseHandler: async (response) => {

    const text = await response.text()

    if (!text) return null



    try {

      return JSON.parse(text)

    } catch {

      return { rawText: text }

    }

  },

  prepareHeaders: (headers, { getState }) => {

    const state = getState() as RootState

    const token = state.auth.accessToken || getCookie('access_token')

    if (token) headers.set('Authorization', `Bearer ${token}`)



    const user = state.auth.user

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



    const selectedPgLocationId = state.pgLocations?.selectedPGLocationId

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



const refreshAccessToken = async (api: BaseQueryApi): Promise<{ accessToken: string; refreshToken?: string } | null> => {

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



  const raw = 'data' in refreshResult ? refreshResult.data : null

  const inner = unwrapEnvelope(raw) as RefreshData | null

  const accessToken = inner?.access_token

  if (!accessToken) return null



  return {

    accessToken,

    refreshToken: inner?.refresh_token,

  }

}



const refreshAccessTokenLocked = async (api: BaseQueryApi): Promise<{ accessToken: string; refreshToken?: string } | null> => {

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



  if (
    'error' in result &&
    result.error &&
    typeof result.error.status === 'number' &&
    result.error.status === 401 &&
    !isAuthRefreshCall(args)
  ) {

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

      clearAuthCookies()

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

