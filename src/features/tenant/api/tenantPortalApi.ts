import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getCookie } from '@/lib/cookies'
import type { RootState } from '@/store/store'

// Use proxy path for development to avoid CORS
// The Vite proxy will forward /api requests to http://localhost:3001
const BASE_URL = '/api/v1'

// Separate base API for tenant portal to avoid tag conflicts
export const tenantBaseApi = createApi({
  reducerPath: 'tenantBaseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState
      const token = getCookie('access_token')
      const tenant = state.tenantAuth.tenant
      const pg = state.tenantAuth.pg

      console.log('TenantBaseApi - Preparing headers:', { 
        hasToken: !!token, 
        tenant: tenant,
        pg: pg 
      })

      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }

      // Set tenant headers from Redux store
      if (tenant?.tenant_id) {
        headers.set('x-tenant-id', String(tenant.tenant_id))
        console.log('TenantBaseApi - x-tenant-id header set:', tenant.tenant_id)
      } else {
        console.log('TenantBaseApi - WARNING: tenant_id not found in tenant data')
      }

      // pg_id from pg state
      if (pg?.pg_id) {
        headers.set('x-pg-id', String(pg.pg_id))
        console.log('TenantBaseApi - x-pg-id header set:', pg.pg_id)
      }

      // organization_id from tenant data
      if (tenant?.organization_id) {
        headers.set('x-organization-id', String(tenant.organization_id))
        console.log('TenantBaseApi - x-organization-id header set:', tenant.organization_id)
      }

      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['TenantProfile', 'TenantTickets'],
  endpoints: () => ({}),
})

// Portal types - matches mobile structure
export interface TenantProfileData {
  s_no: number
  tenant_id: string
  name: string
  phone_no: string
  whatsapp_number: string | null
  email: string | null
  status: string
  occupation: string | null
  tenant_address: string | null
  check_in_date: string | null
  check_out_date: string | null
  expected_vacate_date: string | null
  pg_id: number
  room_id: number
  bed_id: number
  city_id: number | null
  state_id: number | null
  city: { s_no: number; name: string } | null
  state: { s_no: number; name: string } | null
  pg_locations: {
    s_no: number
    location_name: string
    address: string
    rent_cycle_type: string
    city: { s_no: number; name: string; country_code: string; state_code: string } | null
    state: { s_no: number; name: string; iso_code: string; country_code: string } | null
  } | null
  rooms: { s_no: number; room_no: string } | null
  beds: { s_no: number; bed_no: string; bed_price: string } | null
  tenant_rent_cycles: Array<{
    s_no: number
    cycle_type: string
    anchor_day: number | null
    cycle_start: string
    cycle_end: string | null
  }>
  images: string[]
  proof_documents: string[]
  rent_payments: Array<{
    s_no: number
    payment_date: string
    pg_id: number
    room_id: number
    bed_id: number
    amount_paid: string
    actual_rent_amount: string
    cycle_id: number
    payment_method: string
    status: string
    remarks: string | null
    bed_rent_amount_snapshot: number
    tenant_rent_cycles: { s_no: number; cycle_type: string; cycle_start: string; cycle_end: string } | null
    pg_locations: { s_no: number; location_name: string } | null
    rooms: { s_no: number; room_no: string } | null
    beds: { s_no: number; bed_no: string } | null
  }>
  advance_payments: Array<{
    s_no: number
    payment_date: string
    pg_id: number
    room_id: number
    bed_id: number
    amount_paid: string
    actual_rent_amount: string
    payment_method: string
    status: string
    remarks: string | null
    pg_locations: { s_no: number; location_name: string } | null
    rooms: { s_no: number; room_no: string } | null
    beds: { s_no: number; bed_no: string } | null
  }>
  refund_payments: Array<{
    s_no: number
    payment_date: string
    amount_paid: string
    payment_method: string
    status: string
    remarks: string | null
  }>
  current_bills: any[]
  tenant_allocations: Array<{
    s_no: number
    effective_from: string
    effective_to: string | null
    bed_price_snapshot: string
    pg_id: number
    room_id: number
    bed_id: number
    pg_locations: { s_no: number; location_name: string } | null
    rooms: { s_no: number; room_no: string } | null
    beds: { s_no: number; bed_no: string } | null
  }>
  is_rent_paid: boolean
  is_rent_partial: boolean
  rent_due_amount: number
  partial_due_amount: number
  pending_due_amount: number
  is_advance_paid: boolean
  is_refund_paid: boolean
  pending_months: number
  unpaid_months: Array<{ cycle_start: string; cycle_end: string; cycle_type: string }>
  payment_status: string
}

