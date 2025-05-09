import { useState } from 'react'
import { ethers } from 'ethers'
import { Navbar } from '@/components/Navbar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ClipboardIcon,
  CopyIcon,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

// ABI for the faucet contract (simplified version)
const faucetAbi = [
  'function requestTokens(address recipient) external',
  'function getTokenBalance() external view returns (uint256)',
]

export function Faucet() {
  const [address, setAddress] = useState('')
  const [isValidAddress, setIsValidAddress] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<
    'idle' | 'processing' | 'success' | 'error'
  >('idle')
  const [remainingTokens, setRemainingTokens] = useState<string | null>(null)
  const { toast } = useToast()

  const faucetAddress =
    import.meta.env.VITE_Faucet || '0x8d7404a3D9b90877e4d1464b98b0D49bB3081203'
  const tokenAddress =
    import.meta.env.VITE_PKMBToken ||
    '0xEf89f9724d93b3fF5Ef65E9c8E630EA95b5E5643'

  const validateAddress = (addr: string) => {
    try {
      return ethers.utils.isAddress(addr)
    } catch {
      return false
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputAddress = e.target.value
    setAddress(inputAddress)

    if (inputAddress && !validateAddress(inputAddress)) {
      setIsValidAddress(false)
    } else {
      setIsValidAddress(true)
    }
  }

  const fetchTokenBalance = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const faucetContract = new ethers.Contract(
          faucetAddress,
          faucetAbi,
          provider
        )
        const balance = await faucetContract.getTokenBalance()
        setRemainingTokens(ethers.utils.formatEther(balance))
      }
    } catch (error) {
      console.error('Error fetching token balance:', error)
    }
  }

  const handleClaim = async () => {
    if (!address || !validateAddress(address)) {
      setIsValidAddress(false)
      return
    }

    setIsLoading(true)
    setTransactionStatus('processing')

    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()

        const faucetContract = new ethers.Contract(
          faucetAddress,
          faucetAbi,
          signer
        )

        const tx = await faucetContract.requestTokens(address)
        await tx.wait()

        setTransactionStatus('success')
        toast({
          title: 'Tokens claimed successfully!',
          description: 'PKMB tokens have been sent to your wallet.',
          variant: 'default',
        })

        // Refresh token balance
        fetchTokenBalance()
      } else {
        toast({
          title: 'Metamask not detected',
          description: 'Please install Metamask to use this feature.',
          variant: 'destructive',
        })
        setTransactionStatus('error')
      }
    } catch (error) {
      console.error('Error claiming tokens:', error)
      setTransactionStatus('error')
      toast({
        title: 'Failed to claim tokens',
        description: 'There was an error processing your request.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyAddress = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Address copied!',
      description: 'Contract address copied to clipboard',
    })
  }

  // Fetch token balance on component mount
  useState(() => {
    fetchTokenBalance()
  })

  return (
    <>
      <Navbar />
      <AuroraBackground animate={true} speed={2}>
        <div className="container mx-auto px-4 pt-20 pb-10 min-h-screen flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="bg-background/80 backdrop-blur-sm border-2 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  PKMB Faucet
                </CardTitle>
                <CardDescription className="text-center">
                  Claim PKMB tokens for testing purposes
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Token:</span>
                    <span className="font-semibold">$PKMB</span>
                  </div>
                  <div className="flex items-center">
                    <span className="truncate text-xs mr-1 opacity-70">
                      {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyAddress(tokenAddress)}
                    >
                      <CopyIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {remainingTokens !== null && (
                  <div className="text-sm flex justify-between items-center py-2">
                    <span className="text-muted-foreground">
                      Remaining tokens:
                    </span>
                    <span className="font-medium">{remainingTokens} PKMB</span>
                  </div>
                )}

                <div className="mt-6">
                  <label
                    htmlFor="address"
                    className="text-sm font-medium block mb-2"
                  >
                    Your wallet address
                  </label>
                  <div className="relative">
                    <Input
                      id="address"
                      placeholder="0x..."
                      value={address}
                      onChange={handleAddressChange}
                      className={
                        !isValidAddress
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : ''
                      }
                    />
                    {!isValidAddress && address && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  {!isValidAddress && address && (
                    <p className="text-red-500 text-xs mt-1">
                      Please enter a valid Ethereum address
                    </p>
                  )}
                </div>

                {transactionStatus === 'success' && (
                  <Alert className="bg-green-500/10 text-green-500 border-green-500/20">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>
                      Tokens have been sent to your wallet.
                    </AlertDescription>
                  </Alert>
                )}

                {transactionStatus === 'error' && (
                  <Alert className="bg-red-500/10 text-red-500 border-red-500/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Failed to claim tokens. Please try again later.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleClaim}
                  disabled={isLoading || !address || !isValidAddress}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Claim PKMB Tokens'
                  )}
                </Button>
              </CardFooter>
            </Card>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Use this faucet for testnet purposes only.</p>
              <p className="mt-1">Limited to one request per wallet.</p>
            </div>
          </motion.div>
        </div>
      </AuroraBackground>
    </>
  )
}
