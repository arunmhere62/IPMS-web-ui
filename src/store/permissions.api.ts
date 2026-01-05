import { api } from './api'

const TAG_TYPE = 'Permissions' as const

type ApiResponseDto<T> = {
  success: boolean
  statusCode: number
  message: string
  timestamp: string
  path?: string
  data?: T
}

export type Permission = {
  s_no: number
  screen_name: string
  action: 'CREATE' | 'EDIT' | 'VIEW' | 'DELETE' | string
  description: string | null
  created_at: string
  updated_at: string
}

export type CreatePermissionPayload = {
  screen_name: string
  action: Permission['action']
  description?: string
}

export type UpdatePermissionPayload = Partial<CreatePermissionPayload>

export type BulkUpsertPermissionsPayload = {
  screen_name: string
  actions: Array<Permission['action']>
  description?: string
}

export const permissionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPermissions: builder.query<ApiResponseDto<Permission[]>, void>({
      query: () => '/permissions',
      providesTags: [{ type: TAG_TYPE, id: 'LIST' }],
    }),

    createPermission: builder.mutation<ApiResponseDto<Permission>, CreatePermissionPayload>({
      query: (body) => ({
        url: '/permissions',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: TAG_TYPE, id: 'LIST' }],
    }),

    bulkUpsertPermissions: builder.mutation<ApiResponseDto<Permission[]>, BulkUpsertPermissionsPayload>({
      query: (body) => ({
        url: '/permissions/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: TAG_TYPE, id: 'LIST' }],
    }),

    updatePermission: builder.mutation<
      ApiResponseDto<Permission>,
      { id: number; body: UpdatePermissionPayload }
    >({
      query: ({ id, body }) => ({
        url: `/permissions/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: TAG_TYPE, id: 'LIST' },
        { type: TAG_TYPE, id: arg.id },
      ],
    }),

    deletePermission: builder.mutation<ApiResponseDto<null>, number>({
      query: (id) => ({
        url: `/permissions/${id}`,
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
  useGetPermissionsQuery,
  useCreatePermissionMutation,
  useBulkUpsertPermissionsMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
} = permissionsApi
