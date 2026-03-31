import { configureStore } from '@reduxjs/toolkit'
import ioReducer from "./ioSlices"

export const store = configureStore({
  reducer: {
    io:ioReducer,
  },
})
