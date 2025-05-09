import { BrowserRouter as Router } from 'react-router-dom'
import AppRoutes from '@/router/routes'
import { CommandMenu } from '@/components/CommandMenu'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="pkmb-theme">
      <Router>
        <CommandMenu />
        <AppRoutes />
        <Toaster />
      </Router>
    </ThemeProvider>
  )
}

export default App
