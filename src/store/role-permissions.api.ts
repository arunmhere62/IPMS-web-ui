import { api } from './api'

const TAG_TYPE = 'RolePermissions' as const

type ApiResponseDto<T> = {
  success: boolean
  statusCode: number
  message: string
  timestamp: string
  path?: string
  data?: T
}

export type PermissionWithGranted = {
  s_no: number
  screen_name: string
  action: 'CREATE' | 'EDIT' | 'VIEW' | 'DELETE' | string
  description: string | null
  created_at: string
  updated_at: string
  granted: boolean
}

export type RolePermissionsResponse = {
  role: { s_no: number; role_name: string; status: string | null }
  permissions: PermissionWithGranted[]
  summary: { total_permissions: number; granted_permissions: number }
}

export type AssignPermissionsPayload = {
  permission_keys: string[]
  replace_all?: boolean
}

export type BulkUpdatePayload = {
  permissions: Record<string, boolean>
}

export const rolePermissionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRolePermissions: builder.query<ApiResponseDto<RolePermissionsResponse>, number>({
      query: (roleId) => `/role-permissions/${roleId}`,
      providesTags: (_res, _err, roleId) => [{ type: TAG_TYPE, id: roleId }],
    }),

    assignRolePermissions: builder.mutation<
      ApiResponseDto<any>,
      { roleId: number; body: AssignPermissionsPayload }
    >({
      query: ({ roleId, body }) => ({
        url: `/role-permissions/${roleId}/assign`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: TAG_TYPE, id: arg.roleId }],
    }),

    bulkUpdateRolePermissions: builder.mutation<
      ApiResponseDto<any>,
      { roleId: number; body: BulkUpdatePayload }
    >({
      query: ({ roleId, body }) => ({
        url: `/role-permissions/${roleId}/bulk-update`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: TAG_TYPE, id: arg.roleId }],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetRolePermissionsQuery,
  useAssignRolePermissionsMutation,
  useBulkUpdateRolePermissionsMutation,
} = rolePermissionsApi
