import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { useMetaMask } from "../hooks/useMetamask"
import { Check, Copy, LogOut } from "lucide-react"
import { toast } from "sonner"

export function ConnectButton() {
  const { isConnected, account, connect, disconnect } = useMetaMask()
  const [showDropdown, setShowDropdown] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`
  }

  const copyToClipboard = () => {
    if (account) {
      navigator.clipboard.writeText(account)
      setCopied(true)
      toast.success("Address copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClick = () => {
    if (isConnected) {
      setShowDropdown(!showDropdown)
    } else {
      connect()
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setShowDropdown(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={handleClick}
        variant={isConnected ? "outline" : "default"}
        className="flex items-center gap-2"
      >
        {isConnected ? formatAddress(account!) : "Connect Wallet"}
      </Button>

      {showDropdown && isConnected && (
        <div className="absolute right-0 mt-2 w-64 rounded-md border bg-background shadow-lg z-10">
          <div className="p-2">
            <div
              className="flex items-center justify-between rounded-md p-2 cursor-pointer hover:bg-muted"
              onClick={copyToClipboard}
            >
              <span className="text-sm font-medium truncate">{account}</span>
              <button className="ml-2">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div
              className="flex items-center rounded-md p-2 cursor-pointer hover:bg-muted mt-1"
              onClick={handleDisconnect}
            >
              <LogOut size={16} className="mr-2" />
              <span className="text-sm font-medium">Disconnect Wallet</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}