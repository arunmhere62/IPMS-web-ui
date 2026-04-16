import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type AuthUser = Record<string, any> | null

export type AuthState = {
  user: AuthUser
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
    },
    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthUser
        accessToken: string
        refreshToken?: string
      }>
    ) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken ?? null
      state.isAuthenticated = true
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
})

export const { logout, setCredentials, updateUser } = authSlice.actions
export default authSlice.reducer
