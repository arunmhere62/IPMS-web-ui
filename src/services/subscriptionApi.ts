import { baseApi } from './baseApi'

export interface SubscriptionPlan {
  s_no: number
  name: string
  description: string
  price: string
  duration: number
  currency: string
  features: string[] | null
  is_active: boolean
  is_trial?: boolean
  is_free?: boolean
  limits?: {
    max_pg_locations?: number | null
    max_tenants?: number | null
    max_rooms?: number | null
    max_beds?: number | null
    max_employees?: number | null
    max_users?: number | null
    max_invoices_per_month?: number | null
    max_sms_per_month?: number | null
    max_whatsapp_per_month?: number | null
  } | null
  max_pg_locations?: number | null
  max_tenants?: number | null
  max_beds?: number | null
  max_employees?: number | null
  max_rooms?: number | null
  max_users?: number | null
  max_invoices_per_month?: number | null
  max_sms_per_month?: number | null
  max_whatsapp_per_month?: number | null
  gst_breakdown?: {
    cgst_rate: number
    cgst_amount: number
    sgst_rate: number
    sgst_amount: number
    igst_rate: number
    igst_amount: number
    total_price_including_gst: number
  }
}

export interface UserSubscription {
  s_no?: number
  id?: number
  user_id: number
  plan_id: number
  start_date: string
  end_date: string
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING'
  payment_status?: 'PAID' | 'PENDING' | 'FAILED'
  amount_paid?: number
  plan?: SubscriptionPlan
  subscription_plans?: SubscriptionPlan
  created_at: string
  updated_at: string
  auto_renew?: boolean
  organization_id?: number
}

export interface SubscriptionStatus {
  has_active_subscription: boolean
  subscription?: UserSubscription
  days_remaining?: number
  is_trial?: boolean
}

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const unwrapCentralData = <T>(response: unknown): T => {
  if (isRecord(response) && 'success' in response && 'statusCode' in response) {
    return (response as RecordValue).data as T
  }
  return response as T
}

const unwrapNestedData = (value: unknown): unknown => {
  let current: unknown = value
  for (let i = 0; i < 5; i += 1) {
    if (isRecord(current) && 'data' in current) {
      current = (current as RecordValue).data
      continue
    }
    break
  }
  return current
}

const normalizeListResponse = <T>(response: unknown): { success: boolean; data: T; message?: string } => {
  const unwrapped = unwrapCentralData<unknown>(response)

  if (isRecord(unwrapped) && 'success' in unwrapped && 'data' in unwrapped) {
    return unwrapped as unknown as { success: boolean; data: T; message?: string }
  }

  const responseRecord = isRecord(response) ? response : undefined

  return {
    success: (responseRecord?.success as boolean | undefined) ?? true,
    data: unwrapped as T,
    message: responseRecord?.message as string | undefined,
  }
}

const normalizeSubscriptionStatus = (response: unknown): SubscriptionStatus => {
  const unwrapped = unwrapCentralData<unknown>(response)

  if (isRecord(unwrapped) && 'has_active_subscription' in unwrapped) {
    return unwrapped as unknown as SubscriptionStatus
  }

  if (isRecord(unwrapped) && 'data' in unwrapped) {
    const maybeInner = (unwrapped as RecordValue).data
    if (isRecord(maybeInner) && 'has_active_subscription' in maybeInner) {
      return maybeInner as unknown as SubscriptionStatus
    }
  }

  return unwrapped as SubscriptionStatus
}

export type GetPlansResponse = { success: boolean; data: SubscriptionPlan[] }
export type GetCurrentSubscriptionResponse = { success: boolean; data: UserSubscription | null }
export type GetSubscriptionHistoryResponse = { success: boolean; data: UserSubscription[] }

export type SubscribeToPlanResponse = {
  success: boolean
  data: {
    subscription: UserSubscription
    plan?: SubscriptionPlan
    pricing?: {
      currency: string
      base_price: number
      cgst_amount: number
      sgst_amount: number
      total_price_including_gst: number
    }
    payment_url: string
    order_id: string
  }
}

export type RenewSubscriptionResponse = {
  success: boolean
  data: {
    subscription: UserSubscription
    payment_url?: string
  }
}

export type CancelSubscriptionResponse = { success: boolean; message: string }

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPlans: build.query<GetPlansResponse, void>({
      query: () => ({ url: '/subscription/plans', method: 'GET' }),
      transformResponse: (response: unknown) => normalizeListResponse<SubscriptionPlan[]>(response),
    }),

    getCurrentSubscription: build.query<GetCurrentSubscriptionResponse, void>({
      query: () => ({ url: '/subscription/current', method: 'GET' }),
      transformResponse: (response: unknown) => normalizeListResponse<UserSubscription | null>(response),
    }),

    getSubscriptionStatus: build.query<SubscriptionStatus, void>({
      query: () => ({ url: '/subscription/status', method: 'GET' }),
      transformResponse: (response: unknown) => normalizeSubscriptionStatus(response),
    }),

    getSubscriptionHistory: build.query<GetSubscriptionHistoryResponse, void>({
      query: () => ({ url: '/subscription/history', method: 'GET' }),
      transformResponse: (response: unknown) => normalizeListResponse<UserSubscription[]>(response),
    }),

    subscribeToPlan: build.mutation<SubscribeToPlanResponse, { planId: number }>({
      query: ({ planId }) => ({
        url: '/subscription/subscribe',
        method: 'POST',
        body: { plan_id: planId },
      }),
      transformResponse: (response: unknown) => {
        const unwrapped = unwrapCentralData<unknown>(response)
        const nested = unwrapNestedData(unwrapped)
        return nested as SubscribeToPlanResponse
      },
    }),

    cancelSubscription: build.mutation<CancelSubscriptionResponse, { subscriptionId: number }>({
      query: ({ subscriptionId }) => ({
        url: `/subscription/${subscriptionId}/cancel`,
        method: 'POST',
      }),
      transformResponse: (response: unknown) => {
        const unwrapped = unwrapCentralData<unknown>(response)
        if (isRecord(unwrapped) && 'data' in unwrapped) {
          return (unwrapped as RecordValue).data as CancelSubscriptionResponse
        }
        return unwrapped as CancelSubscriptionResponse
      },
    }),

    renewSubscription: build.mutation<RenewSubscriptionResponse, { subscriptionId: number }>({
      query: ({ subscriptionId }) => ({
        url: `/subscription/${subscriptionId}/renew`,
        method: 'POST',
      }),
      transformResponse: (response: unknown) => {
        const unwrapped = unwrapCentralData<unknown>(response)
        if (isRecord(unwrapped) && 'data' in unwrapped) {
          return (unwrapped as RecordValue).data as RenewSubscriptionResponse
        }
        return unwrapped as RenewSubscriptionResponse
      },
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetPlansQuery,
  useLazyGetPlansQuery,
  useGetCurrentSubscriptionQuery,
  useLazyGetCurrentSubscriptionQuery,
  useGetSubscriptionStatusQuery,
  useLazyGetSubscriptionStatusQuery,
  useGetSubscriptionHistoryQuery,
  useLazyGetSubscriptionHistoryQuery,
  useSubscribeToPlanMutation,
  useCancelSubscriptionMutation,
  useRenewSubscriptionMutation,
} = subscriptionApi
