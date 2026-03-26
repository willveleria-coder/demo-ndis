import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Global navigation listener - add this to your main App component
export function useGlobalLoadingReset() {
  const location = useLocation()

  useEffect(() => {
    // Force all loading spinners to stop after navigation
    const timer = setTimeout(() => {
      // Find all elements with loading classes and hide them
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], .animate-spin')
      loadingElements.forEach(el => {
        el.style.display = 'none'
      })
      
      // Reset any stuck loading states by dispatching a custom event
      window.dispatchEvent(new CustomEvent('forceLoadingReset'))
    }, 1500)

    return () => clearTimeout(timer)
  }, [location.pathname])
}