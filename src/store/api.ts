import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { getCookie } from '@/lib/cookies'

const shouldAttachPgLocationHeader = (url: string) => {
  return !(url === '/health' || url.startsWith('/auth/'))
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: ((() => {
    const rawBaseQuery = fetchBaseQuery({
      baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/web/v1',
    })

    const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
      args,
      api,
      extraOptions
    ) => {
      const request: FetchArgs = typeof args === 'string' ? { url: args } : { ...args }
      const url = request.url

      const headers = new Headers(request.headers as HeadersInit | undefined)

      const accessToken = getCookie('access_token')
      const userId = getCookie('x_user_id')

      if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
      if (userId) headers.set('x-user-id', userId)
      void shouldAttachPgLocationHeader(url)

      request.headers = headers

      return rawBaseQuery(request, api, extraOptions)
    }

    return baseQuery
  })()) as any,
  tagTypes: [
    'SubscriptionPlans',
    'Organizations',
    'Tickets',
    'Ticket',
    'Permissions',
    'Roles',
    'RolePermissions',
    'UserPermissionOverrides',
    'LegalDocuments',
  ],
  endpoints: (builder) => ({
    getHealth: builder.query<{ ok: boolean }, void>({
      query: () => '/health',
    }),
  }),
})

export const { useGetHealthQuery } = api
