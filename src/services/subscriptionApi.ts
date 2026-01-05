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
  max_pg_locations?: number | null
  max_tenants?: number | null
  max_beds?: number | null
  max_employees?: number | null
  max_rooms?: number | null
  max_users?: number | null
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

type ApiEnvelope<T> = {
  data?: T
}

const unwrapCentralData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'success' in response && 'statusCode' in response) {
    return (response as any).data as T
  }
  return response as T
}

const unwrapNestedData = (value: any) => {
  let current = value
  for (let i = 0; i < 5; i += 1) {
    if (current && typeof current === 'object' && 'data' in current) {
      current = (current as any).data
      continue
    }
    break
  }
  return current
}

const normalizeListResponse = <T>(response: any): { success: boolean; data: T; message?: string } => {
  const unwrapped = unwrapCentralData<any>(response)

  if (unwrapped && typeof unwrapped === 'object' && 'success' in unwrapped && 'data' in unwrapped) {
    return unwrapped as any
  }

  return {
    success: (response as any)?.success ?? true,
    data: unwrapped as T,
    message: (response as any)?.message,
  }
}

const normalizeSubscriptionStatus = (response: any): SubscriptionStatus => {
  const unwrapped = unwrapCentralData<any>(response)

  if (unwrapped && typeof unwrapped === 'object' && 'has_active_subscription' in unwrapped) {
    return unwrapped as SubscriptionStatus
  }

  if (unwrapped && typeof unwrapped === 'object' && 'data' in unwrapped) {
    const maybeInner = (unwrapped as any).data
    if (maybeInner && typeof maybeInner === 'object' && 'has_active_subscription' in maybeInner) {
      return maybeInner as SubscriptionStatus
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
      transformResponse: (response: ApiEnvelope<GetPlansResponse> | any) =>
        normalizeListResponse<SubscriptionPlan[]>(response),
    }),

    getCurrentSubscription: build.query<GetCurrentSubscriptionResponse, void>({
      query: () => ({ url: '/subscription/current', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<GetCurrentSubscriptionResponse> | any) =>
        normalizeListResponse<UserSubscription | null>(response),
    }),

    getSubscriptionStatus: build.query<SubscriptionStatus, void>({
      query: () => ({ url: '/subscription/status', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<SubscriptionStatus> | any) =>
        normalizeSubscriptionStatus(response),
    }),

    getSubscriptionHistory: build.query<GetSubscriptionHistoryResponse, void>({
      query: () => ({ url: '/subscription/history', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<GetSubscriptionHistoryResponse> | any) =>
        normalizeListResponse<UserSubscription[]>(response),
    }),

    subscribeToPlan: build.mutation<SubscribeToPlanResponse, { planId: number }>({
      query: ({ planId }) => ({
        url: '/subscription/subscribe',
        method: 'POST',
        body: { plan_id: planId },
      }),
      transformResponse: (response: ApiEnvelope<SubscribeToPlanResponse> | any) => {
        const unwrapped = unwrapCentralData<any>(response)
        const nested = unwrapNestedData(unwrapped)
        return nested as any
      },
    }),

    cancelSubscription: build.mutation<CancelSubscriptionResponse, { subscriptionId: number }>({
      query: ({ subscriptionId }) => ({
        url: `/subscription/${subscriptionId}/cancel`,
        method: 'POST',
      }),
      transformResponse: (response: ApiEnvelope<CancelSubscriptionResponse> | any) => {
        const unwrapped = unwrapCentralData<any>(response)
        return (unwrapped as any)?.data ?? unwrapped
      },
    }),

    renewSubscription: build.mutation<RenewSubscriptionResponse, { subscriptionId: number }>({
      query: ({ subscriptionId }) => ({
        url: `/subscription/${subscriptionId}/renew`,
        method: 'POST',
      }),
      transformResponse: (response: ApiEnvelope<RenewSubscriptionResponse> | any) => {
        const unwrapped = unwrapCentralData<any>(response)
        return (unwrapped as any)?.data ?? unwrapped
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
