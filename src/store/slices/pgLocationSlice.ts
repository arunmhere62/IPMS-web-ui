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
    resetPGLocation: () => initialState,
  },
})

export const { setSelectedPGLocation, resetPGLocation } = pgLocationSlice.actions
export default pgLocationSlice.reducer
