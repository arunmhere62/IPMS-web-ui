import { api } from './api'

const TAG_TYPE = 'SubscriptionPlans' as const

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

export type SubscriptionPlan = {
  s_no: number
  name: string
  description: string | null
  duration: number
  price: string | number
  currency: string
  features: any
  max_pg_locations: number | null
  max_tenants: number | null
  max_rooms: number | null
  max_beds: number | null
  max_employees: number | null
  max_users: number | null
  max_invoices_per_month: number | null
  max_sms_per_month: number | null
  max_whatsapp_per_month: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CreateSubscriptionPlanPayload = {
  name: string
  description?: string
  duration: number
  price: number
  currency?: string
  features?: any
  max_pg_locations?: number
  max_tenants?: number
  max_rooms?: number
  max_beds?: number
  max_employees?: number
  max_users?: number
  max_invoices_per_month?: number
  max_sms_per_month?: number
  max_whatsapp_per_month?: number
  is_active?: boolean
}

export type UpdateSubscriptionPlanPayload = Partial<CreateSubscriptionPlanPayload>

export const subscriptionPlansApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptionPlans: builder.query<
      ApiResponseDto<PaginatedData<SubscriptionPlan>>,
      { page?: number; limit?: number; is_active?: boolean } | void
    >({
      query: (args) => {
        const page = args?.page ?? 1
        const limit = args?.limit ?? 10
        const params: Record<string, any> = { page, limit }
        if (typeof args?.is_active === 'boolean') params.is_active = args.is_active
        return {
          url: '/subscription-plans',
          params,
        }
      },
      providesTags: [{ type: TAG_TYPE, id: 'LIST' }],
    }),

    getSubscriptionPlanById: builder.query<ApiResponseDto<SubscriptionPlan>, number>({
      query: (id) => `/subscription-plans/${id}`,
      providesTags: (_res, _err, id) => [{ type: TAG_TYPE, id }],
    }),

    createSubscriptionPlan: builder.mutation<
      ApiResponseDto<SubscriptionPlan>,
      CreateSubscriptionPlanPayload
    >({
      query: (body) => ({
        url: '/subscription-plans',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: TAG_TYPE, id: 'LIST' }],
    }),

    updateSubscriptionPlan: builder.mutation<
      ApiResponseDto<SubscriptionPlan>,
      { id: number; body: UpdateSubscriptionPlanPayload }
    >({
      query: ({ id, body }) => ({
        url: `/subscription-plans/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: TAG_TYPE, id: 'LIST' },
        { type: TAG_TYPE, id: arg.id },
      ],
    }),

    deactivateSubscriptionPlan: builder.mutation<ApiResponseDto<SubscriptionPlan>, number>({
      query: (id) => ({
        url: `/subscription-plans/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: TAG_TYPE, id: 'LIST' },
        { type: TAG_TYPE, id },
      ],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetSubscriptionPlansQuery,
  useGetSubscriptionPlanByIdQuery,
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
  useDeactivateSubscriptionPlanMutation,
} = subscriptionPlansApi
