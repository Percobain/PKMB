import { Faucet } from '@/pages/Faucet'
import { Landing } from '@/pages/Landing'
import { Route, Routes } from 'react-router-dom'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="*" element={<Landing />} />
      <Route path="/faucet" element={<Faucet />} />
    </Routes>
  )
}

export default AppRoutes
