import { api } from './api'

const TAG_TYPE = 'Roles' as const

type ApiResponseDto<T> = {
  success: boolean
  statusCode: number
  message: string
  timestamp: string
  path?: string
  data?: T
}

export type Role = {
  s_no: number
  role_name: string
  status: 'ACTIVE' | 'INACTIVE' | string | null
  created_at: string | null
  updated_at: string | null
  is_deleted: boolean | null
}

export type CreateRolePayload = {
  role_name: string
  status?: string
}

export type UpdateRolePayload = Partial<CreateRolePayload>

export const rolesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<ApiResponseDto<Role[]>, void>({
      query: () => '/roles',
      providesTags: [{ type: TAG_TYPE, id: 'LIST' }],
    }),

    createRole: builder.mutation<ApiResponseDto<Role>, CreateRolePayload>({
      query: (body) => ({
        url: '/roles',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: TAG_TYPE, id: 'LIST' }],
    }),

    updateRole: builder.mutation<ApiResponseDto<Role>, { id: number; body: UpdateRolePayload }>({
      query: ({ id, body }) => ({
        url: `/roles/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: TAG_TYPE, id: 'LIST' },
        { type: TAG_TYPE, id: arg.id },
      ],
    }),

    deleteRole: builder.mutation<ApiResponseDto<Role>, number>({
      query: (id) => ({
        url: `/roles/${id}`,
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
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = rolesApi
