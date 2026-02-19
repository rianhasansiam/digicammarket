import { useDispatch, useSelector } from 'react-redux'
import { useCallback } from 'react'

// Enhanced hooks for Redux with error handling
export const useAppDispatch = () => useDispatch()

// Safe defaults map for common selector paths
const SAFE_DEFAULTS = {
  cartItems: [],
  cartQuantity: 0,
  cartAmount: 0,
  wishlistItems: [],
  wishlistTotal: 0
}

// Enhanced selector with error handling to prevent proxy revocation errors
export const useAppSelector = (selector, defaultValue = null) => {
  return useSelector(useCallback((state) => {
    try {
      if (!state || !state.user) {
        return defaultValue
      }
      const result = selector(state)
      return result ?? defaultValue
    } catch (error) {
      console.error('Error in useAppSelector:', error)
      return defaultValue
    }
  }, [selector, defaultValue]))
}