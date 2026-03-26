import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const NavigationContext = createContext()

export function NavigationProvider({ children }) {
  const location = useLocation()
  const [isNavigating, setIsNavigating] = useState(false)
  const loadingTimeouts = useRef(new Set())
  const abortControllers = useRef(new Set())

  // Clear all loading states and abort operations on route change
  useEffect(() => {
    // Start navigation
    setIsNavigating(true)
    
    // Abort all ongoing requests
    abortControllers.current.forEach(controller => {
      try {
        controller.abort()
      } catch (e) {
        // Ignore abort errors
      }
    })
    abortControllers.current.clear()
    
    // Clear all timeouts
    loadingTimeouts.current.forEach(timeoutId => {
      clearTimeout(timeoutId)
    })
    loadingTimeouts.current.clear()

    // End navigation after a short delay
    const navigationTimeout = setTimeout(() => {
      setIsNavigating(false)
    }, 100)

    return () => {
      clearTimeout(navigationTimeout)
    }
  }, [location.pathname])

  const registerAbortController = (controller) => {
    abortControllers.current.add(controller)
    return () => abortControllers.current.delete(controller)
  }

  const registerTimeout = (timeoutId) => {
    loadingTimeouts.current.add(timeoutId)
    return () => loadingTimeouts.current.delete(timeoutId)
  }

  const value = {
    isNavigating,
    registerAbortController,
    registerTimeout,
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}

// Hook for pages to manage loading states safely
export function usePageLoading() {
  const { isNavigating, registerAbortController } = useNavigation()
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Safe setState that checks if component is still mounted
  const setLoadingIfMounted = (value) => {
    if (isMounted.current && !isNavigating) {
      setLoading(value)
    }
  }

  // Create abort controller for this page
  const abortController = useRef()
  useEffect(() => {
    abortController.current = new AbortController()
    const cleanup = registerAbortController(abortController.current)
    
    return cleanup
  }, [registerAbortController])

  return {
    loading: isNavigating ? false : loading, // Force loading off during navigation
    setLoading: setLoadingIfMounted,
    abortController: abortController.current,
    isNavigating,
  }
}