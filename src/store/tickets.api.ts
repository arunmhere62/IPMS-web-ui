import { api } from './api'

export type TicketCategory = 'BUG' | 'FEATURE_REQUEST' | 'SUPPORT' | 'OTHER' | string
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | string

export type TicketComment = {
  s_no: number
  ticket_id: number
  user_id: number | null
  author_source?: 'CONSUMER' | 'MANAGEMENT' | string
  management_user_id?: number | null
  management_user_name?: string | null
  management_user_email?: string | null
  comment: string
  attachments?: string[]
  created_at: string
  users?: {
    s_no: number
    name?: string
    email?: string
  }
}

export type Ticket = {
  s_no: number
  ticket_number: string
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  reported_by: number
  assigned_to?: number | null
  organization_id?: number | null
  pg_id?: number | null
  attachments?: string[]
  resolution?: string | null
  created_at: string
  updated_at: string
  resolved_at?: string | null
  users_issue_tickets_reported_byTousers?: {
    s_no: number
    name?: string
    email?: string
    roles?: { role_name?: string }
  }
  users_issue_tickets_assigned_toTousers?: {
    s_no: number
    name?: string
    email?: string
  } | null
  issue_ticket_comments?: TicketComment[]
}

export type Pagination = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore?: boolean
}

export type PaginatedData<T> = {
  data: T[]
  pagination: Pagination
}

export type ApiResponseDto<T> = {
  success: boolean
  statusCode: number
  message: string
  timestamp: string
  path?: string
  data?: T
}

export type TicketListFilters = {
  page?: number
  limit?: number
  status?: string
  category?: string
  priority?: string
  my_tickets?: boolean
  search?: string
}

export type CreateTicketBody = {
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  attachments?: string[]
  pg_id?: number
}

export type UpdateTicketBody = {
  title?: string
  description?: string
  category?: TicketCategory
  priority?: TicketPriority
  status?: TicketStatus
  resolution?: string
  assigned_to?: number
  attachments?: string[]
}

export type AddTicketCommentBody = {
  comment: string
  attachments?: string[]
}

export const ticketsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query<ApiResponseDto<PaginatedData<Ticket>>, TicketListFilters | void>({
      query: (args) => {
        const page = args?.page ?? 1
        const limit = args?.limit ?? 20
        return {
          url: '/tickets',
          params: {
            page,
            limit,
            status: args?.status,
            category: args?.category,
            priority: args?.priority,
            my_tickets: args?.my_tickets,
            search: args?.search,
          },
        }
      },
      providesTags: [{ type: 'Tickets', id: 'LIST' }],
    }),

    getTicketById: builder.query<ApiResponseDto<Ticket>, number>({
      query: (id) => `/tickets/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Ticket', id }],
    }),

    updateTicket: builder.mutation<ApiResponseDto<Ticket>, { id: number; body: UpdateTicketBody }>({
      query: ({ id, body }) => ({
        url: `/tickets/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Tickets', id: 'LIST' },
        { type: 'Ticket', id: arg.id },
      ],
    }),

    addTicketComment: builder.mutation<any, { id: number; body: AddTicketCommentBody }>({
      query: ({ id, body }) => ({
        url: `/tickets/${id}/comments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'Ticket', id: arg.id }],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetTicketsQuery,
  useGetTicketByIdQuery,
  useUpdateTicketMutation,
  useAddTicketCommentMutation,
} = ticketsApi
