import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, listener: (...args: any[]) => void) => void;
      removeAllListeners: (event: string) => void;
    };
  }
}

export interface MetaMaskState {
  isConnected: boolean
  account: string | null
  chainId: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

export function useMetaMask(): MetaMaskState {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<string | null>(null)

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected! Please install MetaMask.")
      return
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      })

      if (accounts.length > 0) {
        setAccount(accounts[0])
        setIsConnected(true)
        
        const chainId = await window.ethereum.request({
          method: "eth_chainId"
        })
        setChainId(chainId)
        
        toast.success("Connected to MetaMask successfully!")
      }
    } catch (error) {
      console.error("Error connecting to MetaMask:", error)
      toast.error("Failed to connect to MetaMask")
    }
  }, [])

  const disconnect = useCallback(() => {
    setAccount(null)
    setIsConnected(false)
    setChainId(null)
    toast.info("Disconnected from MetaMask")
  }, [])

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts"
          })
          
          if (accounts.length > 0) {
            setAccount(accounts[0])
            setIsConnected(true)
            
            const chainId = await window.ethereum.request({
              method: "eth_chainId"
            })
            setChainId(chainId)
          }
        } catch (error) {
          console.error("Error checking connection:", error)
        }
      }
    }
    
    checkConnection()

    // Setup event listeners
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect()
        } else {
          setAccount(accounts[0])
          setIsConnected(true)
          toast.info("Account changed")
        }
      })

      window.ethereum.on("chainChanged", (chainId: string) => {
        setChainId(chainId)
        toast.info("Network changed")
      })

      window.ethereum.on("disconnect", () => {
        disconnect()
      })
    }

    // Cleanup listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged")
        window.ethereum.removeAllListeners("chainChanged")
        window.ethereum.removeAllListeners("disconnect")
      }
    }
  }, [disconnect])

  return {
    isConnected,
    account,
    chainId,
    connect,
    disconnect
  }
}