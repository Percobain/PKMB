import { BrowserRouter as Router } from 'react-router-dom'
import AppRoutes from '@/router/routes'
import { CommandMenu } from '@/components/CommandMenu'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import Clarity from '@microsoft/clarity'

function App() {
  const projectId = 'rhb9flobls'
  Clarity.init(projectId)
  return (
    <ThemeProvider>
      <Router>
        <CommandMenu />
        <AppRoutes />
        <Toaster />
      </Router>
    </ThemeProvider>
  )
}

export default App
