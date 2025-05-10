import { Faucet } from '@/pages/Faucet'
import { Landing } from '@/pages/Landing'
import { Nft } from '@/pages/Nft'
import { MyNFTs } from '@/pages/MyNFTs'
import { ViewNftPage } from '@/pages/ViewNftPage';
import { Route, Routes } from 'react-router-dom'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="*" element={<Landing />} />
      <Route path="/faucet" element={<Faucet />} />
      <Route path="/mint" element={<Nft/>} />
      <Route path="/my-nfts" element={<MyNFTs />} />
      <Route path="/view-nft" element={<ViewNftPage />} />
    </Routes>
  )
}

export default AppRoutes
