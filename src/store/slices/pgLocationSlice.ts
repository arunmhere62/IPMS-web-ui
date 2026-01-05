import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type PGLocationState = {
  selectedPGLocationId: number | null
}

const initialState: PGLocationState = {
  selectedPGLocationId: null,
}

const pgLocationSlice = createSlice({
  name: 'pgLocations',
  initialState,
  reducers: {
    setSelectedPGLocation: (state, action: PayloadAction<number | null>) => {
      state.selectedPGLocationId = action.payload
    },
  },
})

export const { setSelectedPGLocation } = pgLocationSlice.actions
export default pgLocationSlice.reducer
