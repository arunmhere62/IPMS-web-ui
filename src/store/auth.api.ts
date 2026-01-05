import { api } from './api'

export type ApiResponseDto<T> = {
  success: boolean
  statusCode: number
  message: string
  timestamp: string
  path?: string
  data?: T
}

export type SendOtpRequest = {
  phone: string
}

export type VerifyOtpRequest = {
  phone: string
  otp: string
}

type VerifyOtpRawResponse = {
  user: {
    s_no: number
    name?: string
    email?: string
    phone?: string
  }
  accessToken?: string
  refreshToken?: string
  access_token?: string
  refresh_token?: string
}

export type VerifyOtpResponse = {
  user: VerifyOtpRawResponse['user']
  accessToken: string
  refreshToken?: string
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

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    sendOtp: builder.mutation<ApiResponseDto<any> | any, SendOtpRequest>({
      query: (body) => ({
        url: '/auth/send-otp',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response,
    }),

    verifyOtp: builder.mutation<VerifyOtpResponse, VerifyOtpRequest>({
      query: (body) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any): VerifyOtpResponse => {
        const r = unwrapApiOrCentralData<VerifyOtpRawResponse>(response)
        return {
          user: (r as any).user,
          accessToken: (r as any).accessToken ?? (r as any).access_token,
          refreshToken: (r as any).refreshToken ?? (r as any).refresh_token,
        }
      },
    }),
  }),
  overrideExisting: false,
})

export const { useSendOtpMutation, useVerifyOtpMutation } = authApi
