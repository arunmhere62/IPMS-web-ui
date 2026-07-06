import { baseApi } from '@/services/baseApi'

export type TenantSendOtpRequest = {
  phone: string
}

export type TenantSendOtpResponse = {
  success: boolean
  message: string
  data?: {
    expires_in?: number
  }
}

export type TenantVerifyOtpRequest = {
  phone: string
  otp: string
}

export type TenantVerifyOtpResponse = {
  accessToken: string
  refreshToken: string
  tenant: {
    tenant_id: number
    name: string
    phone: string
    email: string | null
    status: string
    organization_id?: number | null
  }
  pg: {
    pg_id: number
    location_name: string
    address: string
    city?: string | null
    state?: string | null
    rent_cycle_type?: string
  }
}

export type TenantRefreshTokenRequest = {
  refreshToken: string
}

export type TenantRefreshTokenResponse = {
  success: boolean
  message: string
  data: {
    accessToken: string
    refreshToken: string
  }
}

export const tenantPortalAuthApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    tenantSendOtp: build.mutation<TenantSendOtpResponse, TenantSendOtpRequest>({
      query: (body) => ({
        url: '/tenant-auth/send-otp',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => {
        return response
      },
    }),
    tenantVerifyOtp: build.mutation<any, TenantVerifyOtpRequest>({
      query: (body) => ({
        url: '/tenant-auth/verify-otp',
        method: 'POST',
        body,
      }),
    }),
    tenantRefreshToken: build.mutation<TenantRefreshTokenResponse, TenantRefreshTokenRequest>({
      query: (body) => ({
        url: '/tenant-auth/refresh',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => {
        return response
      },
    }),
    tenantLogout: build.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/tenant-auth/logout',
        method: 'POST',
      }),
      transformResponse: (response: any) => {
        return response
      },
    }),
  }),
  overrideExisting: false,
})

export const {
  useTenantSendOtpMutation,
  useTenantVerifyOtpMutation,
  useTenantRefreshTokenMutation,
  useTenantLogoutMutation,
} = tenantPortalAuthApi
