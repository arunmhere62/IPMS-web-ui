export interface User {
  s_no: number
  name: string
  email: string
  phone?: string
  role_id: number
  role_name?: string
  organization_id: number
  organization_name?: string
  organization_description?: string
  status?: 'ACTIVE' | 'INACTIVE'
  address?: string
  city_id?: number
  state_id?: number
  city_name?: string
  state_name?: string
  gender?: 'MALE' | 'FEMALE'
  profile_images?: any
  pincode?: string
  country?: string
  created_at?: string
  updated_at?: string
  pg_locations?: Array<{
    s_no: number
    location_name: string
    address?: string
    pincode?: string
    status?: 'ACTIVE' | 'INACTIVE'
    pg_type?: string
    rent_cycle_type?: string
    rent_cycle_start?: number | null
    rent_cycle_end?: number | null
    city_id?: number | null
    state_id?: number | null
  }>
}

export interface PGLocation {
  s_no: number
  location_name: string
  address: string
  pincode?: string
  city_id?: number
  state_id?: number
  status?: 'ACTIVE' | 'INACTIVE'
  images?: any
  organization_id: number
}

export interface Payment {
  s_no: number
  tenant_id: number
  pg_id: number
  room_id: number
  bed_id: number
  amount_paid: number
  payment_date?: string
  payment_method: 'GPAY' | 'PHONEPE' | 'CASH' | 'BANK_TRANSFER'
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'FAILED' | 'REFUNDED'
  remarks?: string
  actual_rent_amount: number
  start_date?: string
  end_date?: string
  current_bill?: number
  current_bill_id?: number
  tenant_unavailable_reason?: 'NOT_FOUND' | 'DELETED' | 'CHECKED_OUT' | 'INACTIVE' | null
  tenants?: {
    s_no: number
    tenant_id: string
    name: string
    phone_no?: string
    is_deleted?: boolean
    status?: string
    check_out_date?: string
  }
  rooms?: {
    s_no: number
    room_no?: string
  }
  beds?: {
    s_no: number
    bed_no: string
  }
  pg_locations?: {
    s_no: number
    location_name: string
  }
}
