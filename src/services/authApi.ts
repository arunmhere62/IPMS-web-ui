import { baseApi } from './baseApi'

// Backend wraps all responses with ResponseUtil.success():
// { success: boolean, statusCode: number, message: string, data: T, timestamp?: string }
type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
  timestamp?: string
  path?: string
}

const isApiEnvelope = <T>(v: unknown): v is ApiEnvelope<T> =>
  typeof v === 'object' && v !== null && 'success' in v && 'statusCode' in v && 'data' in v

const unwrap = <T>(response: unknown): T => {
  if (isApiEnvelope<T>(response)) return response.data
  return response as T
}

// User shape returned by /auth/verify-otp
export type ApiUser = {
  s_no: number
  name: string
  email: string
  phone: string
  role_id: number
  role_name: string
  organization_id: number | null
  organization_name?: string
  status: string
  address?: string | null
  city_id?: number | null
  state_id?: number | null
  gender?: string | null
}

// Raw token shape from jwt.service.ts generateTokens()
type TokenData = {
  access_token: string
  refresh_token: string
  token_type: 'Bearer'
  expires_in: number
}

// /auth/verify-otp data field
type VerifyOtpData = { user: ApiUser } & TokenData

// /auth/send-otp and /auth/send-signup-otp data field
type OtpSendData = { phone: string; expiresIn: string }

// /auth/signup data field
type SignupData = {
  userId: number
  pgId: number
  organizationId: number
  email?: string
  name: string
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

export type SendOtpResponse = { phone: string; expiresIn: string }

export type VerifyOtpResponse = {
  user: ApiUser
  accessToken: string
  refreshToken: string
}

export type RefreshTokenRequest = { refreshToken: string }

export type RefreshTokenResponse = {
  accessToken: string
  refreshToken: string
}

export type SignupResponse = {
  success: boolean
  message: string
  data: SignupData
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    sendOtp: build.mutation<SendOtpResponse, SendOtpRequest>({
      query: (body) => ({ url: '/auth/send-otp', method: 'POST', body }),
      transformResponse: (r: unknown): SendOtpResponse => unwrap<OtpSendData>(r),
    }),

    verifyOtp: build.mutation<VerifyOtpResponse, VerifyOtpRequest>({
      query: (body) => ({ url: '/auth/verify-otp', method: 'POST', body }),
      transformResponse: (response: unknown): VerifyOtpResponse => {
        const r = unwrap<VerifyOtpData>(response)
        return {
          user: r.user,
          accessToken: r.access_token,
          refreshToken: r.refresh_token,
        }
      },
    }),

    sendSignupOtp: build.mutation<SendOtpResponse, SendOtpRequest>({
      query: (body) => ({ url: '/auth/send-signup-otp', method: 'POST', body }),
      transformResponse: (r: unknown): SendOtpResponse => unwrap<OtpSendData>(r),
    }),

    verifySignupOtp: build.mutation<SendOtpResponse, VerifyOtpRequest>({
      query: (body) => ({ url: '/auth/verify-signup-otp', method: 'POST', body }),
      transformResponse: (r: unknown): SendOtpResponse => unwrap<OtpSendData>(r),
    }),

    signup: build.mutation<SignupResponse, SignupRequest>({
      query: (body) => ({ url: '/auth/signup', method: 'POST', body }),
      transformResponse: (r: unknown): SignupResponse => r as SignupResponse,
    }),

    logout: build.mutation<{ success: boolean; message: string }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      transformResponse: (r: unknown) => r as { success: boolean; message: string },
    }),

    refreshToken: build.mutation<RefreshTokenResponse, RefreshTokenRequest>({
      query: (body) => ({ url: '/auth/refresh', method: 'POST', body }),
      transformResponse: (response: unknown): RefreshTokenResponse => {
        const r = unwrap<TokenData>(response)
        return {
          accessToken: r.access_token,
          refreshToken: r.refresh_token,
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
