import { baseApi } from './baseApi'

export type AppPublicStatus = {
  show_announcement?: boolean
  announcement_title?: string | null
  announcement_message?: string | null
  maintenance_mode?: boolean
  maintenance_message?: string | null
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

export const appSettingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAppPublicStatus: build.query<AppPublicStatus, void>({
      query: () => ({ url: '/app-settings/public', method: 'GET' }),
      transformResponse: (response: unknown) =>
        unwrapCentralData<AppPublicStatus>(response),
    }),
  }),
  overrideExisting: false,
})

export const { useGetAppPublicStatusQuery, useLazyGetAppPublicStatusQuery } =
  appSettingsApi
