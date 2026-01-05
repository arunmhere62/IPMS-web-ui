import { baseApi } from './baseApi'

type CentralEnvelope<T> = {
  success?: boolean
  statusCode?: number
  message?: string
  data?: T
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

const unwrapApiOrCentralData = <T>(response: any): T => {
  const central = unwrapCentralData<T>(response)
  if (central && typeof central === 'object' && 'data' in (central as any)) {
    return ((central as any).data ?? central) as T
  }
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as any).data as T
  }
  return response as T
}

export type SendOtpRequest = { phone: string }
export type VerifyOtpRequest = { phone: string; otp: string }
export type SignupRequest = {
  organizationName: string
  name: string
  pgName: string
  phone?: string
  rentCycleType?: string
  rentCycleStart?: number | null
  rentCycleEnd?: number | null
}

export type VerifyOtpResponse = {
  user: any
  accessToken: string
  refreshToken?: string
}

export type RefreshTokenRequest = {
  refreshToken: string
}

export type RefreshTokenResponse = {
  accessToken: string
  refreshToken?: string
}

type VerifyOtpRawResponse = {
  user: any
  accessToken?: string
  refreshToken?: string
  access_token?: string
  refresh_token?: string
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    sendOtp: build.mutation<unknown, SendOtpRequest>({
      query: (body) => ({ url: '/auth/send-otp', method: 'POST', body }),
      transformResponse: (r: CentralEnvelope<any> | ApiEnvelope<any> | any) => r,
    }),

    verifyOtp: build.mutation<VerifyOtpResponse, VerifyOtpRequest>({
      query: (body) => ({ url: '/auth/verify-otp', method: 'POST', body }),
      transformResponse: (response: CentralEnvelope<VerifyOtpRawResponse> | ApiEnvelope<VerifyOtpRawResponse> | any) => {
        const r = unwrapApiOrCentralData<VerifyOtpRawResponse>(response)
        return {
          user: (r as any).user,
          accessToken: (r as any).accessToken ?? (r as any).access_token,
          refreshToken: (r as any).refreshToken ?? (r as any).refresh_token,
        }
      },
    }),

    sendSignupOtp: build.mutation<unknown, SendOtpRequest>({
      query: (body) => ({ url: '/auth/send-signup-otp', method: 'POST', body }),
      transformResponse: (r: CentralEnvelope<any> | any) => unwrapCentralData<any>(r),
    }),

    verifySignupOtp: build.mutation<unknown, VerifyOtpRequest>({
      query: (body) => ({ url: '/auth/verify-signup-otp', method: 'POST', body }),
      transformResponse: (r: CentralEnvelope<any> | any) => unwrapCentralData<any>(r),
    }),

    signup: build.mutation<any, SignupRequest>({
      query: (body) => ({ url: '/auth/signup', method: 'POST', body }),
      transformResponse: (response: CentralEnvelope<any> | any) => {
        const data = unwrapCentralData<any>(response)
        if (response && typeof response === 'object') {
          return {
            ...data,
            message: (response as any).message,
            success: (response as any).success,
            statusCode: (response as any).statusCode,
          }
        }
        return data
      },
    }),

    logout: build.mutation<unknown, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      transformResponse: (r: CentralEnvelope<any> | ApiEnvelope<any> | any) => r,
    }),

    refreshToken: build.mutation<RefreshTokenResponse, RefreshTokenRequest>({
      query: (body) => ({ url: '/auth/refresh', method: 'POST', body }),
      transformResponse: (response: CentralEnvelope<any> | ApiEnvelope<any> | any) => {
        const r = unwrapApiOrCentralData<any>(response)
        return {
          accessToken: (r as any).accessToken ?? (r as any).access_token,
          refreshToken: (r as any).refreshToken ?? (r as any).refresh_token,
        }
      },
    }),
  }),
  overrideExisting: false,
})

export const {
  useSendOtpMutation,
  useVerifyOtpMutation,
  useSendSignupOtpMutation,
  useVerifySignupOtpMutation,
  useSignupMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
} = authApi
