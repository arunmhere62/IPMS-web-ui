import { api } from './api'

const TAG_TYPE = 'UserPermissionOverrides' as const

type ApiResponseDto<T> = {
  success: boolean
  statusCode: number
  message: string
  timestamp: string
  path?: string
  data?: T
}

export type UserPermissionOverride = {
  s_no: number
  user_id: number
  permission_id: number
  effect: 'ALLOW' | 'DENY' | string
  created_by: number | null
  expires_at: string | null
  created_at: string
  updated_at: string
  permissions_master?: {
    s_no: number
    screen_name: string
    action: string
    description: string | null
  }
  users_user_permission_overrides_user_idTousers?: {
    s_no: number
    name: string
    email: string
    phone: string
    role_id: number
    organization_id: number
  }
}

export type ListOverridesArgs = { user_id?: number; permission_id?: number } | void

export type UpsertOverridePayload = {
  user_id: number
  permission_id: number
  effect: 'ALLOW' | 'DENY'
  created_by?: number
  expires_at?: string
}

export type RemoveOverridePayload = {
  user_id: number
  permission_id: number
}

export const userPermissionOverridesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listUserPermissionOverrides: builder.query<ApiResponseDto<UserPermissionOverride[]>, ListOverridesArgs>(
      {
        query: (args) => ({
          url: '/user-permission-overrides',
          params: args ?? undefined,
        }),
        providesTags: [{ type: TAG_TYPE, id: 'LIST' }],
      }
    ),

    upsertUserPermissionOverride: builder.mutation<ApiResponseDto<UserPermissionOverride>, UpsertOverridePayload>(
      {
        query: (body) => ({
          url: '/user-permission-overrides',
          method: 'POST',
          body,
        }),
        invalidatesTags: [{ type: TAG_TYPE, id: 'LIST' }],
      }
    ),

    removeUserPermissionOverride: builder.mutation<ApiResponseDto<null>, RemoveOverridePayload>({
      query: (body) => ({
        url: '/user-permission-overrides',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: [{ type: TAG_TYPE, id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
})

export const {
  useListUserPermissionOverridesQuery,
  useUpsertUserPermissionOverrideMutation,
  useRemoveUserPermissionOverrideMutation,
} = userPermissionOverridesApi
