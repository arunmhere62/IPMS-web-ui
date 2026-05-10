import type { PGLocation } from '@/types'
import { baseApi } from './baseApi'

export interface RoomStatistics {
  total_rooms: number
  total_beds: number
  occupied_beds: number
  available_beds: number
  total_monthly_revenue: number
}

export interface TenantStatistics {
  total_tenants: number
  active_tenants: number
  inactive_tenants: number
  occupancy_rate: number
}

export interface BedDetail {
  s_no: number
  bed_no: string
  price: number
  is_occupied: boolean
  tenant?: {
    name: string
    phone_no: string
  }
}

export interface RoomDetail {
  s_no: number
  room_no: string
  total_beds: number
  occupied_beds: number
  available_beds: number
  occupancy_rate: number
  beds?: BedDetail[]
}

export interface PGLocationDetails {
  s_no: number
  location_name: string
  address: string
  city: {
    name: string
  }
  state: {
    name: string
  }
  pg_type: string
  status: string
  rent_cycle_type: string
  rent_cycle_start: string
  rent_cycle_end: string
  pincode: string
  images: string[]
  room_statistics: RoomStatistics
  tenant_statistics: TenantStatistics
  room_details: RoomDetail[]
}

type ApiEnvelope<T> = {
  data?: T
}

type BackendEnvelope<T> = {
  statusCode?: number
  message?: string
  success: boolean
  timestamp?: string
  data: T
}

export type GetPGLocationsResponse = BackendEnvelope<PGLocation[]>

export type PGLocationsMutationResponse = {
  success: boolean
  data: PGLocation
  message?: string
}

export type GetPGLocationsParams = {
  _t?: number
}

export type GetPGLocationDetailsResponse = {
  success: boolean
  data: PGLocationDetails
  message?: string
}

const unwrapCentralData = <T>(response: unknown): T => {
  if (
    response &&
    typeof response === 'object' &&
    'success' in response &&
    'statusCode' in response
  ) {
    return (response as { data?: T }).data as T
  }
  return response as T
}

const normalizeEntityResponse = <T>(
  response: unknown
): { success: boolean; data: T; message?: string } => {
  if (
    response &&
    typeof response === 'object' &&
    'success' in response &&
    'data' in response &&
    !('statusCode' in response)
  ) {
    return response as { success: boolean; data: T; message?: string }
  }

  const unwrapped = unwrapCentralData<T>(response)
  return {
    success: (response as { success?: boolean })?.success ?? true,
    data: unwrapped,
    message: (response as { message?: string })?.message,
  }
}

export const pgLocationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPGLocations: build.query<
      GetPGLocationsResponse,
      GetPGLocationsParams | void
    >({
      query: (params) => ({
        url: '/pg-locations',
        method: 'GET',
        params: params ?? undefined,
      }),
      keepUnusedDataFor: 300,
      transformResponse: (
        response: ApiEnvelope<unknown> | unknown
      ): GetPGLocationsResponse => {
        const maybeNested = (response as ApiEnvelope<GetPGLocationsResponse>)
          ?.data
        const r = maybeNested ?? response
        return r as GetPGLocationsResponse
      },
      providesTags: (result: GetPGLocationsResponse | undefined) => {
        const items = result?.data || []
        return [
          { type: 'PGLocations' as const, id: 'LIST' },
          ...items.map((l: PGLocation) => ({
            type: 'PGLocation' as const,
            id: l.s_no,
          })),
        ]
      },
    }),

    createPGLocation: build.mutation<
      PGLocationsMutationResponse,
      Partial<PGLocation>
    >({
      query: (body) => ({ url: '/pg-locations', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<unknown> | unknown) =>
        normalizeEntityResponse<PGLocation>(response),
      invalidatesTags: [
        { type: 'PGLocations', id: 'LIST' },
        { type: 'Dashboard' as const, id: 'SUMMARY' },
      ],
    }),

    updatePGLocation: build.mutation<
      PGLocationsMutationResponse,
      { id: number; data: Partial<PGLocation> }
    >({
      query: ({ id, data }) => ({
        url: `/pg-locations/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiEnvelope<unknown> | unknown) =>
        normalizeEntityResponse<PGLocation>(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'PGLocations', id: 'LIST' },
        { type: 'PGLocation', id: arg.id },
        { type: 'Dashboard' as const, id: 'SUMMARY' },
      ],
    }),

    deletePGLocation: build.mutation<PGLocationsMutationResponse, number>({
      query: (id) => ({ url: `/pg-locations/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiEnvelope<unknown> | unknown) =>
        normalizeEntityResponse<PGLocation>(response),
      invalidatesTags: (_res, _err, id) => [
        { type: 'PGLocations', id: 'LIST' },
        { type: 'PGLocation', id },
        { type: 'Dashboard' as const, id: 'SUMMARY' },
      ],
    }),

    getPGLocationDetails: build.query<GetPGLocationDetailsResponse, number>({
      query: (pgId) => ({
        url: `/pg-locations/${pgId}/details`,
        method: 'GET',
      }),
      transformResponse: (response: ApiEnvelope<unknown> | unknown) =>
        normalizeEntityResponse<PGLocationDetails>(response),
      providesTags: (_res, _err, pgId) => [
        { type: 'PGLocationDetails' as const, id: pgId },
      ],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetPGLocationsQuery,
  useLazyGetPGLocationsQuery,
  useCreatePGLocationMutation,
  useUpdatePGLocationMutation,
  useDeletePGLocationMutation,
  useGetPGLocationDetailsQuery,
  useLazyGetPGLocationDetailsQuery,
} = pgLocationsApi
