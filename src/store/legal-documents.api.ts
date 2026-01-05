import { api } from './api'

export type ApiResponseDto<T> = {
  success: boolean
  statusCode: number
  message: string
  timestamp: string
  path?: string
  data?: T
}

export type Pagination = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type PaginatedData<T> = {
  data: T[]
  pagination: Pagination
}

export type LegalDocument = {
  s_no: number
  type: string
  title: string
  version: string
  url: string
  is_active: boolean
  is_required: boolean
  effective_date: string
  expiry_date: string | null
  organization_id: number | null
  created_by: number | null
  updated_by: number | null
  created_at: string
  updated_at: string
}

export type GetLegalDocumentsArgs = {
  page?: number
  limit?: number
  type?: string
  is_active?: boolean
  required_only?: boolean
  organization_id?: number
}

export type CreateLegalDocumentBody = {
  type: string
  title: string
  version: string
  url: string
  is_active?: boolean
  is_required?: boolean
  effective_date?: string
  expiry_date?: string | null
  organization_id?: number | null
}

export type UpdateLegalDocumentBody = Partial<CreateLegalDocumentBody>

export const legalDocumentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLegalDocuments: builder.query<
      ApiResponseDto<PaginatedData<LegalDocument>>,
      GetLegalDocumentsArgs | void
    >({
      query: (args) => {
        const page = args?.page ?? 1
        const limit = args?.limit ?? 20
        return {
          url: '/legal-documents',
          params: {
            page,
            limit,
            type: args?.type,
            is_active: args?.is_active,
            required_only: args?.required_only,
            organization_id: args?.organization_id,
          },
        }
      },
      providesTags: [{ type: 'LegalDocuments', id: 'LIST' }],
    }),

    createLegalDocument: builder.mutation<ApiResponseDto<LegalDocument>, CreateLegalDocumentBody>({
      query: (body) => ({
        url: '/legal-documents',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'LegalDocuments', id: 'LIST' }],
    }),

    updateLegalDocument: builder.mutation<
      ApiResponseDto<LegalDocument>,
      { id: number; body: UpdateLegalDocumentBody }
    >({
      query: ({ id, body }) => ({
        url: `/legal-documents/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'LegalDocuments', id: 'LIST' }],
    }),

    setLegalDocumentActive: builder.mutation<ApiResponseDto<LegalDocument>, { id: number; value: boolean }>(
      {
        query: ({ id, value }) => ({
          url: `/legal-documents/${id}/active`,
          method: 'PATCH',
          params: { value },
        }),
        invalidatesTags: [{ type: 'LegalDocuments', id: 'LIST' }],
      }
    ),
  }),
  overrideExisting: false,
})

export const {
  useGetLegalDocumentsQuery,
  useCreateLegalDocumentMutation,
  useUpdateLegalDocumentMutation,
  useSetLegalDocumentActiveMutation,
} = legalDocumentsApi
