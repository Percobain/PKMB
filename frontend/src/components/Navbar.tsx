// import { ModeToggle } from './ModeToggle'
import { Link } from 'react-router-dom'
import { ConnectButton } from './ConnectButton'

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-bold text-xl">
          PKMB
        </Link>
        <div className="flex items-center gap-4">
          <ConnectButton />
          {/* <ModeToggle /> */}
        </div>
      </div>
    </nav>
  )
}