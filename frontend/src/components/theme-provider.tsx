'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'dark',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {  // Always use dark theme
  const defaultTheme = 'dark'
  const storageKey = 'vite-ui-theme'
  const [theme] = useState<Theme>(defaultTheme)

  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove any existing theme classes
    root.classList.remove('light', 'system')
    
    // Ensure dark class is always applied
    if (!root.classList.contains('dark')) {
      root.classList.add('dark')
    }
  }, [])

  // Keep the setTheme function for API compatibility, but make it do nothing
  const value = {
    theme,
    setTheme: () => {
      // Do nothing - always stay in dark mode
      console.log('Theme switching is disabled - app is always in dark mode')
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
