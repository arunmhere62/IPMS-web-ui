import { baseApi } from './baseApi'

export interface OrganizationAdmin {
  s_no: number
  name: string
  email: string
  phone: string
  status: string
  role: string
  created_at: string
}

export interface PGLocationRoom {
  s_no: number
  room_no: string
  beds_count: number
}

export interface PGLocationDetail {
  s_no: number
  location_name: string
  address: string
  status: string
  rooms_count: number
  beds_count: number
  rooms: PGLocationRoom[]
}

export interface Organization {
  s_no: number
  name: string
  description: string
  created_at: string
  updated_at: string
  admins: OrganizationAdmin[]
  pg_locations_count: number
  pg_locations: PGLocationDetail[]
}

export interface OrganizationStats {
  totalOrganizations: number
  activeOrganizations: number
  inactiveOrganizations: number
  totalUsers: number
  totalPGLocations: number
  totalTenants: number
  totalRevenue: number
  recentOrganizations: number
}

export interface GetOrganizationsParams {
  page?: number
  limit?: number
}

export interface GetOrganizationsResponse {
  success: boolean
  data: Organization[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export interface GetOrganizationStatsResponse {
  success: boolean
  data: OrganizationStats
}

export interface GetOrganizationByIdResponse {
  success: boolean
  data: Organization
}

export interface UpdateOrganizationResponse {
  success: boolean
  data: Organization
}

type ApiEnvelope<T> = {
  data?: T
}

export const organizationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllOrganizations: build.query<
      GetOrganizationsResponse,
      GetOrganizationsParams | void
    >({
      query: (params) => ({
        url: '/organizations',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (
        response:
          | ApiEnvelope<GetOrganizationsResponse>
          | GetOrganizationsResponse
      ): GetOrganizationsResponse =>
        (response as ApiEnvelope<GetOrganizationsResponse>)?.data ??
        (response as GetOrganizationsResponse),
      providesTags: (result) => {
        const orgs = result?.data || []
        return [
          { type: 'Organizations' as const, id: 'LIST' },
          ...orgs.map((o: Organization) => ({
            type: 'Organization' as const,
            id: o.s_no,
          })),
        ]
      },
    }),

    getOrganizationStats: build.query<GetOrganizationStatsResponse, void>({
      query: () => ({ url: '/organizations/stats', method: 'GET' }),
      transformResponse: (
        response:
          | ApiEnvelope<GetOrganizationStatsResponse>
          | GetOrganizationStatsResponse
      ): GetOrganizationStatsResponse =>
        (response as ApiEnvelope<GetOrganizationStatsResponse>)?.data ??
        (response as GetOrganizationStatsResponse),
      providesTags: [{ type: 'OrganizationStats' as const, id: 'SINGLE' }],
    }),

    getOrganizationById: build.query<GetOrganizationByIdResponse, number>({
      query: (id) => ({ url: `/organizations/${id}`, method: 'GET' }),
      transformResponse: (
        response:
          | ApiEnvelope<GetOrganizationByIdResponse>
          | GetOrganizationByIdResponse
      ): GetOrganizationByIdResponse =>
        (response as ApiEnvelope<GetOrganizationByIdResponse>)?.data ??
        (response as GetOrganizationByIdResponse),
      providesTags: (_res, _err, id) => [{ type: 'Organization' as const, id }],
    }),

    updateOrganization: build.mutation<
      UpdateOrganizationResponse,
      { id: number; data: { name?: string; description?: string } }
    >({
      query: ({ id, data }) => ({
        url: `/organizations/${id}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (
        response:
          | ApiEnvelope<UpdateOrganizationResponse>
          | UpdateOrganizationResponse
      ): UpdateOrganizationResponse =>
        (response as ApiEnvelope<UpdateOrganizationResponse>)?.data ??
        (response as UpdateOrganizationResponse),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Organization' as const, id: arg.id },
      ],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetAllOrganizationsQuery,
  useLazyGetAllOrganizationsQuery,
  useGetOrganizationStatsQuery,
  useLazyGetOrganizationStatsQuery,
  useGetOrganizationByIdQuery,
  useLazyGetOrganizationByIdQuery,
  useUpdateOrganizationMutation,
} = organizationApi
