import { configureStore } from "@reduxjs/toolkit"
import userReducer from "./slice"
import dataReducer from "./dataSlice"

export const makeStore = () => {
  return configureStore({
    reducer: {
      user: userReducer,
      data: dataReducer,
    },
  })
}