export interface TicketOverview {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
  highPriority: number
}

export interface Ticket {
  s_no: number
  title: string
  status: string
  priority: string
  category: string
  created_at: string
  _count: {
    tenant_ticket_comments: number
  }
}

export interface UnreadTickets {
  count: number
  tickets: Ticket[]
}

export interface TenantTicketStatsData {
  overview: TicketOverview
  recentTickets: Ticket[]
  unreadTickets: UnreadTickets
}

export interface TenantProfileResponse {
  statusCode: number
  message: string
  success: boolean
  timestamp: string
  data: TenantProfileData
}

export interface TenantTicketStatsResponse {
  success: boolean
  message: string
  data: TenantTicketStatsData
}

export interface UpdateExpectedVacateDateRequest {
  expected_vacate_date: string | null
}

export interface UpdateExpectedVacateDateResponse {
  success: boolean
  message: string
  data: any
}

// Ticket types
export type TenantTicketCategory = 'MAINTENANCE' | 'COMPLAINT' | 'REQUEST' | 'OTHER'
export type TenantTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type TenantTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface TenantTicket {
  s_no: number
  category: TenantTicketCategory
  title: string
  description: string | null
  status: TenantTicketStatus
  priority: TenantTicketPriority
  created_at: string
  updated_at: string
  users: { s_no: number; name: string } | null
  _count?: { tenant_ticket_comments: number }
}

export interface TenantTicketComment {
  s_no: number
  ticket_id: number
  sender_type: 'TENANT' | 'OWNER'
  sender_id: number
  message: string | null
  attachments: string[] | null
  created_at: string
}

export interface TenantTicketDetail extends TenantTicket {
  tenant_ticket_comments: TenantTicketComment[]
}

export interface CreateTenantTicketPayload {
  category: TenantTicketCategory
  title: string
  description?: string
  priority?: TenantTicketPriority
}

export interface AddTenantCommentPayload {
  message?: string
  attachments?: string[]
}

export interface GetTenantTicketsResponse {
  tickets: TenantTicket[]
  total: number
  page: number
  limit: number
}

export const tenantPortalApi = tenantBaseApi.injectEndpoints({
  endpoints: (build) => ({
    getTenantProfile: build.query<TenantProfileResponse, void>({
      query: () => ({
        url: 'tenant/profile',
        method: 'GET',
      }),
      providesTags: ['TenantProfile'],
    }),
    getTenantTicketStats: build.query<TenantTicketStatsResponse, void>({
      query: () => ({
        url: 'tenant/ticket-stats',
        method: 'GET',
      }),
      providesTags: ['TenantTickets'],
    }),
    getTenantTickets: build.query<GetTenantTicketsResponse, { status?: string; page?: number; limit?: number }>({
      query: ({ status, page = 1, limit = 20 }) => ({
        url: 'tenant/tickets',
        method: 'GET',
        params: { status, page, limit },
      }),
      providesTags: ['TenantTickets'],
    }),
    getTenantTicketById: build.query<TenantTicketDetail, number>({
      query: (id) => ({
        url: `tenant/tickets/${id}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, id) => [{ type: 'TenantTickets', id }],
    }),
    createTenantTicket: build.mutation<TenantTicket, CreateTenantTicketPayload>({
      query: (body) => ({
        url: 'tenant/tickets',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TenantTickets'],
    }),
    addTenantTicketComment: build.mutation<TenantTicketComment, { ticketId: number; payload: AddTenantCommentPayload }>({
      query: ({ ticketId, payload }) => ({
        url: `tenant/tickets/${ticketId}/comments`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: (_r, _e, { ticketId }) => [{ type: 'TenantTickets', id: ticketId }],
    }),
    closeTenantTicket: build.mutation<TenantTicket, number>({
      query: (id) => ({
        url: `tenant/tickets/${id}/close`,
        method: 'PATCH',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'TenantTickets' },
        { type: 'TenantTickets', id },
      ],
    }),
    updateExpectedVacateDate: build.mutation<UpdateExpectedVacateDateResponse, UpdateExpectedVacateDateRequest>({
      query: (data) => ({
        url: 'tenant/expected-vacate-date',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['TenantProfile'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetTenantProfileQuery,
  useLazyGetTenantProfileQuery,
  useGetTenantTicketStatsQuery,
  useGetTenantTicketsQuery,
  useGetTenantTicketByIdQuery,
  useCreateTenantTicketMutation,
  useAddTenantTicketCommentMutation,
  useCloseTenantTicketMutation,
  useUpdateExpectedVacateDateMutation,
} = tenantPortalApi
