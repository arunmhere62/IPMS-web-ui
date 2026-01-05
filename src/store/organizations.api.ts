import { api } from './api'

export type Pagination = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type PaginatedData<T> = {
  data: T[]
  pagination: Pagination
}

export type ApiResponseDto<T> = {
  success: boolean
  statusCode: number
  message: string
  timestamp: string
  path?: string
  data?: T
}

export type OrganizationListItem = {
  s_no: number
  name: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE' | string
  created_at: string | null
  updated_at: string | null
  pg_locations_count: number
  rooms_count: number
  beds_count: number
  employees_count: number
  tenants_count: number
}

export type OrganizationDetailsPg = {
  s_no: number
  location_name: string
  address: string
  status: 'ACTIVE' | 'INACTIVE' | string | null
  created_at: string | null
  updated_at: string | null
  rooms_count: number
  beds_count: number
  employees_count: number
  tenants_count: number
}

export type OrganizationDetails = {
  s_no: number
  name: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE' | string
  created_at: string | null
  updated_at: string | null
  pg_locations_count: number
  rooms_count: number
  beds_count: number
  employees_count: number
  tenants_count: number
  pg_locations: OrganizationDetailsPg[]
}

export const organizationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOrganizations: builder.query<
      ApiResponseDto<PaginatedData<OrganizationListItem>>,
      { page?: number; limit?: number } | void
    >({
      query: (args) => {
        const page = args?.page ?? 1
        const limit = args?.limit ?? 10
        return {
          url: '/organizations',
          params: { page, limit },
        }
      },
      providesTags: [{ type: 'Organizations', id: 'LIST' }],
    }),

    getOrganizationDetails: builder.query<ApiResponseDto<OrganizationDetails>, number>({
      query: (organizationId) => `/organizations/${organizationId}`,
      providesTags: [{ type: 'Organizations', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetOrganizationsQuery, useGetOrganizationDetailsQuery } =
  organizationsApi
