import { Faucet } from '@/pages/Faucet'
import { Landing } from '@/pages/Landing'
import { Nft } from '@/pages/Nft'
import { Route, Routes } from 'react-router-dom'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="*" element={<Landing />} />
      <Route path="/faucet" element={<Faucet />} />
      <Route path="/nft" element={<Nft/>} />
    </Routes>
  )
}

export default AppRoutes
