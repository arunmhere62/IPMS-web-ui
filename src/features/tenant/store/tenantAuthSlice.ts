import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type TenantUser = {
  tenant_id: number
  name: string
  phone: string
  email: string | null
  status: string
  organization_id?: number | null
  room_no?: string | null
  bed_no?: string | null
  bed_price?: string | null
  payment_status?: string | null
  rent_due_amount?: number
  pending_months?: number
  check_in_date?: string | null
}

export type TenantPG = {
  pg_id: number
  location_name: string
  address: string
  city?: string | null
  state?: string | null
  rent_cycle_type?: string
}

export type TenantAuthState = {
  tenant: TenantUser | null
  pg: TenantPG | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  lastUserRole: 'tenant' | null
}

const initialState: TenantAuthState = {
  tenant: null,
  pg: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  lastUserRole: null,
}

const tenantAuthSlice = createSlice({
  name: 'tenantAuth',
  initialState,
  reducers: {
    setTenantCredentials: (
      state,
      action: PayloadAction<{
        tenant: TenantUser
        pg: TenantPG | null
        accessToken: string
        refreshToken: string
      }>
    ) => {
      state.tenant = action.payload.tenant
      state.pg = action.payload.pg
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
      state.lastUserRole = 'tenant'
    },
    setTenantData: (
      state,
      action: PayloadAction<{
        tenant: TenantUser
        pg: TenantPG | null
        room_no?: string | null
        bed_no?: string | null
        bed_price?: string | null
        payment_status?: string | null
        rent_due_amount?: number
        pending_months?: number
        check_in_date?: string | null
      }>
    ) => {
      state.tenant = {
        ...action.payload.tenant,
        room_no: action.payload.room_no,
        bed_no: action.payload.bed_no,
        bed_price: action.payload.bed_price,
        payment_status: action.payload.payment_status,
        rent_due_amount: action.payload.rent_due_amount,
        pending_months: action.payload.pending_months,
        check_in_date: action.payload.check_in_date,
      }
      state.pg = action.payload.pg
    },
    updateTenantInfo: (state, action: PayloadAction<Partial<TenantUser>>) => {
      if (state.tenant) {
        state.tenant = { ...state.tenant, ...action.payload }
      }
    },
    updateTenantAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload
    },
    tenantLogout: (state) => {
      state.tenant = null
      state.pg = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.lastUserRole = 'tenant'
    },
    setLastUserRole: (state, action: PayloadAction<'tenant' | null>) => {
      state.lastUserRole = action.payload
    },
    resetTenantAuth: () => {
      return initialState
    },
  },
})

export const { setTenantCredentials, setTenantData, updateTenantInfo, updateTenantAccessToken, tenantLogout, setLastUserRole, resetTenantAuth } = tenantAuthSlice.actions
export default tenantAuthSlice.reducer
